/**
 * Minimal audit trail for tenant/account/permission/tier changes (Phase 5d).
 * A browsable timeline/export UI on top of this collection is Phase 11 scope -
 * this just guarantees every sensitive change is recorded now.
 */
export async function logAudit(db, { tenantId, actorType, actorId, action, details }) {
    await db.collection('audit_logs').insertOne({
        tenantId,
        actorType, // 'admin' (platform admin) | 'tenant_user' (owner/admin/custom)
        actorId,   // admin email or tenant_users _id/username
        action,    // e.g. 'tenant.update', 'account.create', 'account.update'
        details: details || {},
        at: new Date(),
    });
}
