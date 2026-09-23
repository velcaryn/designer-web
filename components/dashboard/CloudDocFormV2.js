'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useCloudUser } from '@/app/(erp)/cloud/dashboard/layout';
import CloudDocPDFPreview from './CloudDocPDFPreview';
import { normalizePhone } from '@/lib/phone';
import { contact } from '@/config/site';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD'];
const UNITS = ['Nos', 'Pcs', 'Box', 'Set', 'Pack', 'Dozen', 'Carton', 'Roll', 'Kg', 'Litre', 'Metre'];

function newLineItem() {
    return { product: '', hsnCode: '', description: '', qty: 1, unit: 'Nos', unitPrice: 0, taxRate: 18, totalPrice: 0 };
}

function Card({ title, children, accent }) {
    return (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ background: accent || '#f8fafc', borderBottom: '1px solid #e5e7eb', padding: '11px 20px', fontSize: '13px', fontWeight: 700, color: 'var(--secondary-color)' }}>
                {title}
            </div>
            <div style={{ padding: '20px' }}>{children}</div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            {children}
        </div>
    );
}

function TotalRow({ label, value, bold, accent, color }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '9px 14px',
            background: accent ? 'var(--secondary-color)' : 'transparent',
            borderBottom: '1px solid #f1f5f9',
            fontWeight: bold ? 700 : 400,
            fontSize: bold ? '14px' : '13px',
            color: accent ? 'white' : color || '#374151',
        }}>
            <span>{label}</span><span>{value}</span>
        </div>
    );
}

function btnStyle(bg) {
    return {
        background: bg, color: 'white', border: 'none', borderRadius: '7px',
        padding: '10px 18px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
        opacity: 1, transition: 'opacity 0.2s', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: '8px',
    };
}

function SavingLabel({ label }) {
    return (
        <>
            <span style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', display: 'inline-block', animation: 'cdf-spin 0.7s linear infinite' }} />
            {label}
        </>
    );
}

