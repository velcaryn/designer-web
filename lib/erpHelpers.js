/**
 * VelBiz Cloud ERP - Shared Helpers
 * 
 * Utility functions shared across all ERP modules:
 * - Sequential document number generation (ERP-CRM-0001, ERP-PO-0001, etc.)
 * - Tenant-scoped collection access
 * - Input sanitization & validation
 * - Status workflow transitions
 */
import { getCloudDb } from '@/lib/cloudAuth';

// ─── Document Number Generation ───────────────────────────────────────────

const ERP_PREFIXES = {
    lead:           'LEAD',
    task:           'TSK',
    opportunity:    'OPP',
    note:           'NOTE',
    purchaseOrder:  'PO',
    vendorBill:     'BILL',
    stockMove:      'STK',
    expense:        'EXP',
    journal:        'JE',
    ledgerEntry:    'LED',
    employee:       'EMP',
    leaveRequest:   'LV',
    payrollRun:     'PAY',
    payment:        'PMT',
    salesOrder:     'SO',
};

/**
 * Generates the next sequential ERP document number for a given module.
 * Format: {PREFIX}-{YYYY}-{SEQ} e.g. LEAD-2026-0001
 */
export async function generateErpNumber(tenantId, module) {
    const prefix = ERP_PREFIXES[module] || module.toUpperCase();
    const year = new Date().getFullYear();
    const db = await getCloudDb();

    const counter = await db.collection('erp_counters').findOneAndUpdate(
        { tenantId, module, year },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );

    const seq = String(counter.seq).padStart(4, '0');
    return `${prefix}-${year}-${seq}`;
}

/**
 * Employee codes use the tenant's own short code instead of the platform-wide prefix/year
 * scheme - e.g. tenant TNT-RKT-2638 → "RKT-EMP-001". Employee IDs are permanent personnel
 * records, not annual documents, so there's no year component and the counter never resets.
 */
