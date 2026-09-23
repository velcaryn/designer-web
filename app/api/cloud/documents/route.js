import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';
import { computeInvoiceStatus, computeNoteAdjustments } from '@/lib/erpHelpers';
import { postSalesVoucherFromInvoice } from '@/lib/cloud/accounting/voucherEngine';
import { buildTaxBlock } from '@/lib/cloud/accounting/tax';
import { postToLedger } from '@/lib/cloud/accounting/postingBridge';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'documents');
        if (denied) return denied;

        const db = await getCloudDb();
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');

        if (action === 'next-number') {
            const docType = searchParams.get('type') || 'Invoice';
            const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
            if (!tenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });

            const prefix = tenant.branding?.docPrefix || user.tenantId.split('-')[1] || 'DOC';
            const year = new Date().getFullYear();
            const typeCode = docType === 'Invoice' ? 'INV' : 'QT';

            const lastDoc = await db.collection('tenant_documents')
                .find({
                    tenantId: user.tenantId,
                    docNumber: { $regex: `^${prefix}-${year}-${typeCode}-` }
                })
                .sort({ docNumber: -1 })
                .limit(1)
                .toArray();

            let seq = 1;
            if (lastDoc.length > 0) {
                const lastNum = lastDoc[0].docNumber;
                const lastSeq = parseInt(lastNum.split('-').pop(), 10);
                if (!isNaN(lastSeq)) seq = lastSeq + 1;
            }

            const nextNum = `${prefix}-${year}-${typeCode}-${String(seq).padStart(4, '0')}`;
            return NextResponse.json({ nextNumber: nextNum });
        }

        const documents = await db.collection('tenant_documents')
            .find({ tenantId: user.tenantId })
            .sort({ createdAt: -1 })
            .toArray();

        // Fold in paid-so-far per invoice (single grouped query, not N+1) so the list
        // can show a live status (partially paid / paid / overdue) instead of the
        // manually-set draft/sent flag alone.
        const invoiceIds = documents.filter(d => d.docType === 'Invoice').map(d => d._id.toString());
        const paidTotals = invoiceIds.length ? await db.collection('erp_payments').aggregate([
            { $match: { tenantId: user.tenantId, documentId: { $in: invoiceIds } } },
            { $group: { _id: '$documentId', paid: { $sum: '$amount' } } },
        ]).toArray() : [];
        const paidMap = Object.fromEntries(paidTotals.map(p => [p._id, p.paid]));
        const noteAdjustments = await computeNoteAdjustments(user.tenantId, invoiceIds);

        return NextResponse.json({
            documents: documents.map(d => {
                const out = { ...d, _id: d._id.toString() };
                if (d.docType === 'Invoice') {
                    // Credit notes count like extra payment received; debit notes add to what's owed.
                    const effectivePaid = (paidMap[out._id] || 0) + (noteAdjustments.get(out._id) || 0);
                    out.paidAmount = effectivePaid;
                    out.balanceDue = (d.grandTotal || 0) - effectivePaid;
                    out.computedStatus = computeInvoiceStatus(d, effectivePaid);
                }
                return out;
            })
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/documents') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'documents');
        if (denied) return denied;

        const body = await req.json();
        const {
            docType = 'Quote', status = 'draft',
            customer = {}, lineItems = [],
            subtotal = 0, taxRate = 0, taxAmount = 0, taxType = 'Tax',
            discountRate = 0, discountAmount = 0, grandTotal = 0,
            currency = 'INR', validity = '30 days',
            notes = '', fullTC = '',
            sellerCustomFields = [], customerCustomFields = [],
            orderReferences = {}, termsList = []
        } = body;

        const db = await getCloudDb();

        // Fetch tenant for branding/prefix
        const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
        if (!tenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });

        const prefix = tenant.branding?.docPrefix || user.tenantId.split('-')[1] || 'DOC';
        const year = new Date().getFullYear();
        const typeCode = docType === 'Invoice' ? 'INV' : 'QT';

        let docNumber = body.docNumber ? String(body.docNumber).trim().slice(0, 100) : null;
        let secretKey = crypto.randomBytes(10).toString('hex');

        if (!docNumber) {
            // Generate sequential doc number
            const lastDoc = await db.collection('tenant_documents')
                .find({
                    tenantId: user.tenantId,
                    docNumber: { $regex: `^${prefix}-${year}-${typeCode}-` }
                })
                .sort({ docNumber: -1 })
                .limit(1)
                .toArray();

            let seq = 1;
            if (lastDoc.length > 0) {
                const lastNum = lastDoc[0].docNumber;
                const lastSeq = parseInt(lastNum.split('-').pop(), 10);
                if (!isNaN(lastSeq)) seq = lastSeq + 1;
            }

            docNumber = `${prefix}-${year}-${typeCode}-${String(seq).padStart(4, '0')}`;
        }

        // Snapshot the chosen template's config onto the document at creation time (mirrors
        // how tenant branding is already snapshotted below) - editing/deleting a template
        // later never changes documents that already used it.
        let templateId = null;
        let templateConfig = null;
        if (body.templateId && ObjectId.isValid(body.templateId)) {
            const template = await db.collection('tenant_templates').findOne({ _id: new ObjectId(body.templateId), tenantId: user.tenantId });
            if (template) {
                templateId = template._id.toString();
                templateConfig = template.config;
            }
        }

        const doc = {
            tenantId: user.tenantId,
            businessName: tenant.businessName,
            brandColor: tenant.branding?.customHexColor || '#4A1088',
            docType: String(docType).trim().slice(0, 20),
            docNumber,
            secretKey,
            status: String(status).trim(),
            dueDate: body.dueDate ? new Date(body.dueDate) : null,
            hideDocumentDetails: !!body.hideDocumentDetails,
            templateId,
            templateConfig,
            customer: {
                name: String(customer.name || '').trim().slice(0, 200),
                company: String(customer.company || '').trim().slice(0, 200),
                phone: String(customer.phone || '').trim().slice(0, 20),
                email: String(customer.email || '').trim().toLowerCase().slice(0, 200),
                address: String(customer.address || '').trim().slice(0, 500),
                gstin: String(customer.gstin || '').trim().toUpperCase().slice(0, 15),
            },
            shippingAddress: {
                sameAsBilling: body.shippingAddress?.sameAsBilling !== false,
                name: String(body.shippingAddress?.name || '').trim().slice(0, 200),
                address: String(body.shippingAddress?.address || '').trim().slice(0, 500),
                gstin: String(body.shippingAddress?.gstin || '').trim().toUpperCase().slice(0, 15),
            },
            version: body.version === 'v2' ? 'v2' : 'v1',
            lineItems: (lineItems || []).slice(0, 50).map(item => ({
                product: String(item.product || '').trim().slice(0, 200),
                description: String(item.description || '').trim().slice(0, 500),
                hsnCode: String(item.hsnCode || '').trim().slice(0, 20),
                qty: parseFloat(item.qty) || 0,
                unit: String(item.unit || 'Nos').trim().slice(0, 20),
                unitPrice: parseFloat(item.unitPrice) || 0,
                totalPrice: parseFloat(item.totalPrice) || 0,
                taxRate: parseFloat(item.taxRate) || 0,
            })),
            orderReferences: {
                deliveryNote: String(orderReferences.deliveryNote || '').trim().slice(0, 200),
                termsOfPayment: String(orderReferences.termsOfPayment || '').trim().slice(0, 200),
                suppliersRef: String(orderReferences.suppliersRef || '').trim().slice(0, 200),
                buyersOrderNo: String(orderReferences.buyersOrderNo || '').trim().slice(0, 200),
                buyersOrderDate: String(orderReferences.buyersOrderDate || '').trim().slice(0, 50),
                despatchDocumentNo: String(orderReferences.despatchDocumentNo || '').trim().slice(0, 200),
                despatchedThrough: String(orderReferences.despatchedThrough || '').trim().slice(0, 200),
                destination: String(orderReferences.destination || '').trim().slice(0, 200),
                eWayBillNo: String(orderReferences.eWayBillNo || '').trim().slice(0, 200),
                termsOfDelivery: String(orderReferences.termsOfDelivery || '').trim().slice(0, 200),
                deliveryContactPerson: String(orderReferences.deliveryContactPerson || '').trim().slice(0, 200),
                deliveryContactNumber: String(orderReferences.deliveryContactNumber || '').trim().slice(0, 50),
            },
            termsList: (termsList || []).slice(0, 30).map(t => ({
                key: String(t.key || '').trim().slice(0, 100),
                value: String(t.value || '').trim().slice(0, 500),
            })),
            currency: String(currency).trim().slice(0, 5),
            validity: String(validity).trim().slice(0, 50),
            subtotal: parseFloat(subtotal) || 0,
            taxRate: parseFloat(taxRate) || 0,
            taxAmount: parseFloat(taxAmount) || 0,
            taxType: String(taxType).trim().slice(0, 20),
            discountRate: parseFloat(discountRate) || 0,
            discountAmount: parseFloat(discountAmount) || 0,
            grandTotal: parseFloat(grandTotal) || 0,
            /*
             * THE GST SPLIT, PERSISTED ON THE DOCUMENT.
             *
             * The general ledger needs to know how much of this invoice is
             * taxable value and how much is CGST / SGST / IGST. It used to try
             * to read exactly these five fields and they did not exist, so every
             * sales voucher credited the full tax-inclusive amount to revenue
             * and posted nothing to the GST liability ledgers.
             *
             * Derived through the shared tax module so the invoice and the
             * voucher can never disagree about the same numbers, and stored
             * rather than recomputed at posting time so a later change to the
             * split rules cannot silently restate an invoice already issued.
             */
            ...buildTaxBlock({
                grandTotal: parseFloat(grandTotal) || 0,
                taxAmount: parseFloat(taxAmount) || 0,
                taxType: String(taxType || '').trim(),
            }),
            notes: String(notes || '').trim().slice(0, 2000),
            fullTC: String(fullTC || '').trim().slice(0, 10000),
            sellerCustomFields: sellerCustomFields || [],
            customerCustomFields: customerCustomFields || [],
            brandLogo: tenant.branding?.brandLogo || '',
            letterheadPage1: tenant.branding?.letterheadPage1 || '',
            letterheadPage2: tenant.branding?.letterheadPage2 || '',
            useUploadedLetterhead: tenant.branding?.useUploadedLetterhead || false,
            companyTag1: tenant.companyTag1 || '',
            companyTag2: tenant.companyTag2 || '',
            companyTag3: tenant.companyTag3 || '',
            sellerInfo: {
                name: tenant.businessName,
                address: tenant.contact?.address ? `${tenant.contact.address.line1}, ${tenant.contact.address.city}, ${tenant.contact.address.state} - ${tenant.contact.address.pin}` : '',
                phone: tenant.contact?.phone || '',
                email: tenant.contact?.email || '',
                gstin: tenant.contact?.gstin || '',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('tenant_documents').insertOne(doc);

        /*
         * Post the sales voucher into the general ledger.
         *
         * AWAITED. This was fire-and-forget with an empty .catch, which meant
         * two things: on a serverless host the lambda could be frozen before the
         * voucher was written, and any failure left no trace at all. Awaiting
         * costs this request a few milliseconds and is the difference between a
         * ledger that matches the invoice register and one that quietly does not.
         *
         * Still non-fatal - the invoice stands even if the posting fails - but
         * the failure is now logged and stamped onto the document, so it appears
         * on the unposted worklist instead of vanishing.
         */
        if (docType === 'Invoice' && status !== 'draft') {
            await postToLedger(db, {
                tenantId: user.tenantId,
                collection: 'tenant_documents',
                documentId: result.insertedId,
                label: 'invoice',
            }, () => postSalesVoucherFromInvoice(
                db,
                user.tenantId,
                { ...doc, _id: result.insertedId },
                user.username || user.email || user.sub
            ));
        }

        return NextResponse.json({
            success: true,
            _id: result.insertedId.toString(),
            docNumber,
            secretKey,
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/documents') }, { status: 500 });
    }
}
