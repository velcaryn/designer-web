import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cloud/erp/reports/gst-summary?month=1-12&year=YYYY
 * Output tax (collected on sent/paid Invoices) vs. input tax (paid on confirmed+ POs)
 * for a given month, broken down by tax rate - the filing-prep view. Defaults to the
 * current month if no query params are given.
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'accounting');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const now = new Date();
        const month = parseInt(searchParams.get('month'), 10) || (now.getMonth() + 1);
        const year = parseInt(searchParams.get('year'), 10) || now.getFullYear();
        const periodStart = new Date(year, month - 1, 1);
        const periodEnd = new Date(year, month, 1);

        const db = await getCloudDb();
        const tenantId = user.tenantId;

        const [invoices, purchaseOrders] = await Promise.all([
            db.collection('tenant_documents').find({
                tenantId, docType: 'Invoice', status: { $ne: 'draft' },
                createdAt: { $gte: periodStart, $lt: periodEnd },
            }).toArray(),
            db.collection('erp_purchase_orders').find({
                tenantId, status: { $in: ['confirmed', 'received', 'billed', 'paid'] },
                createdAt: { $gte: periodStart, $lt: periodEnd },
            }).toArray(),
        ]);

        const outputByRate = {};
        let outputTaxTotal = 0;
        for (const inv of invoices) {
            for (const line of inv.lineItems || []) {
                const lineTax = (line.totalPrice || 0) * (line.taxRate || 0) / 100;
                const key = `${line.taxRate || 0}%`;
                outputByRate[key] = (outputByRate[key] || 0) + lineTax;
                outputTaxTotal += lineTax;
            }
        }

        const inputByRate = {};
        let inputTaxTotal = 0;
        for (const po of purchaseOrders) {
            for (const line of po.lineItems || []) {
                const lineTax = (line.totalPrice || 0) * (line.taxRate || 0) / 100;
                const key = `${line.taxRate || 0}%`;
                inputByRate[key] = (inputByRate[key] || 0) + lineTax;
                inputTaxTotal += lineTax;
            }
        }

        return NextResponse.json({
            period: { month, year },
            outputTax: { total: outputTaxTotal, byRate: outputByRate, invoiceCount: invoices.length },
            inputTax: { total: inputTaxTotal, byRate: inputByRate, poCount: purchaseOrders.length },
            netPayable: outputTaxTotal - inputTaxTotal,
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/reports/gst-summary') }, { status: 500 });
    }
}
