import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ALLOWED_ADMIN_EMAILS } from '@/lib/auth';
import { getCloudDb, safeCloudError } from '@/lib/cloudAuth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !ALLOWED_ADMIN_EMAILS.includes(session.user?.email?.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { tenantId, username, password, ownerName, email, docPrefix, brandColor } = body;
        if (!tenantId) {
            return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
        }

        const db = await getCloudDb();

        const tenant = await db.collection('tenants').findOne({ tenantId });
        if (!tenant) {
            return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
        }

        if (tenant.subscription?.status === 'active') {
            return NextResponse.json({ error: 'Client workspace is already active.' }, { status: 409 });
        }

        // Generate or use credentials
        const finalOwnerName = ownerName || tenant.contact?.owner || 'Admin';
        const finalEmail = email || tenant.contact?.email || '';
        const finalPrefix = docPrefix || tenant.branding?.docPrefix || 'DOC';
        const finalColor = brandColor || tenant.branding?.customHexColor || '#4A1088';

        const finalUsername = username ? String(username).toLowerCase().trim().replace(/[^a-z0-9-]/g, '') : tenantId.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const finalPassword = password || crypto.randomBytes(6).toString('hex');
        const passwordHash = await bcrypt.hash(finalPassword, 12);

        // Check if username already exists in `tenant_users`
        const existingUsername = await db.collection('tenant_users').findOne({ username: finalUsername });
        if (existingUsername && existingUsername.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Username already taken. Choose a different one.' }, { status: 409 });
        }

        // Activate tenant subscription and update details
        await db.collection('tenants').updateOne(
            { tenantId },
            {
                $set: {
                    'subscription.status': 'active',
                    'contact.owner': finalOwnerName,
                    'contact.email': finalEmail.toLowerCase(),
                    'branding.docPrefix': finalPrefix.toUpperCase(),
                    'branding.customHexColor': finalColor,
                    updatedAt: new Date(),
                }
            }
        );

        // Create or update user login
        const existingUser = await db.collection('tenant_users').findOne({ tenantId });
        if (!existingUser) {
            await db.collection('tenant_users').insertOne({
                tenantId,
                username: finalUsername,
                name: finalOwnerName,
                email: finalEmail,
                passwordHash,
                role: 'owner',
                active: true,
                createdAt: new Date(),
                lastLoginAt: null,
            });
        } else {
            await db.collection('tenant_users').updateOne(
                { tenantId },
                {
                    $set: {
                        username: finalUsername,
                        name: finalOwnerName,
                        email: finalEmail,
                        passwordHash,
                        active: true,
                        updatedAt: new Date(),
                    }
                }
            );
        }

        return NextResponse.json({
            success: true,
            username: finalUsername,
            temporaryPassword: finalPassword,
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/admin/cloud/approve') }, { status: 500 });
    }
}
