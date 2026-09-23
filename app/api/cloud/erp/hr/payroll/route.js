import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeNum } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const db = await getCloudDb();
        const runs = await db.collection('erp_payroll_runs')
            .find({ tenantId: user.tenantId })
            .sort({ year: -1, month: -1 })
            .toArray();

        return NextResponse.json({ runs: runs.map(r => ({ ...r, _id: r._id.toString() })) });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/hr/payroll') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/hr/payroll
 * Generates a draft payroll run for { month, year } from all currently-active employees.
 * Unpaid-leave days approved and overlapping that month are deducted at salary/30 per day -
 * a simplified proration, not a full attendance-based payroll engine.
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'hr');
        if (denied) return denied;

        const body = await req.json();
        const month = sanitizeNum(body.month, 0); // 1-12
        const year = sanitizeNum(body.year, 0);
        if (month < 1 || month > 12 || year < 2000) {
            return NextResponse.json({ error: 'Valid month (1-12) and year are required.' }, { status: 400 });
        }

        const db = await getCloudDb();

        const existingRun = await db.collection('erp_payroll_runs').findOne({ tenantId: user.tenantId, month, year });
        if (existingRun) return NextResponse.json({ error: `A payroll run for ${month}/${year} already exists.` }, { status: 400 });

        const employees = await db.collection('erp_employees').find({ tenantId: user.tenantId, status: 'active' }).toArray();
        if (employees.length === 0) return NextResponse.json({ error: 'No active employees to run payroll for.' }, { status: 400 });

        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 1);

        const unpaidLeaves = await db.collection('erp_leave_requests').find({
            tenantId: user.tenantId,
            type: 'unpaid',
            status: 'approved',
            from: { $lt: monthEnd },
            to: { $gte: monthStart },
        }).toArray();

        const unpaidDaysByEmployee = {};
        for (const lv of unpaidLeaves) {
            unpaidDaysByEmployee[lv.employeeId] = (unpaidDaysByEmployee[lv.employeeId] || 0) + lv.days;
        }

        const entries = employees.map(emp => {
            const baseSalary = emp.salary || 0;
            const unpaidDays = unpaidDaysByEmployee[emp._id.toString()] || 0;
            const deductions = Math.round((baseSalary / 30) * unpaidDays * 100) / 100;
            return {
                employeeId: emp._id.toString(),
                employeeName: emp.name,
                baseSalary,
                unpaidDays,
                deductions,
                netPay: Math.max(0, baseSalary - deductions),
            };
        });

        const totalNet = entries.reduce((sum, e) => sum + e.netPay, 0);
        const runNumber = await generateErpNumber(user.tenantId, 'payrollRun');

        const run = {
            tenantId: user.tenantId,
            runNumber,
            month,
            year,
            status: 'draft',
            entries,
            totalNet,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('erp_payroll_runs').insertOne(run);
        return NextResponse.json({ success: true, _id: result.insertedId.toString(), runNumber }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/hr/payroll') }, { status: 500 });
    }
}
