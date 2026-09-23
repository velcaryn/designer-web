import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeStr, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const MOVE_TYPES = ['in', 'out', 'adjustment'];

/**
 * GET /api/cloud/erp/inventory/stock
 * Current stock-on-hand per item per warehouse, computed from the moves ledger
 * (the ledger is the source of truth - no separately-maintained running balance to drift out of sync).
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'inventory');
        if (denied) return denied;

        const db = await getCloudDb();
        const [moves, warehouses, items] = await Promise.all([
            db.collection('erp_stock_moves').find({ tenantId: user.tenantId }).sort({ createdAt: -1 }).toArray(),
            db.collection('erp_warehouses').find({ tenantId: user.tenantId }).toArray(),
            db.collection('tenant_products').find({ tenantId: user.tenantId }).toArray(),
        ]);

        const warehouseNames = Object.fromEntries(warehouses.map(w => [w._id.toString(), w.name]));
        const itemNames = Object.fromEntries(items.map(i => [i.itemId, { name: i.name, sku: i.sku || '', unit: i.unit || 'Nos' }]));

        // A stock move's "reference" is free text (often the invoice/PO number the move
        // relates to) - resolve it against actual documents where it matches exactly, so
        // the Recent Moves list can link straight through to that invoice's PDF instead of
        // making the user go search for it manually.
        const references = [...new Set(moves.slice(0, 20).map(m => m.reference).filter(Boolean))];
        const linkedDocs = references.length
            ? await db.collection('tenant_documents').find({ tenantId: user.tenantId, docNumber: { $in: references } }).project({ docNumber: 1 }).toArray()
            : [];
        const docIdByNumber = Object.fromEntries(linkedDocs.map(d => [d.docNumber, d._id.toString()]));

        const levels = new Map(); // `${itemId}::${warehouseId}` -> qty
        for (const m of moves) {
            const key = `${m.itemId}::${m.warehouseId}`;
            const signedQty = m.type === 'out' ? -Math.abs(m.qty) : m.qty;
            levels.set(key, (levels.get(key) || 0) + signedQty);
        }

        const stockLevels = Array.from(levels.entries()).map(([key, qty]) => {
            const [itemId, warehouseId] = key.split('::');
            const item = itemNames[itemId] || { name: 'Unknown item', sku: '', unit: 'Nos' };
            return {
                itemId, warehouseId, qty,
                itemName: item.name, sku: item.sku, unit: item.unit,
                warehouseName: warehouseNames[warehouseId] || 'Unknown warehouse',
            };
        }).filter(l => l.qty !== 0).sort((a, b) => a.itemName.localeCompare(b.itemName));

        return NextResponse.json({
            stockLevels,
            recentMoves: moves.slice(0, 20).map(m => ({
                ...m, _id: m._id.toString(),
                itemName: itemNames[m.itemId]?.name || 'Unknown item',
                warehouseName: warehouseNames[m.warehouseId] || 'Unknown warehouse',
                linkedDocId: m.reference ? (docIdByNumber[m.reference] || null) : null,
            })),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/inventory/stock') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/inventory/stock
 * Records a stock move (in / out / adjustment). Adjustment qty may be negative.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'inventory');
        if (denied) return denied;

        const body = await req.json();
        const itemId = sanitizeStr(body.itemId, 100);
        const warehouseId = sanitizeStr(body.warehouseId, 100);
        const type = MOVE_TYPES.includes(body.type) ? body.type : null;
        const qty = sanitizeNum(body.qty);

        if (!itemId) return NextResponse.json({ error: 'Item is required.' }, { status: 400 });
        if (!warehouseId) return NextResponse.json({ error: 'Warehouse is required.' }, { status: 400 });
        if (!type) return NextResponse.json({ error: 'Move type must be one of: in, out, adjustment.' }, { status: 400 });
        if (!qty) return NextResponse.json({ error: 'Quantity must be a non-zero number.' }, { status: 400 });
        if (type !== 'adjustment' && qty < 0) return NextResponse.json({ error: 'Quantity must be positive for in/out moves.' }, { status: 400 });

        const db = await getCloudDb();

        const [item, warehouse] = await Promise.all([
            db.collection('tenant_products').findOne({ tenantId: user.tenantId, itemId }),
            ObjectId.isValid(warehouseId)
                ? db.collection('erp_warehouses').findOne({ tenantId: user.tenantId, _id: new ObjectId(warehouseId) })
                : null,
        ]);
        if (!item) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
        if (!warehouse) return NextResponse.json({ error: 'Warehouse not found.' }, { status: 404 });

        const moveNumber = await generateErpNumber(user.tenantId, 'stockMove');

        const move = {
            tenantId: user.tenantId,
            moveNumber,
            itemId,
            warehouseId,
            type,
            qty,
            reference: sanitizeStr(body.reference, 200),
            notes: sanitizeStr(body.notes, 1000),
            by: user.email,
            createdAt: new Date(),
        };

        const result = await db.collection('erp_stock_moves').insertOne(move);
        return NextResponse.json({ success: true, _id: result.insertedId.toString(), moveNumber }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/inventory/stock') }, { status: 500 });
    }
}
