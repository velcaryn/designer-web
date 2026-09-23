import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied, approvalBlocked } from '@/lib/permissions';
import { computeInvoiceStatus, computeNoteAdjustments } from '@/lib/erpHelpers';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'documents');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();
        const doc = await db.collection('tenant_documents').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

        if (!doc.brandLogo) {
            const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
            if (tenant?.branding?.brandLogo) doc.brandLogo = tenant.branding.brandLogo;
        }

        const out = { ...doc, _id: doc._id.toString() };
        if (doc.docType === 'Invoice') {
            const [payments, noteAdjustments] = await Promise.all([
                db.collection('erp_payments').find({ tenantId: user.tenantId, documentId: id }).toArray(),
                computeNoteAdjustments(user.tenantId, [id]),
            ]);
            const paidAmount = payments.reduce((s, p) => s + p.amount, 0);
            const effectivePaid = paidAmount + (noteAdjustments.get(id) || 0);
            out.paidAmount = effectivePaid;
            out.balanceDue = (doc.grandTotal || 0) - effectivePaid;
            out.computedStatus = computeInvoiceStatus(doc, effectivePaid);
        }

        return NextResponse.json({ document: out });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/documents/[id]') }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'documents');
        if (denied) return denied;

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const existing = await db.collection('tenant_documents').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!existing) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

        const update = { updatedAt: new Date() };

        // Approval Workflows (Phase 8c): a 'custom' sub-user sending a Quote/Invoice over
        // the tenant's configured threshold is blocked - only an owner/admin can send it.
        if (body.status === 'sent' && existing.status !== 'sent') {
            const docTypeKey = (existing.docType || body.docType) === 'Invoice' ? 'invoice' : 'quote';
            const pendingTotal = body.grandTotal !== undefined ? parseFloat(body.grandTotal) || 0 : existing.grandTotal;
            const tenantForApproval = await db.collection('tenants').findOne({ tenantId: user.tenantId });
            const blocked = approvalBlocked(user, tenantForApproval, docTypeKey, pendingTotal);
            if (blocked) return blocked;
        }

        // If transitioning from draft to sent, generate docNumber + secretKey
        if (body.status === 'sent' && !existing.docNumber) {
            const tenant = await db.collection('tenants').findOne({ tenantId: user.tenantId });
            const prefix = tenant?.branding?.docPrefix || 'DOC';
            const year = new Date().getFullYear();
            const typeCode = (existing.docType || body.docType || 'Quote') === 'Invoice' ? 'INV' : 'QT';

            const lastDoc = await db.collection('tenant_documents')
                .find({ tenantId: user.tenantId, docNumber: { $regex: `^${prefix}-${year}-${typeCode}-` } })
                .sort({ docNumber: -1 })
                .limit(1)
                .toArray();

            let seq = 1;
            if (lastDoc.length > 0) {
                const lastSeq = parseInt(lastDoc[0].docNumber.split('-').pop(), 10);
                if (!isNaN(lastSeq)) seq = lastSeq + 1;
            }

            update.docNumber = `${prefix}-${year}-${typeCode}-${String(seq).padStart(4, '0')}`;
            update.secretKey = crypto.randomBytes(10).toString('hex');
        }

        // Copy over updatable fields
        if (body.status !== undefined) update.status = String(body.status).trim();
        if (body.dueDate !== undefined) update.dueDate = body.dueDate ? new Date(body.dueDate) : null;
        if (body.customer !== undefined) {
            update.customer = {
                name: String(body.customer.name || '').trim().slice(0, 200),
                company: String(body.customer.company || '').trim().slice(0, 200),
                phone: String(body.customer.phone || '').trim().slice(0, 20),
                email: String(body.customer.email || '').trim().toLowerCase().slice(0, 200),
                address: String(body.customer.address || '').trim().slice(0, 500),
                gstin: String(body.customer.gstin || '').trim().toUpperCase().slice(0, 15),
            };
        }
        if (body.shippingAddress !== undefined) {
            const sa = body.shippingAddress || {};
            update.shippingAddress = {
                sameAsBilling: sa.sameAsBilling !== false,
                name: String(sa.name || '').trim().slice(0, 200),
                address: String(sa.address || '').trim().slice(0, 500),
                gstin: String(sa.gstin || '').trim().toUpperCase().slice(0, 15),
            };
        }
        if (body.lineItems !== undefined) {
            update.lineItems = (body.lineItems || []).slice(0, 50).map(item => ({
                product: String(item.product || '').trim().slice(0, 200),
                description: String(item.description || '').trim().slice(0, 500),
                hsnCode: String(item.hsnCode || '').trim().slice(0, 20),
                qty: parseFloat(item.qty) || 0,
                unit: String(item.unit || 'Nos').trim().slice(0, 20),
                unitPrice: parseFloat(item.unitPrice) || 0,
                totalPrice: parseFloat(item.totalPrice) || 0,
                taxRate: parseFloat(item.taxRate) || 0,
            }));
        }
        if (body.version !== undefined) update.version = body.version === 'v2' ? 'v2' : 'v1';
        if (body.orderReferences !== undefined) {
            const or = body.orderReferences || {};
            update.orderReferences = {
                deliveryNote: String(or.deliveryNote || '').trim().slice(0, 200),
                termsOfPayment: String(or.termsOfPayment || '').trim().slice(0, 200),
                suppliersRef: String(or.suppliersRef || '').trim().slice(0, 200),
                buyersOrderNo: String(or.buyersOrderNo || '').trim().slice(0, 200),
                buyersOrderDate: String(or.buyersOrderDate || '').trim().slice(0, 50),
                despatchDocumentNo: String(or.despatchDocumentNo || '').trim().slice(0, 200),
                despatchedThrough: String(or.despatchedThrough || '').trim().slice(0, 200),
                destination: String(or.destination || '').trim().slice(0, 200),
                eWayBillNo: String(or.eWayBillNo || '').trim().slice(0, 200),
                termsOfDelivery: String(or.termsOfDelivery || '').trim().slice(0, 200),
                deliveryContactPerson: String(or.deliveryContactPerson || '').trim().slice(0, 200),
                deliveryContactNumber: String(or.deliveryContactNumber || '').trim().slice(0, 50),
            };
        }
        if (body.termsList !== undefined) {
            update.termsList = (body.termsList || []).slice(0, 30).map(t => ({
                key: String(t.key || '').trim().slice(0, 100),
                value: String(t.value || '').trim().slice(0, 500),
            }));
        }
        if (body.subtotal !== undefined) update.subtotal = parseFloat(body.subtotal) || 0;
        if (body.taxRate !== undefined) update.taxRate = parseFloat(body.taxRate) || 0;
        if (body.taxAmount !== undefined) update.taxAmount = parseFloat(body.taxAmount) || 0;
        if (body.taxType !== undefined) update.taxType = String(body.taxType).trim().slice(0, 20);
        if (body.discountRate !== undefined) update.discountRate = parseFloat(body.discountRate) || 0;
        if (body.discountAmount !== undefined) update.discountAmount = parseFloat(body.discountAmount) || 0;
        if (body.grandTotal !== undefined) update.grandTotal = parseFloat(body.grandTotal) || 0;
        if (body.notes !== undefined) update.notes = String(body.notes || '').trim().slice(0, 2000);
        if (body.fullTC !== undefined) update.fullTC = String(body.fullTC || '').trim().slice(0, 10000);
        if (body.currency !== undefined) update.currency = String(body.currency).trim().slice(0, 5);
        if (body.validity !== undefined) update.validity = String(body.validity).trim().slice(0, 50);
        if (body.hideDocumentDetails !== undefined) update.hideDocumentDetails = !!body.hideDocumentDetails;
        if (body.brandLogo !== undefined) update.brandLogo = String(body.brandLogo || '').trim();
        if (body.companyTag1 !== undefined) update.companyTag1 = String(body.companyTag1 || '').trim().slice(0, 200);
        if (body.companyTag2 !== undefined) update.companyTag2 = String(body.companyTag2 || '').trim().slice(0, 200);
        if (body.companyTag3 !== undefined) update.companyTag3 = String(body.companyTag3 || '').trim().slice(0, 200);
        if (body.docNumber !== undefined) update.docNumber = String(body.docNumber || '').trim().slice(0, 100);
        if (body.templateId !== undefined) {
            if (body.templateId && ObjectId.isValid(body.templateId)) {
                const template = await db.collection('tenant_templates').findOne({ _id: new ObjectId(body.templateId), tenantId: user.tenantId });
                update.templateId = template ? template._id.toString() : null;
                update.templateConfig = template ? template.config : null;
            } else {
                update.templateId = null;
                update.templateConfig = null;
            }
        }

        await db.collection('tenant_documents').updateOne(
            { _id: new ObjectId(id), tenantId: user.tenantId },
            { $set: update }
        );

        return NextResponse.json({
            success: true,
            docNumber: update.docNumber || existing.docNumber,
            secretKey: update.secretKey || existing.secretKey,
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/cloud/documents/[id]') }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'documents');
        if (denied) return denied;

        const { id } = await context.params;
        const db = await getCloudDb();

        // Only allow deleting drafts
        const doc = await db.collection('tenant_documents').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
        if (doc.status === 'sent') return NextResponse.json({ error: 'Cannot delete a sent document.' }, { status: 400 });

        await db.collection('tenant_documents').deleteOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'DELETE /api/cloud/documents/[id]') }, { status: 500 });
    }
}