export default function CloudDocFormV2() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // The "New Quote"/"New Invoice" links pass ?type=Quote or ?type=Invoice - the 'v2'
    // suffix only exists internally on the Document Type <select>'s own option values
    // (docType + 'v2'), never in the URL. Accepting only 'Quotev2' here meant every
    // fresh document silently defaulted to Invoice regardless of which link was clicked.
    const typeParam = searchParams.get('type') || 'Invoice';
    const initialDocType = typeParam === 'Quote' ? 'Quote' : 'Invoice';
    
    const user = useCloudUser();
    const editId = searchParams.get('edit') || '';
    const convertId = searchParams.get('convert') || '';

    const [items, setItems] = useState([]);
    const [clients, setClients] = useState([]);
    const [sentQuotes, setSentQuotes] = useState([]);
    const [quoteSearch, setQuoteSearch] = useState('');
    const [quoteSearchOpen, setQuoteSearchOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    // Form states
    const [docType, setDocType] = useState(initialDocType);
    const [docNumber, setDocNumber] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [validity, setValidity] = useState('30 days');
    
    // References & Order Details
    const [orderReferences, setOrderReferences] = useState({
        deliveryNote: '', termsOfPayment: '', suppliersRef: '', otherReference: '',
        buyersOrderNo: '', buyersOrderDate: '', despatchDocumentNo: '',
        despatchedThrough: '', destination: '', eWayBillNo: '', termsOfDelivery: '',
        deliveryContactPerson: '', deliveryContactNumber: ''
    });

    const [selectedClientId, setSelectedClientId] = useState('');
    const [customer, setCustomer] = useState({ name: '', company: '', phone: '', email: '', address: '', gstin: '', country: 'India' });
    
    // Shipping Address
    const [shippingAddress, setShippingAddress] = useState({
        sameAsBilling: true, name: '', address: '', gstin: ''
    });

    const [lineItems, setLineItems] = useState([newLineItem()]);
    
    // Taxes & Discount
    const [isInterState, setIsInterState] = useState(false); // true = IGST, false = CGST+SGST
    const [discountRate, setDiscountRate] = useState(0); // the number the user typed - meaning depends on discountType
    const [discountType, setDiscountType] = useState('percent'); // 'percent' | 'flat'
    const [notes, setNotes] = useState('');
    const [hideDocumentDetails, setHideDocumentDetails] = useState(false);
    
    // Structured Terms
    const [termsList, setTermsList] = useState([
        { key: 'Price Basis', value: 'Ex-Works' },
        { key: 'Delivery', value: 'Immediate' },
        { key: 'Payment', value: '100% Advance' },
        { key: 'Validity', value: '15 days' },
    ]);
    const [includeTerms, setIncludeTerms] = useState(initialDocType === 'Quote');

    // Custom branding
    const [brandingOverrides, setBrandingOverrides] = useState({
        enabled: false, customHexColor: '#4A1088', letterheadPage1: '', letterheadPage2: ''
    });

    // Custom key-value pairs
    const [sellerCustomFields, setSellerCustomFields] = useState([]);
    const [customerCustomFields, setCustomerCustomFields] = useState([]);
    const [tcOpen, setTcOpen] = useState(false);

    // Template selection - tenant's own saved templates first, platform default as fallback
    const [templates, setTemplates] = useState([]);
    const [platformDefault, setPlatformDefault] = useState(null);
    const [templateId, setTemplateId] = useState('');
    const [taxProfiles, setTaxProfiles] = useState([]);

    useEffect(() => {
        Promise.all([
            fetch('/api/cloud/items').then(r => r.json()),
            fetch('/api/cloud/clients').then(r => r.json()),
            fetch('/api/cloud/templates').then(r => r.json()),
            fetch('/api/cloud/erp/config/tax-profiles').then(r => r.ok ? r.json() : { profiles: [] }).catch(() => ({ profiles: [] })),
            fetch('/api/cloud/documents').then(r => r.json()).catch(() => ({ documents: [] })),
        ]).then(([itemsData, clientsData, templatesData, taxData, docsData]) => {
            setItems(itemsData.items || []);
            setClients(clientsData.clients || []);
            setTaxProfiles(taxData.profiles || []);
            setTemplates(templatesData.templates || []);
            setPlatformDefault(templatesData.platformDefault || null);
            const defaultTemplate = (templatesData.templates || []).find(t => t.isDefault);
            if (defaultTemplate && !editId && !convertId) setTemplateId(defaultTemplate._id);
            // Quotes worth linking an invoice to - sent ones only (a draft quote hasn't
            // been agreed to yet, so there's nothing to bill against).
            setSentQuotes((docsData.documents || []).filter(d => d.docType === 'Quote' && d.status === 'sent'));
        }).catch(() => {});
    }, []);

    // Fetch next-number sequential number for new documents
    useEffect(() => {
        if (!editId) {
            fetch(`/api/cloud/documents?action=next-number&type=${docType}`)
                .then(r => r.json())
                .then(data => {
                    if (data.nextNumber) setDocNumber(data.nextNumber);
                }).catch(() => {});
        }
    }, [docType, editId]);

    // Pre-load existing document details if editing or converting
    useEffect(() => {
        const idToFetch = editId || convertId;
        if (idToFetch) {
            fetch(`/api/cloud/documents/${idToFetch}`)
                .then(r => r.json())
                .then(data => {
                    if (data.document) {
                        const d = data.document;
                        if (editId) {
                            setDocType(d.docType || 'Invoice');
                            setDocNumber(d.docNumber || '');
                        } else {
                            setDocType('Invoice');
                        }
                        setCurrency(d.currency || 'INR');
                        setValidity(d.validity || '30 days');
                        setOrderReferences(d.orderReferences || {});
                        setCustomer({
                            name: d.customer?.name || '',
                            company: d.customer?.company || '',
                            phone: d.customer?.phone || '',
                            email: d.customer?.email || '',
                            address: d.customer?.address || '',
                            gstin: d.customer?.gstin || '',
                            country: d.customer?.country || 'India'
                        });
                        setShippingAddress(d.shippingAddress || { sameAsBilling: true });
                        setLineItems(d.lineItems || [newLineItem()]);
                        setIsInterState(d.taxType === 'IGST');
                        setDiscountType(d.discountType === 'flat' ? 'flat' : 'percent');
                        setDiscountRate((d.discountType === 'flat' ? d.discountFlatValue : d.discountRate) || 0);
                        setNotes(d.notes || '');
                        setHideDocumentDetails(!!d.hideDocumentDetails);
                        setTemplateId(d.templateId || '');
                        if (d.termsList) {
                            setTermsList(d.termsList);
                            setIncludeTerms(d.termsList.length > 0);
                        } else {
                            // If termsList is completely missing (legacy), set default based on docType
                            setIncludeTerms(d.docType === 'Quote');
                        }
                        if (d.sellerCustomFields) setSellerCustomFields(d.sellerCustomFields);
                        if (d.customerCustomFields) setCustomerCustomFields(d.customerCustomFields);
                        if (d.brandColor) {
                            setBrandingOverrides({
                                enabled: true,
                                customHexColor: d.brandColor,
                                letterheadPage1: d.letterheadPage1 || '',
                                letterheadPage2: d.letterheadPage2 || ''
                            });
                        }
                    }
                }).catch(() => toast.error('Failed to load document details.'));
        }
    }, [editId, convertId]);

    // Pre-fill client profile
    function handleClientSelect(e) {
        const cId = e.target.value;
        setSelectedClientId(cId);
        if (!cId) return;
        const c = clients.find(cl => cl._id === cId);
        if (c) {
            setCustomer({
                name: c.name || '',
                company: c.company || c.name || '',
                phone: c.phone || '',
                email: c.email || '',
                address: c.address || '',
                gstin: c.gstin || '',
                country: c.country || 'India'
            });
        }
    }

    // Line item modifiers
    function updateLineItem(idx, field, value) {
        setLineItems(prev => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], [field]: value };
            
            if (field === 'product') {
                const matched = items.find(it => it.name.toLowerCase() === value.toLowerCase().trim());
                if (matched) {
                    updated[idx].hsnCode = matched.hsnCode || '';
                    updated[idx].unit = matched.unit || 'Nos';
                    updated[idx].unitPrice = matched.defaultUnitPrice || 0;
                    updated[idx].taxRate = matched.taxRate || 18;
                    updated[idx].totalPrice = (parseFloat(updated[idx].qty) || 0) * (matched.defaultUnitPrice || 0);
                }
            }
            
            // Tax Configuration (Phase 7c): typing/changing an HSN code auto-applies the
            // matching tax profile's rate, taking priority over the catalog item's default
            // rate since HSN is the more specific, tax-authority-facing signal.
            if (field === 'hsnCode') {
                const profile = taxProfiles.find(p => (p.hsnCodes || []).includes(String(value).trim()));
                if (profile) updated[idx].taxRate = profile.isExempt ? 0 : profile.rate;
            }

            if (field === 'qty' || field === 'unitPrice') {
                const qty = field === 'qty' ? parseFloat(value) || 0 : parseFloat(updated[idx].qty) || 0;
                const up = field === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(updated[idx].unitPrice) || 0;
                updated[idx].totalPrice = qty * up;
            }
            return updated;
        });
    }

    function addRow() { setLineItems(prev => [...prev, newLineItem()]); }
    function removeRow(idx) { if (lineItems.length > 1) setLineItems(prev => prev.filter((_, i) => i !== idx)); }

    // Dynamic Lists (Custom Fields & Terms)
    function addToList(setter, defaultObj) { setter(p => [...p, defaultObj]); }
    function removeFromList(setter, idx) { setter(p => p.filter((_, i) => i !== idx)); }
    function updateListItem(setter, idx, f, v) {
        setter(p => {
            const copy = [...p];
            copy[idx] = { ...copy[idx], [f]: v };
            return copy;
        });
    }

    // Pricing maths
    const subtotal = lineItems.reduce((s, i) => s + (i.totalPrice || 0), 0);
    // A flat-amount discount is applied line-by-line as a percentage anyway (so it can be
    // distributed proportionally across items for tax purposes) - this just converts
    // whichever the user typed into that common "effective %" the rest of the maths uses.
    // Capped at the subtotal so a flat discount larger than the bill can't go negative.
    const effectiveDiscountRate = discountType === 'flat'
        ? (subtotal > 0 ? (Math.min(discountRate, subtotal) / subtotal) * 100 : 0)
        : discountRate;
    const discountAmount = subtotal * (effectiveDiscountRate / 100);
    const afterDiscount = subtotal - discountAmount;

    // Tax calculation per item
    let totalTaxAmount = 0;
    const taxBreakdown = {}; // e.g. { "18": { taxable: 1000, cgst: 90, sgst: 90, igst: 0 } }

    lineItems.forEach(item => {
        const itemTaxRate = parseFloat(item.taxRate) || 0;
        if (itemTaxRate > 0) {
            // Apply proportional discount to item
            const itemDiscount = (item.totalPrice || 0) * (effectiveDiscountRate / 100);
            const itemTaxable = (item.totalPrice || 0) - itemDiscount;
            const itemTax = itemTaxable * (itemTaxRate / 100);
            totalTaxAmount += itemTax;
            
            if (!taxBreakdown[itemTaxRate]) {
                taxBreakdown[itemTaxRate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
            }
            taxBreakdown[itemTaxRate].taxable += itemTaxable;
            taxBreakdown[itemTaxRate].totalTax += itemTax;
            
            if (isInterState) {
                taxBreakdown[itemTaxRate].igst += itemTax;
            } else {
                taxBreakdown[itemTaxRate].cgst += (itemTax / 2);
                taxBreakdown[itemTaxRate].sgst += (itemTax / 2);
            }
        }
    });

    const grandTotal = Math.round(afterDiscount + totalTaxAmount);
    const roundOff = grandTotal - (afterDiscount + totalTaxAmount);

    function buildPayload() {
        return {
            version: 'v2',
            docType,
            docNumber,
            customer,
            shippingAddress,
            orderReferences,
            lineItems,
            currency,
            validity,
            subtotal,
            taxRate: 0, // In V2, tax is per item. We set global to 0 so legacy code doesn't double tax if it reads it.
            taxType: isInterState ? 'IGST' : 'CGST_SGST', // For compatibility
            taxAmount: totalTaxAmount,
            // discountRate is always saved as the effective percentage so anything else
            // rendering this doc (the PDF engine, the public view) doesn't need to know
            // about discount types - discountType/discountFlatValue exist purely so
            // re-opening this document for editing can show what was actually typed.
            discountRate: parseFloat(effectiveDiscountRate.toFixed(4)) || 0,
            discountType,
            discountFlatValue: discountType === 'flat' ? (parseFloat(discountRate) || 0) : 0,
            discountAmount,
            grandTotal,
            roundOff,
            notes,
            termsList: includeTerms ? termsList : [],
            hideDocumentDetails,
            templateId: templateId || null,
            // Resolved client-side purely so the in-form "Preview PDF" button reflects the
            // chosen template immediately - the server re-resolves and snapshots it from
            // templateId independently on save, this is not trusted as the source of truth.
            templateConfig: templateId
                ? (templates.find(t => t._id === templateId)?.config || null)
                : null,
            businessName: user?.businessName || 'My Business',
            brandColor: brandingOverrides.enabled ? brandingOverrides.customHexColor : (user?.branding?.customHexColor || '#4A1088'),
            letterheadPage1: brandingOverrides.enabled ? brandingOverrides.letterheadPage1 : (user?.branding?.letterheadPage1 || ''),
            letterheadPage2: brandingOverrides.enabled ? brandingOverrides.letterheadPage2 : (user?.branding?.letterheadPage2 || ''),
            useUploadedLetterhead: brandingOverrides.enabled ? !!brandingOverrides.letterheadPage1 : (user?.branding?.useUploadedLetterhead || false),
            brandLogo: user?.branding?.brandLogo || '',
            signatoryImage: user?.branding?.signatoryImage || '',
            companyTag1: user?.companyTag1 || '',
            companyTag2: user?.companyTag2 || '',
            companyTag3: user?.companyTag3 || '',
            sellerCustomFields,
            customerCustomFields,
            sellerInfo: {
                name: user?.businessName || '',
                address: user?.contact?.address ? `${user.contact.address.line1 || ''}, ${user.contact.address.city || ''}, ${user.contact.address.state || ''} - ${user.contact.address.pin || ''}` : '',
                gstin: user?.contact?.gstin || '',
                email: user?.contact?.email || user?.email || '',
                phone: user?.contact?.phone || ''
            }
        };
    }

    async function handleSave(status) {
        if (!customer.name.trim()) { toast.error('Please enter customer name.'); return; }
        if (lineItems.some(i => !i.product.trim())) { toast.error('Please specify a product name for all rows.'); return; }
        if (!docNumber.trim()) { toast.error('Please enter document number.'); return; }

        setIsSaving(true);
        try {
            const payload = buildPayload();
            const url = editId ? `/api/cloud/documents/${editId}` : '/api/cloud/documents';
            const method = editId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, status }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || 'Save failed.'); return; }

            const finalNum = data.docNumber || docNumber;
            if (status === 'sent' && finalNum) {
                toast.success(`${docType} ${finalNum} saved and marked sent!`);
            } else {
                toast.success(`${docType} draft saved.`);
            }
            router.push('/cloud/dashboard/documents');
        } catch { toast.error('Network error.'); }
        finally { setIsSaving(false); }
    }

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Top action bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--secondary-color)', margin: 0 }}>
                        {docType === 'Invoice' ? '🧾 New Tax Invoice' : '📝 New Quotation'}
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Build and preview the document specifications before saving.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={() => setPreviewOpen(true)} style={btnStyle('#4f46e5')}>👁 Preview PDF</button>
                    <button onClick={() => handleSave('draft')} disabled={isSaving} style={btnStyle('#f59e0b')}>
                        {isSaving ? <SavingLabel label="Saving…" /> : '💾 Save Draft'}
                    </button>
                    <button onClick={() => handleSave('sent')} disabled={isSaving} style={btnStyle('#16a34a')}>
                        {isSaving ? <SavingLabel label="Saving…" /> : '✅ Save & Mark Sent'}
                    </button>
                    <button onClick={() => router.push('/cloud/dashboard/documents')} disabled={isSaving} style={btnStyle('#6b7280')}>✕ Cancel</button>
                </div>
            </div>

            {/* Document Settings & References Card */}
            <Card title="Document Settings & References">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    <Field label="Document Type">
                        <select 
                            value={docType + 'v2'} 
                            onChange={e => {
                                const val = e.target.value;
                                const newType = val.replace('v2', '');
                                setDocType(newType);
                                if (!editId) {
                                    setIncludeTerms(newType === 'Quote');
                                }
                            }} 
                            style={inputStyle}
                            disabled={!!editId}
                        >
                            <option value="Quotev2">Quotation</option>
                            <option value="Invoicev2">Invoice</option>
                        </select>
                    </Field>
                    <Field label={docType === 'Invoice' ? 'Invoice Number' : 'Quotation Number'}>
                        <input 
                            value={docNumber} 
                            onChange={e => setDocNumber(e.target.value)} 
                            style={inputStyle} 
                            placeholder="e.g. prefix-INV-0001"
                        />
                    </Field>
                    <Field label="Currency">
                        <select value={currency} onChange={e => setCurrency(e.target.value)} style={inputStyle}>
                            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </Field>
                    <Field label="Validity">
                        <input value={validity} onChange={e => setValidity(e.target.value)} style={inputStyle} placeholder="e.g. 30 days" />
                    </Field>
                    {/* Only worth showing once the tenant has actually created a custom
                        template - with zero templates there's no real choice to make,
                        and surfacing a "VelBiz Default" option just invites the question
                        "what's that?" for no benefit. */}
                    {templates.length > 0 && (
                        <Field label="Template">
                            <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={inputStyle}>
                                <option value="">{platformDefault?.name || 'Standard'}</option>
                                {templates.map(t => (
                                    <option key={t._id} value={t._id}>{t.name}{t.isDefault ? ' (your default)' : ''}</option>
                                ))}
                            </select>
                        </Field>
                    )}
                </div>

                {/* Link an existing Quotation - only relevant when starting a fresh
                    Invoice from scratch (not already editing or converting one via the
                    Documents list's own "Convert to Invoice" button). Picking a quote here
                    reloads the form in that same, already-populated convert flow, so the
                    customer/line-items/discount are filled in instead of retyped. */}
                {docType === 'Invoice' && !editId && !convertId && (
                    <div style={{ marginBottom: '20px', position: 'relative' }}>
                        <label style={labelStyle}>Link to a Quotation (Optional)</label>
                        <input
                            value={quoteSearch}
                            onChange={e => { setQuoteSearch(e.target.value); setQuoteSearchOpen(true); }}
                            onFocus={() => setQuoteSearchOpen(true)}
                            onBlur={() => setTimeout(() => setQuoteSearchOpen(false), 150)}
                            style={inputStyle}
                            placeholder="Search by quote number or customer name…"
                        />
                        {quoteSearchOpen && quoteSearch.trim() && (() => {
                            const q = quoteSearch.trim().toLowerCase();
                            const matches = sentQuotes.filter(d =>
                                (d.docNumber || '').toLowerCase().includes(q) ||
                                (d.customer?.name || '').toLowerCase().includes(q) ||
                                (d.customer?.company || '').toLowerCase().includes(q)
                            ).slice(0, 8);
                            return (
                                <div style={{ position: 'absolute', zIndex: 20, top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '260px', overflowY: 'auto' }}>
                                    {matches.length === 0 ? (
                                        <div style={{ padding: '12px 14px', fontSize: '13px', color: '#94a3b8' }}>No sent quotations match &ldquo;{quoteSearch}&rdquo;.</div>
                                    ) : matches.map(d => (
                                        <button
                                            key={d._id}
                                            type="button"
                                            onMouseDown={() => router.push(`/cloud/dashboard/documents/new?convert=${d._id}`)}
                                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f1f5f9', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                                        >
                                            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--secondary-color)' }}>{d.docNumber}</div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{d.customer?.name || 'No customer'}{d.customer?.company ? ` (${d.customer.company})` : ''}</div>
                                        </button>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <h4 style={{ ...sectionHeadingStyle, margin: 0 }}>Order & Transport References</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4b5563', cursor: 'pointer', fontWeight: 600 }}>
                        <input type="checkbox" checked={hideDocumentDetails} onChange={e => setHideDocumentDetails(e.target.checked)} />
                        Hide Document Details Box on Print
                    </label>
                </div>
                {!hideDocumentDetails && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        <Field label="Delivery Note"><input value={orderReferences.deliveryNote} onChange={e => setOrderReferences(p => ({...p, deliveryNote: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="Terms of Payment"><input value={orderReferences.termsOfPayment} onChange={e => setOrderReferences(p => ({...p, termsOfPayment: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="Suppliers Ref"><input value={orderReferences.suppliersRef} onChange={e => setOrderReferences(p => ({...p, suppliersRef: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="Buyers Order No"><input value={orderReferences.buyersOrderNo} onChange={e => setOrderReferences(p => ({...p, buyersOrderNo: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="Buyers Order Date"><input type="date" value={orderReferences.buyersOrderDate} onChange={e => setOrderReferences(p => ({...p, buyersOrderDate: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="Despatch Doc No"><input value={orderReferences.despatchDocumentNo} onChange={e => setOrderReferences(p => ({...p, despatchDocumentNo: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="Despatched Through"><input value={orderReferences.despatchedThrough} onChange={e => setOrderReferences(p => ({...p, despatchedThrough: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="Destination"><input value={orderReferences.destination} onChange={e => setOrderReferences(p => ({...p, destination: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="e-Way Bill No"><input value={orderReferences.eWayBillNo} onChange={e => setOrderReferences(p => ({...p, eWayBillNo: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="Terms of Delivery"><input value={orderReferences.termsOfDelivery} onChange={e => setOrderReferences(p => ({...p, termsOfDelivery: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="Delivery Contact Person"><input value={orderReferences.deliveryContactPerson || ''} onChange={e => setOrderReferences(p => ({...p, deliveryContactPerson: e.target.value}))} style={inputStyle} /></Field>
                        <Field label="Delivery Contact Number"><input value={orderReferences.deliveryContactNumber || ''} onChange={e => setOrderReferences(p => ({...p, deliveryContactNumber: e.target.value}))} style={inputStyle} /></Field>
                    </div>
                )}
            </Card>

            {/* Seller profile block (onboarded data + custom tags) */}
            <Card title={`Seller - ${user?.businessName || 'My Business'}`} accent="#ede9fe">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.7 }}>
                    <div>
                        <strong style={{ color: 'var(--primary-color)' }}>{user?.businessName}</strong><br />
                        GSTIN: {user?.contact?.gstin || '-'}<br />
                        Phone: {user?.contact?.phone || '-'}
                    </div>
                    <div>
                        Address:<br />
                        {user?.contact?.address?.line1 ? `${user.contact.address.line1}, ${user.contact.address.city || ''}, ${user.contact.address.state || ''} - ${user.contact.address.pin || ''}` : '-'}
                    </div>
                    <div>
                        Authorized signatory:<br />
                        <strong>{user?.contact?.owner || '-'}</strong><br />
                        Email: {user?.contact?.email || user?.email}
                    </div>
                </div>

                {/* Custom Seller Fields */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary-color)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Seller Tags</h4>
                    {sellerCustomFields.map((field, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                            <input style={{ ...inputStyle, width: '180px' }} placeholder="Tag Name (e.g. Bank Acc)" value={field.label} onChange={e => updateListItem(setSellerCustomFields, idx, 'label', e.target.value)} />
                            <input style={inputStyle} placeholder="Value" value={field.value} onChange={e => updateListItem(setSellerCustomFields, idx, 'value', e.target.value)} />
                            <button type="button" onClick={() => removeFromList(setSellerCustomFields, idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px' }}>✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addToList(setSellerCustomFields, { label: '', value: '' })} style={{ background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>+ Add Seller Tag</button>
                </div>
            </Card>

            {/* Customer Details block */}
            <Card title="Customer / Bill To">
                <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Select Existing Client profile</label>
                    <select style={inputStyle} value={selectedClientId} onChange={handleClientSelect}>
                        <option value="">- Select or type manually -</option>
                        {clients.map(c => <option key={c._id} value={c._id}>{c.name} {c.contactPerson ? `(${c.contactPerson})` : ''}</option>)}
                    </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <Field label="Name *"><input value={customer.name || ''} onChange={e => setCustomer(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Contact name" /></Field>
                    <Field label="Company / Hospital"><input value={customer.company || ''} onChange={e => setCustomer(p => ({ ...p, company: e.target.value }))} style={inputStyle} placeholder="Company name" /></Field>
                    <Field label="Email"><input type="email" value={customer.email || ''} onChange={e => setCustomer(p => ({ ...p, email: e.target.value }))} style={inputStyle} placeholder="buyer@email.com" /></Field>
                    <Field label="Phone"><input value={customer.phone || ''} onChange={e => setCustomer(p => ({ ...p, phone: e.target.value }))} onBlur={e => setCustomer(p => ({ ...p, phone: normalizePhone(e.target.value) }))} style={inputStyle} placeholder={contact.phonePlaceholder} /></Field>
                    <Field label="Address"><input value={customer.address || ''} onChange={e => setCustomer(p => ({ ...p, address: e.target.value }))} style={inputStyle} placeholder="Street, City, State, Zip" /></Field>
                    <Field label="GSTIN"><input value={customer.gstin || ''} onChange={e => setCustomer(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} style={inputStyle} placeholder="33AAAAA1234A1Z1" maxLength="15" /></Field>
                </div>

                <h4 style={sectionHeadingStyle}>Shipping Address / Ship To</h4>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#4b5563', cursor: 'pointer' }}>
                        <input type="checkbox" checked={shippingAddress.sameAsBilling} onChange={e => setShippingAddress(p => ({ ...p, sameAsBilling: e.target.checked }))} />
                        Same as Billing Address
                    </label>
                </div>
                {!shippingAddress.sameAsBilling && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                        <Field label="Ship To Name"><input value={shippingAddress.name || ''} onChange={e => setShippingAddress(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Shipping Contact/Company" /></Field>
                        <Field label="Ship To Address"><input value={shippingAddress.address || ''} onChange={e => setShippingAddress(p => ({ ...p, address: e.target.value }))} style={inputStyle} placeholder="Shipping Address" /></Field>
                        <Field label="Ship To GSTIN"><input value={shippingAddress.gstin || ''} onChange={e => setShippingAddress(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} style={inputStyle} placeholder="Shipping GSTIN" maxLength="15" /></Field>
                    </div>
                )}

                {/* Custom Customer Fields */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary-color)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Custom Customer Tags</h4>
                    {customerCustomFields.map((field, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                            <input style={{ ...inputStyle, width: '180px' }} placeholder="Tag Name (e.g. DL No)" value={field.label} onChange={e => updateListItem(setCustomerCustomFields, idx, 'label', e.target.value)} />
                            <input style={inputStyle} placeholder="Value" value={field.value} onChange={e => updateListItem(setCustomerCustomFields, idx, 'value', e.target.value)} />
                            <button type="button" onClick={() => removeFromList(setCustomerCustomFields, idx)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px' }}>✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addToList(setCustomerCustomFields, { label: '', value: '' })} style={{ background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>+ Add Customer Tag</button>
                </div>
            </Card>

            {/* Line Items Card */}
            <Card title="Line Items">
                <div className="cdf-line-items-wrap" style={{ overflowX: 'auto' }}>
                    <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                        <thead>
                            <tr style={{ background: 'var(--secondary-color)', color: 'white' }}>
                                {[
                                    { label: 'S.No', w: '44px', align: 'center' },
                                    { label: 'Product Description', w: 'auto' },
                                    { label: 'HSN Code', w: '100px', align: 'center' },
                                    { label: 'Qty', w: '70px', align: 'center' },
                                    { label: 'Unit', w: '80px' },
                                    { label: 'Unit Price', w: '110px', align: 'right' },
                                    { label: 'Tax %', w: '80px', align: 'center' },
                                    { label: 'Total', w: '110px', align: 'right' },
                                    { label: '', w: '36px' },
                                ].map(h => (
                                    <th key={h.label} style={{ padding: '10px 8px', fontSize: '11.5px', fontWeight: 600, textAlign: h.align || 'left', width: h.w, whiteSpace: 'nowrap' }}>
                                        {h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td data-label="S.No" style={{ padding: '6px 4px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>{idx + 1}</td>
                                    <td data-label="Product" className="cd-stack-cell" style={{ padding: '6px 4px', minWidth: '200px' }}>
                                        <input list={`product-list-${idx}`} value={item.product} onChange={e => updateLineItem(idx, 'product', e.target.value)} style={{ ...inputStyle, fontSize: '12.5px', marginBottom: '4px' }} placeholder="Type or select product..." />
                                        <input value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} style={{ ...inputStyle, fontSize: '11.5px', background: 'transparent', border: 'none', borderBottom: '1px dashed #cbd5e1' }} placeholder="+ Extra description" />
                                        <datalist id={`product-list-${idx}`}>
                                            {items.map(it => <option key={it._id} value={it.name}>{it.name}</option>)}
                                        </datalist>
                                    </td>
                                    <td data-label="HSN Code" style={{ padding: '6px 4px' }}><input value={item.hsnCode} onChange={e => updateLineItem(idx, 'hsnCode', e.target.value)} style={{ ...inputStyle, fontSize: '12px', textAlign: 'center' }} placeholder="HSN" /></td>
                                    <td data-label="Qty" style={{ padding: '6px 4px' }}><input type="number" onFocus={(e) => e.target.select()} min="0" value={item.qty} onChange={e => updateLineItem(idx, 'qty', e.target.value)} style={{ ...inputStyle, fontSize: '12.5px', textAlign: 'center' }} /></td>
                                    <td data-label="Unit" style={{ padding: '6px 4px' }}>
                                        <select value={item.unit} onChange={e => updateLineItem(idx, 'unit', e.target.value)} style={{ ...inputStyle, fontSize: '12px' }}>
                                            {UNITS.map(u => <option key={u}>{u}</option>)}
                                        </select>
                                    </td>
                                    <td data-label="Unit Price" style={{ padding: '6px 4px' }}><input type="number" onFocus={(e) => e.target.select()} min="0" step="0.01" value={item.unitPrice} onChange={e => updateLineItem(idx, 'unitPrice', e.target.value)} style={{ ...inputStyle, fontSize: '12.5px', textAlign: 'right' }} /></td>
                                    <td data-label="Tax %" style={{ padding: '6px 4px' }}><input type="number" onFocus={(e) => e.target.select()} min="0" step="0.5" value={item.taxRate} onChange={e => updateLineItem(idx, 'taxRate', e.target.value)} style={{ ...inputStyle, fontSize: '12.5px', textAlign: 'center' }} /></td>
                                    <td data-label="Total" style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 700, fontSize: '13px', color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>
                                        {currency} {(item.totalPrice || 0).toFixed(2)}
                                    </td>
                                    <td data-label="" style={{ padding: '4px', textAlign: 'center' }}>
                                        {lineItems.length > 1 && (
                                            <button onClick={() => removeRow(idx)} style={{ background: '#fee2e2', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '15px', padding: '6px 14px', borderRadius: '6px', fontWeight: 700 }}>✕ Remove Item</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ marginTop: '14px' }}>
                    <button onClick={addRow} style={{ background: '#f0fdf4', border: '1.5px dashed #16a34a', color: '#16a34a', padding: '8px 18px', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', fontFamily: 'inherit' }}>
                        + Add Line Item
                    </button>
                </div>
            </Card>

            {/* Customizations, Branding, Terms & Summaries */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <Card title="Customizations">
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={isInterState} onChange={e => setIsInterState(e.target.checked)} />
                                Apply IGST (Inter-state billing) instead of CGST/SGST
                            </label>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                            <Field label="Discount">
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="number" onFocus={(e) => e.target.select()}
                                        min="0"
                                        max={discountType === 'percent' ? 100 : undefined}
                                        value={discountRate}
                                        onChange={e => setDiscountRate(parseFloat(e.target.value) || 0)}
                                        style={{ ...inputStyle, flex: 1 }}
                                    />
                                    <select value={discountType} onChange={e => setDiscountType(e.target.value)} style={{ ...inputStyle, width: '90px', flex: '0 0 auto' }}>
                                        <option value="percent">%</option>
                                        <option value="flat">{currency}</option>
                                    </select>
                                </div>
                            </Field>
                        </div>
                        <div>
                            <label style={labelStyle}>Notes / Description (Optional)</label>
                            <textarea
                                value={notes} onChange={e => setNotes(e.target.value)}
                                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                                placeholder="Additional notes or specifications for this document..."
                            />
                        </div>
                    </Card>

                    {/* Per-document branding/letterhead overrides - archived for now (not a
                        current requirement); brandingOverrides stays at its default
                        (enabled: false) so the save payload below is unaffected. Revisit
                        if/when there's an actual need for per-document brand overrides. */}

                    {/* Collapsible Terms & Conditions Section */}
                    <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-white)' }}>
                        <div 
                            style={{ background: '#f8fafc', padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            onClick={() => setTcOpen(!tcOpen)}
                        >
                            <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>📜 Edit Structured Terms & Conditions</div>
                            <div style={{ color: 'var(--text-muted)' }}>{tcOpen ? '▲' : '▼'}</div>
                        </div>
                        {tcOpen && (
                            <div style={{ padding: '16px', borderTop: '1px solid #d1d5db' }}>
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={includeTerms} onChange={e => setIncludeTerms(e.target.checked)} />
                                        Include Terms and Conditions on this document
                                    </label>
                                </div>
                                
                                {includeTerms && (
                                    <>
                                        {termsList.map((t, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                                <input style={{...inputStyle, flex: 1}} placeholder="Term Name (e.g. Validity)" value={t.key} onChange={e => updateListItem(setTermsList, i, 'key', e.target.value)} />
                                                <input style={{...inputStyle, flex: 2}} placeholder="Condition (e.g. 15 days)" value={t.value} onChange={e => updateListItem(setTermsList, i, 'value', e.target.value)} />
                                                <button onClick={() => removeFromList(setTermsList, i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '15px' }}>✕</button>
                                            </div>
                                        ))}
                                        <button onClick={() => addToList(setTermsList, {key:'', value:''})} style={btnSmall}>+ Add Term</button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Pricing Summary */}
                <div style={{ flex: '1 1 300px' }}>
                    <Card title="Pricing Summary">
                        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                            <TotalRow label="Subtotal" value={`${currency} ${subtotal.toFixed(2)}`} />
                            {discountRate > 0 && (
                                <TotalRow
                                    label={`Discount (${discountType === 'percent' ? `${discountRate}%` : `${currency} ${discountRate}`})`}
                                    value={`– ${currency} ${discountAmount.toFixed(2)}`}
                                    color="#ef4444"
                                />
                            )}
                            
                            {Object.keys(taxBreakdown).length > 0 && (
                                <div style={{ padding: '8px 14px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                                    TAX BREAKDOWN
                                </div>
                            )}
                            
                            {Object.entries(taxBreakdown).map(([rate, breakdown]) => (
                                <div key={rate} style={{ padding: '8px 14px', borderBottom: '1px dashed #e2e8f0', fontSize: '12px', color: 'var(--text-main)' }}>
                                    <div style={{ marginBottom: '2px', fontWeight: 600, color: '#333' }}>GST @ {rate}% (Taxable: {currency} {breakdown.taxable.toFixed(2)})</div>
                                    {isInterState ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IGST:</span> <span>{currency} {breakdown.igst.toFixed(2)}</span></div>
                                    ) : (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CGST:</span> <span>{currency} {breakdown.cgst.toFixed(2)}</span></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SGST:</span> <span>{currency} {breakdown.sgst.toFixed(2)}</span></div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {roundOff !== 0 && <TotalRow label="Round off" value={`${currency} ${roundOff.toFixed(2)}`} />}
                            <TotalRow label={`Grand Total`} value={`${currency} ${grandTotal.toFixed(2)}`} bold accent />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Bottom action buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px', paddingBottom: '48px', flexWrap: 'wrap' }}>
                <button onClick={() => setPreviewOpen(true)} style={btnStyle('#4f46e5')}>👁 Preview PDF</button>
                <button onClick={() => handleSave('draft')} disabled={isSaving} style={btnStyle('#f59e0b')}>{isSaving ? <SavingLabel label="Saving…" /> : '💾 Save Draft'}</button>
                <button onClick={() => handleSave('sent')} disabled={isSaving} style={btnStyle('#16a34a')}>{isSaving ? <SavingLabel label="Saving…" /> : '✅ Save & Mark Sent'}</button>
            </div>
            
            {previewOpen && (
                 <CloudDocPDFPreview document={buildPayload()} onClose={() => setPreviewOpen(false)} />
            )}
            <style>{`@keyframes cdf-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const labelStyle = { fontSize: '12px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px', display: 'block' };
const inputStyle = {
    padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
    fontSize: '13px', width: '100%', boxSizing: 'border-box',
    background: 'white', color: 'var(--text-main)', outline: 'none',
};
const sectionHeadingStyle = { fontSize: '14px', fontWeight: 700, color: 'var(--secondary-color)', marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' };
const btnSmall = { background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600, marginTop: '8px' };
