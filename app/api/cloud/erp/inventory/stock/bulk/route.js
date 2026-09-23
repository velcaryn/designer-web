import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeStr, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const MOVE_TYPES = ['in', 'out', 'adjustment'];

/**
 * POST /api/cloud/erp/inventory/stock/bulk
 * Bulk-records stock moves from a CSV import. Rows are resolved to itemId/warehouseId
 * client-side (against the tenant's own items/warehouses lists) before being sent here -
 * this endpoint re-validates each row belongs to the tenant rather than trusting the client.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'inventory');
        if (denied) return denied;

        const body = await req.json();
        const rows = Array.isArray(body.moves) ? body.moves : [];
        if (rows.length === 0) return NextResponse.json({ error: 'No stock moves to import.' }, { status: 400 });

        const db = await getCloudDb();
        const [items, warehouses] = await Promise.all([
            db.collection('tenant_products').find({ tenantId: user.tenantId }).toArray(),
            db.collection('erp_warehouses').find({ tenantId: user.tenantId }).toArray(),
        ]);
        const validItemIds = new Set(items.map(i => i.itemId));
        const validWarehouseIds = new Set(warehouses.map(w => w._id.toString()));

        const docs = [];
        let skipped = 0;

        for (const row of rows.slice(0, 500)) {
            const itemId = sanitizeStr(row.itemId, 100);
            const warehouseId = sanitizeStr(row.warehouseId, 100);
            const type = MOVE_TYPES.includes(row.type) ? row.type : null;
            const qty = sanitizeNum(row.qty);

            const isValid = itemId && warehouseId && type && qty !== 0
                && validItemIds.has(itemId) && validWarehouseIds.has(warehouseId)
                && (type === 'adjustment' || qty > 0);

            if (!isValid) { skipped++; continue; }

            docs.push({
                tenantId: user.tenantId,
                moveNumber: await generateErpNumber(user.tenantId, 'stockMove'),
                itemId,
                warehouseId,
                type,
                qty,
                reference: sanitizeStr(row.reference, 200),
                notes: sanitizeStr(row.notes, 1000),
                by: user.email,
                createdAt: new Date(),
            });
        }

        if (docs.length === 0) {
            return NextResponse.json({ error: 'No valid stock moves found in the import.' }, { status: 400 });
        }

        await db.collection('erp_stock_moves').insertMany(docs);
        return NextResponse.json({ success: true, count: docs.length, skipped });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/inventory/stock/bulk') }, { status: 500 });
    }
}
