import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ALLOWED_ADMIN_EMAILS } from '@/lib/auth';
import { getCloudDb, safeCloudError } from '@/lib/cloudAuth';
import { seatLimitsForTier } from '@/lib/tiers';
import { sanitizeEntitlements, normalizeStatus, entitledModules } from '@/lib/cloud/entitlements';
import { logAudit } from '@/lib/auditLog';
import { NOT_DELETED } from '@/lib/userLifecycle';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !ALLOWED_ADMIN_EMAILS.includes(session.user?.email?.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const db = await getCloudDb();

        // Find tenant (client) by tenantId or ObjectId
        const clientDoc = await db.collection('tenants').findOne({ tenantId: id });
        if (!clientDoc) {
            return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
        }

        // Find associated user login
        // Explicitly the Primary Admin - a tenant can now have multiple tenant_users
        // docs (sub-users promoted from Employees), so an unscoped findOne would be ambiguous.
        const userDoc = await db.collection('tenant_users').findOne({ tenantId: clientDoc.tenantId, role: 'owner', ...NOT_DELETED });

        // Full team roster for the oversight drill-in - every login-enabled user on
        // this tenant, admin or sub-user, with their permission set.
        const team = await db.collection('tenant_users')
            .find({ tenantId: clientDoc.tenantId, ...NOT_DELETED })
            .sort({ role: 1, createdAt: 1 })
            .toArray();

        return NextResponse.json({
            client: clientDoc,
            // Resolved preview of what this tenant's sidebar will actually show,
            // derived from the same function the live gate calls - so the admin
            // UI can never display a plan the tenant's portal disagrees with.
            entitledModules: entitledModules({
                ...(clientDoc.modules || {}),
                status: clientDoc.subscription?.status,
                trialEndsAt: clientDoc.subscription?.trialEndsAt,
            }),
            user: userDoc ? {
                username: userDoc.username,
                role: userDoc.role,
                active: userDoc.active,
                email: userDoc.email,
            } : null,
            team: team.map(u => ({
                _id: u._id.toString(),
                username: u.username,
                name: u.name,
                email: u.email,
                role: u.role,
                permissions: u.permissions || null,
                active: u.active,
                lastLoginAt: u.lastLoginAt,
            })),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/admin/cloud/tenants/[id]') }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !ALLOWED_ADMIN_EMAILS.includes(session.user?.email?.toLowerCase())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await req.json();
        const db = await getCloudDb();

        const tenant = await db.collection('tenants').findOne({ tenantId: id });
        if (!tenant) {
            return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
        }

        const {
            businessName, ownerName, email, phone, businessType,
            address, gstin, brandColor, docPrefix,
            subscriptionStatus, subscriptionTier, trialEndsAt,
            username, password
        } = body;

        // 1. Update the tenants (clients) collection
        const tenantUpdate = {
            businessName: String(businessName || tenant.businessName).trim().slice(0, 200),
            businessType: String(businessType || tenant.businessType || 'Other').trim().slice(0, 50),
            contact: {
                owner: String(ownerName || tenant.contact?.owner || '').trim().slice(0, 100),
                email: String(email || tenant.contact?.email || '').trim().toLowerCase().slice(0, 200),
                phone: String(phone || tenant.contact?.phone || '').trim().slice(0, 20),
                gstin: String(gstin || tenant.contact?.gstin || '').trim().toUpperCase().slice(0, 15),
                address: {
                    line1: String(address?.line1 || tenant.contact?.address?.line1 || '').trim().slice(0, 300),
                    line2: String(address?.line2 || tenant.contact?.address?.line2 || '').trim().slice(0, 300),
                    city: String(address?.city || tenant.contact?.address?.city || '').trim().slice(0, 100),
                    state: String(address?.state || tenant.contact?.address?.state || '').trim().slice(0, 100),
                    pin: String(address?.pin || tenant.contact?.address?.pin || '').trim().slice(0, 10),
                }
            },
            branding: {
                logoUrl: tenant.branding?.logoUrl || null,
                customHexColor: String(brandColor || tenant.branding?.customHexColor || '#4A1088').trim().slice(0, 7),
                docPrefix: String(docPrefix || tenant.branding?.docPrefix || 'DOC').trim().toUpperCase().slice(0, 6),
                letterheadPage1: body.letterheadPage1 !== undefined ? String(body.letterheadPage1).trim() : (tenant.branding?.letterheadPage1 || ''),
                letterheadPage2: body.letterheadPage2 !== undefined ? String(body.letterheadPage2).trim() : (tenant.branding?.letterheadPage2 || ''),
                useUploadedLetterhead: body.useUploadedLetterhead !== undefined ? !!body.useUploadedLetterhead : (tenant.branding?.useUploadedLetterhead || false),
            },
            // The tenant-level module ceiling. Passed through sanitizeEntitlements,
            // which is the security boundary for this feature - anything not
            // explicitly handled there can never reach `tenants.modules`, whatever
            // the request body contains. Omitting `modules` from the body leaves
            // the stored plan untouched rather than resetting it to defaults.
            ...(body.modules !== undefined ? {
                modules: sanitizeEntitlements({
                    ...body.modules,
                    // Tier and status live on `subscription` (the pre-existing
                    // home, still read by billing and seat limits). Mirroring
                    // them into `modules` keeps the entitlement model
                    // self-contained for any caller that reads only that half.
                    tier: subscriptionTier || body.modules.tier || tenant.subscription?.tier,
                    status: subscriptionStatus || tenant.subscription?.status,
                }),
            } : {}),
            subscription: {
                ...tenant.subscription,
                status: normalizeStatus(subscriptionStatus || tenant.subscription?.status),
                tier: subscriptionTier || tenant.subscription?.tier || 'free_trial',
                trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : (tenant.subscription?.trialEndsAt ? new Date(tenant.subscription.trialEndsAt) : null),
                // Recompute default seat limits whenever the tier changes, unless the admin
                // explicitly overrides them in this same request.
                ...(subscriptionTier && subscriptionTier !== tenant.subscription?.tier ? seatLimitsForTier(subscriptionTier) : {}),
                ...(body.adminSeatLimit !== undefined ? { adminSeatLimit: Number(body.adminSeatLimit) } : {}),
                ...(body.subUserSeatLimit !== undefined ? { subUserSeatLimit: Number(body.subUserSeatLimit) } : {}),
            },
            updatedAt: new Date()
        };

        await db.collection('tenants').updateOne({ tenantId: id }, { $set: tenantUpdate });

        await logAudit(db, {
            tenantId: id,
            actorType: 'admin',
            actorId: session.user?.email,
            action: 'tenant.update',
            // Before/after on every axis that can widen or narrow access. An
            // entitlement change is the one admin action a client may later
            // dispute ("you turned our HR module off"), so the record has to
            // show what it was, what it became, and who did it.
            details: {
                before: {
                    subscriptionStatus: tenant.subscription?.status || null,
                    subscriptionTier: tenant.subscription?.tier || null,
                    modules: tenant.modules || null,
                },
                after: {
                    subscriptionStatus: tenantUpdate.subscription.status,
                    subscriptionTier: tenantUpdate.subscription.tier,
                    modules: tenantUpdate.modules ?? tenant.modules ?? null,
                },
                adminSeatLimit: tenantUpdate.subscription.adminSeatLimit,
                subUserSeatLimit: tenantUpdate.subscription.subUserSeatLimit,
            },
        });

        // 2. Manage the associated user login in `tenant_users`
        if (username) {
            const cleanUsername = String(username).toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
            const userUpdate = {
                username: cleanUsername,
                email: tenantUpdate.contact.email,
                name: tenantUpdate.contact.owner,
                updatedAt: new Date()
            };

            if (password && password.trim()) {
                userUpdate.passwordHash = await bcrypt.hash(password, 12);
            }

            // Check if the Primary Admin already exists for this tenant - scoped to role:
            // 'owner' so this only ever touches the primary login, never a sub-user's.
            const existingUser = await db.collection('tenant_users').findOne({ tenantId: id, role: 'owner', ...NOT_DELETED });
            if (existingUser) {
                await db.collection('tenant_users').updateOne(
                    { tenantId: id, role: 'owner' },
                    { $set: userUpdate }
                );
            } else {
                // If not found, insert new user doc
                await db.collection('tenant_users').insertOne({
                    tenantId: id,
                    role: 'owner',
                    active: true,
                    createdAt: new Date(),
                    lastLoginAt: null,
                    ...userUpdate
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'PUT /api/admin/cloud/tenants/[id]') }, { status: 500 });
    }
}
