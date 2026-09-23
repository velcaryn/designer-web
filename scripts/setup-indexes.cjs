/**
 * setup-indexes.cjs
 *
 * Creates every MongoDB index VelBiz Cloud relies on. Idempotent: each index
 * has a fixed name, so re-running is a no-op for any that already exist, and
 * it only ever adds index metadata, never touching documents.
 *
 * Every ERP query filters by tenantId first, so that is the leading key on
 * every compound index below; MongoDB can use a compound index's leading
 * field alone, so {tenantId: 1, x: 1} also serves plain {tenantId} queries.
 *
 * Usage:
 *   node --env-file=.env.local scripts/setup-indexes.cjs
 *
 * Needs MONGODB_URI. The database is CLOUD_DB_NAME, defaulting to velbiz_dev,
 * the same rule as lib/mongodb.js, so it cannot touch the live database
 * unless told to.
 */
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('MONGODB_URI is not set. Add it to .env.local.');
    process.exit(1);
}

async function setupIndexes() {
    const client = new MongoClient(uri);
    await client.connect();
    const dbName = process.env.CLOUD_DB_NAME || 'velbiz_dev';
    console.log(`Setting up VelBiz Cloud indexes in database: ${dbName}\n`);
    const db = client.db(dbName);

    
    await db.collection('tenants').createIndex({ tenantId: 1 }, { unique: true, name: 'tenants_tenantId_unique' });
    // Public onboarding (/api/cloud/onboarding) checked for a duplicate email
    // then inserted, which is a race under concurrent signups. This index is
    // the actual guarantee; the route catches E11000 and answers as though the
    // duplicate had succeeded, so the response cannot be used to enumerate
    // which businesses are customers.
    await db.collection('tenants').createIndex(
        { 'contact.email': 1 },
        { unique: true, partialFilterExpression: { 'contact.email': { $type: 'string' } }, name: 'tenants_contact_email_unique' }
    );
    console.log('  ✅  tenants: tenantId - unique');

    await db.collection('tenant_users').createIndex({ tenantId: 1 }, { name: 'tenant_users_tenantId' });
    await db.collection('tenant_users').createIndex({ username: 1 }, { unique: true, name: 'tenant_users_username_unique' });
    console.log('  ✅  tenant_users: tenantId, username (unique)');

    await db.collection('tenant_clients').createIndex({ tenantId: 1 }, { name: 'tenant_clients_tenantId' });
    console.log('  ✅  tenant_clients: tenantId');

    await db.collection('tenant_products').createIndex({ tenantId: 1 }, { name: 'tenant_products_tenantId' });
    console.log('  ✅  tenant_products: tenantId');

    await db.collection('tenant_templates').createIndex({ tenantId: 1 }, { name: 'tenant_templates_tenantId' });
    console.log('  ✅  tenant_templates: tenantId');

    await db.collection('tenant_documents').createIndex({ tenantId: 1, createdAt: -1 }, { name: 'tenant_documents_tenantId_createdAt' });
    await db.collection('tenant_documents').createIndex({ tenantId: 1, docType: 1 }, { name: 'tenant_documents_tenantId_docType' });
    // Public share links (/cloud/doc/[docNumber]/[secretKey]) look up by secretKey with
    // no tenantId in scope at all - this is the one query on this collection that isn't
    // tenant-first, so it needs its own index.
    await db.collection('tenant_documents').createIndex({ secretKey: 1 }, { sparse: true, name: 'tenant_documents_secretKey' });
    await db.collection('tenant_documents').createIndex({ linkedInvoiceId: 1 }, { sparse: true, name: 'tenant_documents_linkedInvoiceId' });
    await db.collection('tenant_documents').createIndex({ tenantId: 1, docType: 1, dueDate: 1 }, { sparse: true, name: 'tenant_documents_tenantId_docType_dueDate' });
    console.log('  ✅  tenant_documents: (tenantId, createdAt), (tenantId, docType), secretKey, linkedInvoiceId');

    await db.collection('erp_leads').createIndex({ tenantId: 1, updatedAt: -1 }, { name: 'erp_leads_tenantId_updatedAt' });
    await db.collection('erp_leads').createIndex({ tenantId: 1, followUpDate: 1 }, { sparse: true, name: 'erp_leads_tenantId_followUpDate' });
    await db.collection('erp_pipeline_stages').createIndex({ tenantId: 1 }, { unique: true, name: 'erp_pipeline_stages_tenantId_unique' });
    console.log('  ✅  erp_leads, erp_pipeline_stages');

    await db.collection('erp_calendar_events').createIndex({ tenantId: 1, date: 1 }, { name: 'erp_calendar_events_tenantId_date' });
    console.log('  ✅  erp_calendar_events');

    await db.collection('erp_purchase_orders').createIndex({ tenantId: 1, createdAt: -1 }, { name: 'erp_po_tenantId_createdAt' });
    await db.collection('erp_purchase_orders').createIndex({ tenantId: 1, status: 1 }, { name: 'erp_po_tenantId_status' });
    console.log('  ✅  erp_purchase_orders');

    await db.collection('erp_sales_orders').createIndex({ tenantId: 1, createdAt: -1 }, { name: 'erp_so_tenantId_createdAt' });
    console.log('  ✅  erp_sales_orders');

    await db.collection('erp_warehouses').createIndex({ tenantId: 1 }, { name: 'erp_warehouses_tenantId' });
    await db.collection('erp_stock_moves').createIndex({ tenantId: 1, createdAt: -1 }, { name: 'erp_stock_moves_tenantId_createdAt' });
    await db.collection('erp_stock_moves').createIndex({ tenantId: 1, itemId: 1, warehouseId: 1 }, { name: 'erp_stock_moves_item_warehouse' });
    console.log('  ✅  erp_warehouses, erp_stock_moves');

    await db.collection('erp_expenses').createIndex({ tenantId: 1, createdAt: -1 }, { name: 'erp_expenses_tenantId_createdAt' });
    await db.collection('erp_expense_categories').createIndex({ tenantId: 1 }, { name: 'erp_expense_categories_tenantId' });
    console.log('  ✅  erp_expenses, erp_expense_categories');

    await db.collection('erp_ledger_entries').createIndex({ tenantId: 1, date: -1 }, { name: 'erp_ledger_tenantId_date' });
    await db.collection('erp_bank_accounts').createIndex({ tenantId: 1 }, { name: 'erp_bank_accounts_tenantId' });
    await db.collection('erp_payments').createIndex({ tenantId: 1, documentId: 1 }, { name: 'erp_payments_tenantId_documentId' });
    
    // Tally-Grade Chart of Accounts & General Ledger Suite
    await db.collection('erp_ledgers').createIndex({ tenantId: 1, groupCode: 1 }, { name: 'erp_ledgers_tenant_group' });
    await db.collection('erp_ledgers').createIndex({ tenantId: 1, name: 1 }, { name: 'erp_ledgers_tenant_name' });
    await db.collection('erp_ledgers').createIndex({ tenantId: 1, linkedEntityId: 1 }, { sparse: true, name: 'erp_ledgers_tenant_linkedEntity' });
    await db.collection('erp_vouchers').createIndex({ tenantId: 1, date: -1 }, { name: 'erp_vouchers_tenant_date' });
    await db.collection('erp_vouchers').createIndex({ tenantId: 1, voucherType: 1, date: -1 }, { name: 'erp_vouchers_tenant_type_date' });
    /*
     * UNIQUE. A voucher number is the human reference for an entry in the
     * books - it is what an auditor quotes and what a correction refers back
     * to - so two vouchers carrying the same number is not a cosmetic problem,
     * it makes the ledger unciteable.
     *
     * This index was previously non-unique, and duplicates duly appeared:
     * CNT-2026-0001 existed twice in velcaryn_dev after a counter was reset by
     * a test script. The application-side counter fix removes the usual cause;
     * this removes the possibility.
     *
     * Build this AFTER scripts/fix-duplicate-vouchers.mjs has run - the index
     * cannot be created while duplicates exist, and setup-indexes will report
     * an E11000 naming the offending number if any remain.
     */
    await db.collection('erp_vouchers').createIndex(
        { tenantId: 1, voucherNumber: 1 },
        { unique: true, name: 'erp_vouchers_tenant_number_unique' }
    );
    // The old non-unique index has the identical key, so it is now pure
    // overhead on every voucher write. Dropped once the unique one exists.
    try {
        await db.collection('erp_vouchers').dropIndex('erp_vouchers_tenant_number');
        console.log("  ♻️  dropped erp_vouchers_tenant_number (superseded by the unique index)");
    } catch { /* already gone */ }
    /*
     * Idempotency key for auto-posted vouchers. `sourceRef` is
     * `{module}:{documentId}` - so an invoice, a payment or a cron run that
     * retries cannot post the same voucher twice.
     *
     * PARTIAL, so the hundreds of manually-entered vouchers that carry no
     * sourceRef are excluded rather than colliding on null. Same discipline as
     * the HMS lineRef / orderRef indexes.
     */
    await db.collection('erp_vouchers').createIndex(
        { tenantId: 1, sourceRef: 1 },
        {
            unique: true,
            name: 'erp_vouchers_tenant_sourceRef_unique',
            partialFilterExpression: { sourceRef: { $type: 'string' } },
        }
    );
    await db.collection('erp_ledger_postings').createIndex({ tenantId: 1, ledgerId: 1, date: -1 }, { name: 'erp_postings_tenant_ledger_date' });
    await db.collection('erp_ledger_postings').createIndex({ tenantId: 1, voucherId: 1 }, { name: 'erp_postings_tenant_voucher' });
    console.log('  ✅  erp_ledgers, erp_vouchers, erp_ledger_postings, erp_payments');

    await db.collection('erp_tax_profiles').createIndex({ tenantId: 1 }, { name: 'erp_tax_profiles_tenantId' });
    // The upsert key generateErpNumber() hits on every single document-number
    // allocation across every module - this is the single most-hit query in the
    // whole ERP, and it's a findOneAndUpdate on this exact compound key.
    await db.collection('erp_counters').createIndex({ tenantId: 1, module: 1, year: 1 }, { unique: true, name: 'erp_counters_tenant_module_year_unique' });
    console.log('  ✅  erp_tax_profiles, erp_counters (unique)');

    // Recurring-invoice generation cron scans exactly this shape every run
    // ({ active: true, nextRunDate: { $lte: now } }) across every tenant.
    await db.collection('erp_recurring_invoices').createIndex({ active: 1, nextRunDate: 1 }, { name: 'erp_recurring_active_nextRunDate' });
    await db.collection('erp_recurring_invoices').createIndex({ tenantId: 1 }, { name: 'erp_recurring_tenantId' });
    console.log('  ✅  erp_recurring_invoices (incl. cron scan index)');

    await db.collection('erp_employees').createIndex({ tenantId: 1 }, { name: 'erp_employees_tenantId' });
    await db.collection('erp_departments').createIndex({ tenantId: 1 }, { name: 'erp_departments_tenantId' });
    await db.collection('erp_attendance').createIndex({ tenantId: 1, employeeId: 1, date: -1 }, { name: 'erp_attendance_tenant_employee_date' });
    await db.collection('erp_leave_requests').createIndex({ tenantId: 1 }, { name: 'erp_leave_requests_tenantId' });
    await db.collection('erp_payroll_runs').createIndex({ tenantId: 1 }, { name: 'erp_payroll_runs_tenantId' });
    console.log('  ✅  erp_employees, erp_departments, erp_attendance, erp_leave_requests, erp_payroll_runs');

    await db.collection('audit_logs').createIndex({ tenantId: 1, at: -1 }, { name: 'audit_logs_tenantId_at' });
    console.log('  ✅  audit_logs (Cloud)');


    // ── CRM: timeline, tasks, notes, opportunities ────────────────────────────────────────────────
    await db.collection('activity_timeline').createIndex(
        { tenantId: 1, targetType: 1, targetId: 1, occurredAt: -1 },
        { name: 'idx_timeline_target_date' }
    );
    await db.collection('activity_timeline').createIndex(
        { tenantId: 1, occurredAt: -1 },
        { name: 'idx_timeline_tenant_date' }
    );
    console.log('  ✅  activity_timeline: tenant+target+date, tenant+date');

    await db.collection('erp_tasks').createIndex(
        { tenantId: 1, status: 1, dueDate: 1 },
        { name: 'idx_tasks_tenant_status_due' }
    );
    await db.collection('erp_tasks').createIndex(
        { tenantId: 1, assigneeEmail: 1, status: 1 },
        { name: 'idx_tasks_tenant_assignee_status' }
    );
    console.log('  ✅  erp_tasks: tenant+status+due, tenant+assignee+status');

    await db.collection('erp_notes').createIndex(
        { tenantId: 1, updatedAt: -1 },
        { name: 'idx_notes_tenant_updated' }
    );
    await db.collection('erp_notes').createIndex(
        { tenantId: 1, 'links.type': 1, 'links.id': 1 },
        { name: 'idx_notes_tenant_links' }
    );
    console.log('  ✅  erp_notes: tenant+updated, tenant+links');

    await db.collection('erp_opportunities').createIndex(
        { tenantId: 1, stage: 1, updatedAt: -1 },
        { name: 'idx_opportunities_tenant_stage_updated' }
    );
    await db.collection('erp_opportunities').createIndex(
        { tenantId: 1, closedWon: 1, amount: -1 },
        { name: 'idx_opportunities_tenant_closed_amount' }
    );
    console.log('  ✅  erp_opportunities: tenant+stage+updated, tenant+closedWon+amount');

    await client.close();
    console.log('\nAll indexes created.');
}

setupIndexes().catch((err) => {
    console.error('\nIndex setup failed:', err.message);
    process.exit(1);
});
