import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ALLOWED_ADMIN_EMAILS } from '@/lib/auth';
import { getCloudDb, safeCloudError } from '@/lib/cloudAuth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !ALLOWED_ADMIN_EMAILS.includes(session.user?.email?.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getCloudDb();
        const url = new URL(req.url);
        const statusFilter = url.searchParams.get('status');

        const filter = statusFilter ? { 'subscription.status': statusFilter } : {};
        const tenants = await db.collection('tenants')
            .find(filter)
            .sort({ createdAt: -1 })
            .toArray();

        const tenantIds = tenants.map(t => t.tenantId);
        const counts = tenantIds.length ? await db.collection('tenant_users').aggregate([
            { $match: { tenantId: { $in: tenantIds } } },
            { $group: {
                _id: '$tenantId',
                adminCount: { $sum: { $cond: [{ $in: ['$role', ['owner', 'admin']] }, 1, 0] } },
                subUserCount: { $sum: { $cond: [{ $eq: ['$role', 'custom'] }, 1, 0] } },
            } },
        ]).toArray() : [];
        const countMap = Object.fromEntries(counts.map(c => [c._id, c]));

        const tenantsWithCounts = tenants.map(t => ({
            ...t,
            adminCount: countMap[t.tenantId]?.adminCount || 0,
            subUserCount: countMap[t.tenantId]?.subUserCount || 0,
        }));

        return NextResponse.json({ tenants: tenantsWithCounts });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/admin/cloud/tenants') }, { status: 500 });
    }
}
