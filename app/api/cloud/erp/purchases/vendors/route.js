import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { sanitizeStr, sanitizeEmail, sanitizePhone, sanitizeBankDetails, paginationFromParams, escapeRegex } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cloud/erp/purchases/vendors
 * Vendors are tenant_clients tagged with the 'vendor' role - the same contact record
 * used by the Clients (Sales) module, so a contact that's both a customer and a vendor
 * is a single record instead of two disconnected ones.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('q');
        const { skip, limit, page } = paginationFromParams(searchParams);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId, roles: 'vendor' };
        if (search) {
            const safeSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { company: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        const [vendors, total] = await Promise.all([
            db.collection('tenant_clients')
                .find(filter)
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('tenant_clients').countDocuments(filter),
        ]);

        return NextResponse.json({
            vendors: vendors.map(v => ({ ...v, _id: v._id.toString() })),
            total, page, pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/purchases/vendors') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/purchases/vendors
 * Either promotes an existing client to also be a vendor ({ existingClientId }),
 * or creates a brand-new vendor-only contact.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'purchases');
        if (denied) return denied;

        const body = await req.json();
        const db = await getCloudDb();

        if (body.existingClientId) {
            if (!ObjectId.isValid(body.existingClientId)) {
                return NextResponse.json({ error: 'Invalid client.' }, { status: 400 });
            }
            const existing = await db.collection('tenant_clients').findOne({ _id: new ObjectId(body.existingClientId), tenantId: user.tenantId });
            if (!existing) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });

            await db.collection('tenant_clients').updateOne(
                { _id: existing._id },
                { $addToSet: { roles: 'vendor' }, $set: { updatedAt: new Date() } }
            );
            return NextResponse.json({ success: true, _id: existing._id.toString() }, { status: 200 });
        }

        const name = sanitizeStr(body.name, 200);
        if (!name) return NextResponse.json({ error: 'Vendor name is required.' }, { status: 400 });

        const vendor = {
            tenantId: user.tenantId,
            name,
            contactPerson: sanitizeStr(body.contactPerson, 100),
            company: sanitizeStr(body.company, 200),
            email: sanitizeEmail(body.email),
            phone: sanitizePhone(body.phone),
            address: sanitizeStr(body.address, 500),
            gstin: sanitizeStr(body.gstin, 15).toUpperCase(),
            panNumber: sanitizeStr(body.panNumber, 10).toUpperCase(),
            bankDetails: sanitizeBankDetails(body.bankDetails),
            paymentTerms: sanitizeStr(body.paymentTerms, 200),
            notes: sanitizeStr(body.notes, 2000),
            roles: ['vendor'],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('tenant_clients').insertOne(vendor);

        return NextResponse.json({
            success: true,
            _id: result.insertedId.toString(),
        }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/purchases/vendors') }, { status: 500 });
    }
}
