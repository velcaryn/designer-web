import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'items');
        if (denied) return denied;

        const db = await getCloudDb();
        const items = await db.collection('tenant_products')
            .find({ tenantId: user.tenantId })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ items: items.map(i => ({ ...i, _id: i._id.toString() })) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/items') }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'items');
        if (denied) return denied;

        const body = await req.json();
        const { name, sku, hsnCode, unit, defaultUnitPrice, taxRate, costPrice, stockCount, specifications } = body;

        if (!name) return NextResponse.json({ error: 'Item name is required.' }, { status: 400 });

        const db = await getCloudDb();
        
        // Drop any unique index on sku to prevent duplicate empty sku blockages
        try {
            await db.collection('tenant_products').dropIndex('sku_1');
        } catch (e) {}

        const itemId = `PRD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        const doc = {
            tenantId: user.tenantId,
            itemId,
            name: String(name).trim().slice(0, 200),
            hsnCode: String(hsnCode || '').trim().slice(0, 20),
            unit: String(unit || 'Nos').trim().slice(0, 20),
            defaultUnitPrice: parseFloat(defaultUnitPrice) || 0,
            taxRate: parseFloat(taxRate) || 18,
            costPrice: parseFloat(costPrice) || 0,
            stockCount: parseInt(stockCount) || 0,
            specifications: specifications || {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (sku && sku.trim()) {
            doc.sku = String(sku).trim().slice(0, 50);
        }

        const result = await db.collection('tenant_products').insertOne(doc);
        return NextResponse.json({ success: true, itemId, _id: result.insertedId.toString() });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/items') }, { status: 500 });
    }
}
