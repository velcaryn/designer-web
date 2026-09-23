import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'items');
        if (denied) return denied;

        const body = await req.json();
        const { products } = body;

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'Invalid payload. Products array required.' }, { status: 400 });
        }

        const db = await getCloudDb();
        const docs = [];

        for (const item of products) {
            if (!item.name || !item.name.trim()) continue; // skip invalid rows

            const itemId = `PRD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            const doc = {
                tenantId: user.tenantId,
                itemId,
                name: String(item.name).trim().slice(0, 200),
                hsnCode: String(item.hsnCode || '').trim().slice(0, 20),
                unit: String(item.unit || 'Nos').trim().slice(0, 20),
                defaultUnitPrice: parseFloat(item.defaultUnitPrice || item.price) || 0,
                taxRate: parseFloat(item.taxRate) || 18,
                costPrice: parseFloat(item.costPrice) || 0,
                stockCount: parseInt(item.stockCount || item.stock) || 0,
                specifications: {},
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const skuVal = String(item.sku || '').trim().slice(0, 50);
            if (skuVal) {
                doc.sku = skuVal;
            }

            docs.push(doc);
        }

        if (docs.length === 0) {
            return NextResponse.json({ error: 'No valid products found. Name is mandatory.' }, { status: 400 });
        }

        await db.collection('tenant_products').insertMany(docs);

        return NextResponse.json({ success: true, count: docs.length });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/items/bulk') }, { status: 500 });
    }
}