export async function generateEmployeeNumber(tenantId) {
    const tenantCode = tenantId.split('-')[1] || 'EMP';
    const db = await getCloudDb();

    const counter = await db.collection('erp_counters').findOneAndUpdate(
        { tenantId, module: 'employeeCode' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );

    const seq = String(counter.seq).padStart(3, '0');
    return `${tenantCode}-EMP-${seq}`;
}

/**
 * Computed invoice status (Phase 6 - Payments & Receivables). Draft/cancelled invoices
 * are left as-is (payments don't apply pre-send); otherwise status is derived live from
 * how much has been paid, rather than trusting a manually-set 'paid' flag that could
 * drift from the actual payment ledger.
 */
/**
 * Net Credit/Debit Note adjustment per invoice - a credit note reduces what's owed
 * (like an extra payment), a debit note increases it. Returns a Map keyed by
 * invoiceId (string) → signed total, for a single grouped query across N invoices.
 */
export async function computeNoteAdjustments(tenantId, invoiceIds) {
    if (!invoiceIds.length) return new Map();
    const db = await getCloudDb();
    const notes = await db.collection('tenant_documents').aggregate([
        { $match: { tenantId, docType: { $in: ['CreditNote', 'DebitNote'] }, linkedInvoiceId: { $in: invoiceIds } } },
        { $group: {
            _id: '$linkedInvoiceId',
            adjustment: { $sum: { $cond: [{ $eq: ['$docType', 'CreditNote'] }, '$grandTotal', { $multiply: ['$grandTotal', -1] }] } },
        } },
    ]).toArray();
    return new Map(notes.map(n => [n._id, n.adjustment]));
}

export function computeInvoiceStatus(doc, paidAmount) {
    if (doc.status === 'draft' || doc.status === 'cancelled') return doc.status;
    const grandTotal = doc.grandTotal || 0;
    const paid = paidAmount || 0;
    if (grandTotal > 0 && paid >= grandTotal) return 'paid';
    if (paid > 0) return 'partially_paid';
    if (doc.dueDate && new Date(doc.dueDate) < new Date()) return 'overdue';
    return doc.status || 'sent';
}

/**
 * docNumber prefix per tenant_documents docType. Invoice/Quote pre-date Phase 8;
 * CreditNote/DebitNote are new here, reusing the exact same numbering/PDF/public-share
 * pipeline as Invoices instead of a parallel system.
 */
export const DOC_TYPE_CODES = { Invoice: 'INV', Quote: 'QT', CreditNote: 'CN', DebitNote: 'DN' };

/**
 * Advances a recurring schedule's date by one period. Calendar-accurate (uses
 * setMonth/setFullYear so month-length and leap-year edge cases resolve correctly),
 * not a fixed-day approximation.
 */
export function nextRunFrom(date, frequency) {
    const d = new Date(date);
    if (frequency === 'weekly') d.setDate(d.getDate() + 7);
    else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (frequency === 'quarterly') d.setMonth(d.getMonth() + 3);
    else if (frequency === 'annual') d.setFullYear(d.getFullYear() + 1);
    return d;
}

// ─── Status Workflow ──────────────────────────────────────────────────────

/**
 * Valid status transitions per module type.
 * Each key maps from a current status → array of allowed next statuses.
 */
export const STATUS_FLOWS = {
    lead: {
        new:        ['qualified', 'lost'],
        qualified:  ['proposal', 'lost'],
        proposal:   ['negotiation', 'lost'],
        negotiation:['won', 'lost'],
        won:        [],
        lost:       ['new'],
    },
    purchaseOrder: {
        draft:      ['confirmed', 'cancelled'],
        confirmed:  ['received', 'cancelled'],
        received:   ['billed'],
        billed:     ['paid'],
        paid:       [],
        cancelled:  ['draft'],
    },
    expense: {
        draft:      ['submitted'],
        submitted:  ['approved', 'rejected'],
        approved:   ['paid'],
        rejected:   ['draft'],
        paid:       [],
    },
    leaveRequest: {
        pending:    ['approved', 'rejected'],
        approved:   ['cancelled'],
        rejected:   ['pending'],
        cancelled:  [],
    },
    payrollRun: {
        draft:      ['finalized', 'cancelled'],
        finalized:  ['paid', 'draft'],
        paid:       [],
        cancelled:  [],
    },
    salesOrder: {
        draft:      ['confirmed', 'cancelled'],
        confirmed:  ['fulfilled', 'cancelled'],
        fulfilled:  ['invoiced'],
        invoiced:   [],
        cancelled:  [],
    },
};

/**
 * Validates whether a status transition is allowed.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateStatusTransition(module, currentStatus, newStatus) {
    const flow = STATUS_FLOWS[module];
    if (!flow) return { valid: false, error: `Unknown module: ${module}` };
    if (!flow[currentStatus]) return { valid: false, error: `Unknown status: ${currentStatus}` };
    if (!flow[currentStatus].includes(newStatus)) {
        return {
            valid: false,
            error: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: [${flow[currentStatus].join(', ')}]`,
        };
    }
    return { valid: true };
}

// ─── Contacts (Clients & Vendors share one collection: tenant_clients) ────
// A single contact can be a customer, a vendor, or both - `roles` says which.
// This is what lets "Add existing client as vendor" work without duplicating data.

export const CONTACT_ROLES = ['customer', 'vendor'];

export function sanitizeBankDetails(raw) {
    const src = (raw && typeof raw === 'object') ? raw : {};
    return {
        bankName: sanitizeStr(src.bankName, 100),
        accountNo: sanitizeStr(src.accountNo, 30),
        ifscCode: sanitizeStr(src.ifscCode, 11).toUpperCase(),
        branch: sanitizeStr(src.branch, 100),
    };
}

// ─── Input Sanitization ───────────────────────────────────────────────────

/**
 * Escapes a user-supplied string for safe use inside a MongoDB $regex.
 *
 * Without this, a search box is a denial-of-service primitive: a value like
 * `(a+)+$` is a catastrophically backtracking pattern that pins the server CPU,
 * and metacharacters let a caller match documents the UI never intended to
 * expose. HMS already escapes its search inputs this way
 * (src/app/api/connect/hms/patients/route.js); the ERP search routes did not.
 *
 * The length cap is a second guard: regex cost grows with pattern length, and
 * no legitimate search term is 200 characters.
 */
export function escapeRegex(val, maxLen = 200) {
    return String(val || '').trim().slice(0, maxLen).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes a string field: trims whitespace, enforces max length.
 */
export function sanitizeStr(val, maxLen = 200) {
    return String(val || '').trim().slice(0, maxLen);
}

/**
 * Sanitizes a numeric field: parses float, defaults to 0.
 */
export function sanitizeNum(val, defaultVal = 0) {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : defaultVal;
}

/**
 * Sanitizes an email field: lowercase, trim, max length.
 */
export function sanitizeEmail(val) {
    return String(val || '').trim().toLowerCase().slice(0, 200);
}

/**
 * Sanitizes a phone field: trim, max length.
 */
export function sanitizePhone(val) {
    return String(val || '').trim().slice(0, 20);
}

// ─── Pipeline Stage Defaults ──────────────────────────────────────────────

export const DEFAULT_CRM_STAGES = [
    { id: 'new',         name: 'New',         order: 0, color: '#3b82f6' },
    { id: 'qualified',   name: 'Qualified',   order: 1, color: '#8b5cf6' },
    { id: 'proposal',    name: 'Proposal',    order: 2, color: '#f59e0b' },
    { id: 'negotiation', name: 'Negotiation', order: 3, color: '#ef4444' },
    { id: 'won',         name: 'Won',         order: 4, color: '#10b981' },
    { id: 'lost',        name: 'Lost',        order: 5, color: '#6b7280' },
];

// ─── HR Defaults ───────────────────────────────────────────────────────────

export const LEAVE_TYPES = ['sick', 'casual', 'earned', 'unpaid'];

// ─── Pagination Helper ────────────────────────────────────────────────────

/**
 * Extracts pagination params from a URL search params.
 * Returns { skip, limit, page }.
 */
export function paginationFromParams(searchParams, defaultLimit = 50) {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10)));
    return { skip: (page - 1) * limit, limit, page };
}
