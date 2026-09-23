import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ALLOWED_ADMIN_EMAILS } from '@/lib/auth';
import { getCloudDb, safeCloudError } from '@/lib/cloudAuth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !ALLOWED_ADMIN_EMAILS.includes(session.user?.email?.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tenantId } = await req.json();
        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
        }

        const db = await getCloudDb();

        const result = await db.collection('tenants').updateOne(
            { tenantId },
            {
                $set: {
                    'subscription.status': 'rejected',
                    updatedAt: new Date(),
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/admin/cloud/reject') }, { status: 500 });
    }
}
