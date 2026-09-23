import Link from 'next/link';
import clientPromise, { DB_NAME } from '@/lib/mongodb';
import { notFound } from 'next/navigation';
import { esc } from '@/lib/pdfUtils';

export const dynamic = 'force-dynamic';

export default async function CloudDocPublicPage(props) {
    const { docNumber, secretKey } = await props.params;

    if (!docNumber || !secretKey) notFound();

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const doc = await db.collection('tenant_documents').findOne({ docNumber, secretKey });
    if (!doc) {
        return (
            <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--bg-light)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ background: 'var(--bg-white)', padding: '40px 32px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(72,38,131,0.08)', textAlign: 'center', maxWidth: '440px', width: '100%', border: '1px solid rgba(72,38,131,0.1)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--secondary-color)', marginBottom: '12px' }}>Document Not Found</h1>
                    <p style={{ fontSize: '14px', color: '#6c757d', lineHeight: '1.6', marginBottom: '24px' }}>
                        The document reference <strong>{docNumber}</strong> could not be located or the link has expired.
                    </p>
                    <Link href="/" style={{ display: 'inline-block', padding: '12px 24px', background: 'var(--primary-color)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '13px', borderRadius: '8px', height: '40px', lineHeight: '16px', boxSizing: 'border-box' }}>
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const tenant = await db.collection('tenants').findOne({ tenantId: doc.tenantId });
    if (tenant) {
        if (!doc.brandLogo) doc.brandLogo = tenant.branding?.brandLogo || '';
        if (!doc.signatoryImage) doc.signatoryImage = tenant.branding?.signatoryImage || '';
    }

    const {
        businessName = 'Business', brandColor = '#4A1088',
        docType = 'Quote', currency = 'INR'
    } = doc;

    const TYPE_LABELS = { Invoice: 'Tax Invoice', CreditNote: 'Credit Note', DebitNote: 'Debit Note' };
    const typeLabel = TYPE_LABELS[docType] || 'Quotation';
    const bc = brandColor || '#4A1088';
    const pdfUrl = `/api/cloud/documents/${doc._id}/pdf?key=${secretKey}`;
    const downloadUrl = `${pdfUrl}&download=1`;

    const dateStr = new Date(doc.createdAt || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    // Extracted Data
    const seller = doc.sellerInfo || {};
    const buyer = doc.customer || {};
    const items = doc.lineItems || [];

    const fmt = (num) => Number(num || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: 'var(--bg-light)', color: '#333', minHeight: '100vh', paddingBottom: '60px' }}>
            <style dangerouslySetInnerHTML={{ __html: `
                * { box-sizing: border-box; }
                .cd-header { background: linear-gradient(135deg, ${bc} 0%, ${bc}dd 100%); color: white; padding: 18px 20px; border-bottom: 3px solid ${bc}99; box-shadow: 0 4px 20px ${bc}30; position: sticky; top: 0; z-index: 10; }
                .cd-nav-inner { max-width: 900px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
                .cd-brand { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1 1 auto; }
                .cd-brand-name { font-size: 17px; font-weight: 800; color: #fff; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .cd-brand-sub { font-size: 11.5px; color: rgba(255,255,255,0.75); font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .cd-action-group { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; }

                .cd-container { max-width: 900px; margin: 24px auto; padding: 0 20px; }
                .cd-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; padding: 24px; margin-bottom: 20px; }
                
                .cd-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
                
                .cd-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700; margin-bottom: 6px; display: block; }
                .cd-value { font-size: 14px; color: #0f172a; font-weight: 500; }
                .cd-value-lg { font-size: 24px; color: #0f172a; font-weight: 800; }
                
                .cd-address { font-size: 13px; line-height: 1.5; color: #475569; margin-top: 8px; }
                
                .cd-item-card { border-bottom: 1px solid #e2e8f0; padding: 16px 0; display: flex; flex-direction: column; gap: 8px; }
                .cd-item-card:last-child { border-bottom: none; }
                .cd-item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
                .cd-item-title { font-weight: 600; color: #1e293b; font-size: 14px; line-height: 1.4; }
                .cd-item-price { font-weight: 700; color: #0f172a; font-size: 14px; white-space: nowrap; }
                .cd-item-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12px; color: #64748b; }
                
                .cd-summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #475569; }
                .cd-summary-total { display: flex; justify-content: space-between; padding: 16px 0 0 0; margin-top: 8px; border-top: 2px solid #e2e8f0; font-size: 18px; font-weight: 800; color: #0f172a; }
                
                .cd-btn {
                    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                    padding: 0 18px; border-radius: 9px; font-size: 13px; font-weight: 700;
                    cursor: pointer; height: 42px; text-decoration: none; white-space: nowrap;
                    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
                }
                .cd-btn-icon { font-size: 15px; line-height: 1; }
                .cd-btn-primary {
                    background: #ffffff; color: ${bc}; border: none;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.18);
                }
                .cd-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(0,0,0,0.24); }
                .cd-btn-secondary {
                    border: 1.5px solid rgba(255,255,255,0.35); background: rgba(255,255,255,0.08); color: white;
                }
                .cd-btn-secondary:hover { background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.5); }

                @media (max-width: 600px) {
                    .cd-header { padding: 14px 16px; }
                    .cd-container { padding: 0 12px; margin: 16px auto; }
                    .cd-card { padding: 16px; }
                    .cd-nav-inner { flex-direction: column; align-items: stretch; gap: 14px; }
                    .cd-brand { justify-content: center; text-align: center; }
                    .cd-action-group { width: 100%; }
                    .cd-btn { flex: 1; }
                }
            ` }} />

            {/* Sticky Header */}
            <header className="cd-header">
                <div className="cd-nav-inner">
                    <div className="cd-brand">
                        {doc.brandLogo ? (
                            <img src={doc.brandLogo} alt="Logo" style={{ height: '34px', width: 'auto', maxWidth: '90px', objectFit: 'contain', background: 'white', padding: '4px', borderRadius: '6px', flexShrink: 0 }} />
                        ) : null}
                        <div style={{ minWidth: 0 }}>
                            <div className="cd-brand-name">{esc(businessName)}</div>
                            <div className="cd-brand-sub">{typeLabel} · {doc.docNumber}</div>
                        </div>
                    </div>
                    <div className="cd-action-group">
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="cd-btn cd-btn-secondary">
                            <span className="cd-btn-icon">🖨</span> Print
                        </a>
                        <a href={downloadUrl} className="cd-btn cd-btn-primary">
                            <span className="cd-btn-icon">⬇</span> Download PDF
                        </a>
                    </div>
                </div>
            </header>

            <main className="cd-container">
                {/* Status & Summary Card */}
                <div className="cd-card" style={{ borderTop: `4px solid ${bc}` }}>
                    <div className="cd-grid-2">
                        <div>
                            <span className="cd-label">{typeLabel} Number</span>
                            <div className="cd-value-lg" style={{ color: bc }}>{doc.docNumber}</div>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                                <div>
                                    <span className="cd-label">Date</span>
                                    <div className="cd-value">{dateStr}</div>
                                </div>
                                {doc.validity && (
                                    <div>
                                        <span className="cd-label">Validity</span>
                                        <div className="cd-value">{doc.validity}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                            <span className="cd-label">Total Amount</span>
                            <div className="cd-value-lg">{currency} {fmt(doc.grandTotal)}</div>
                        </div>
                    </div>
                </div>

                {/* Entity Grid */}
                <div className="cd-grid-2">
                    <div className="cd-card">
                        <span className="cd-label">From (Seller)</span>
                        <div className="cd-value" style={{ fontWeight: 700 }}>{seller.name || businessName}</div>
                        <div className="cd-address">
                            {seller.address || ''}
                            {seller.phone && <div><br/>📞 {seller.phone}</div>}
                            {seller.email && <div>✉️ {seller.email}</div>}
                            {seller.gstin && <div style={{ marginTop: '8px', fontWeight: 600, color: '#000' }}>GSTIN/UIN: {seller.gstin}</div>}
                        </div>
                    </div>
                    
                    <div className="cd-card">
                        <span className="cd-label">To (Buyer)</span>
                        <div className="cd-value" style={{ fontWeight: 700 }}>{buyer.name || '-'}</div>
                        {buyer.company && <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{buyer.company}</div>}
                        <div className="cd-address">
                            {buyer.address || ''}
                            {buyer.phone && <div><br/>📞 {buyer.phone}</div>}
                            {buyer.email && <div>✉️ {buyer.email}</div>}
                            {buyer.gstin && <div style={{ marginTop: '8px', fontWeight: 600, color: '#000' }}>GSTIN/UIN: {buyer.gstin}</div>}
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="cd-card" style={{ padding: '0 24px' }}>
                    <div style={{ padding: '24px 0 8px 0', borderBottom: '2px solid #e2e8f0' }}>
                        <span className="cd-label">Items & Services</span>
                    </div>
                    
                    <div>
                        {items.map((item, idx) => (
                            <div key={idx} className="cd-item-card">
                                <div className="cd-item-header">
                                    <div className="cd-item-title">{item.product || 'Item'}</div>
                                    <div className="cd-item-price">{currency} {fmt(item.totalPrice)}</div>
                                </div>
                                <div className="cd-item-meta">
                                    <span>Qty: {item.qty} {item.unit}</span>
                                    <span>Rate: {currency} {fmt(item.unitPrice)}</span>
                                    {item.taxRate > 0 && <span>Tax: {item.taxRate}%</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pricing Summary */}
                <div className="cd-card" style={{ background: '#f8fafc' }}>
                    <div style={{ marginLeft: 'auto', maxWidth: '300px' }}>
                        <div className="cd-summary-row">
                            <span>Subtotal</span>
                            <span>{currency} {fmt(doc.subtotal)}</span>
                        </div>
                        {doc.discountAmount > 0 && (
                            <div className="cd-summary-row" style={{ color: '#16a34a' }}>
                                <span>Discount</span>
                                <span>- {currency} {fmt(doc.discountAmount)}</span>
                            </div>
                        )}
                        {doc.taxAmount > 0 && (
                            <div className="cd-summary-row">
                                <span>Total Tax</span>
                                <span>{currency} {fmt(doc.taxAmount)}</span>
                            </div>
                        )}
                        {doc.roundOff !== 0 && (
                            <div className="cd-summary-row">
                                <span>Round Off</span>
                                <span>{doc.roundOff > 0 ? '+' : ''}{currency} {fmt(doc.roundOff)}</span>
                            </div>
                        )}
                        
                        <div className="cd-summary-total">
                            <span>Grand Total</span>
                            <span>{currency} {fmt(doc.grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes & Terms */}
                {(doc.notes || (doc.termsList && doc.termsList.length > 0)) && (
                    <div className="cd-card">
                        {doc.notes && (
                            <div style={{ marginBottom: doc.termsList?.length ? '24px' : '0' }}>
                                <span className="cd-label">Notes</span>
                                <div className="cd-address" style={{ whiteSpace: 'pre-wrap' }}>{doc.notes}</div>
                            </div>
                        )}
                        {doc.termsList && doc.termsList.length > 0 && (
                            <div>
                                <span className="cd-label">Terms & Conditions</span>
                                <ol style={{ paddingLeft: '20px', margin: '8px 0 0 0', color: 'var(--text-main)', fontSize: '13px', lineHeight: '1.6' }}>
                                    {doc.termsList.map((t, idx) => (
                                        <li key={idx} style={{ marginBottom: '6px' }}>
                                            {/* termsList entries are {key, value} pairs (e.g. {key:'Payment',
                                                value:'100% Advance'}), matching how the PDF renders the same
                                                data (templateEngine's Commercial Terms table) - not a plain
                                                string, so it can't be rendered directly as a child. */}
                                            {t && typeof t === 'object' ? <><strong>{t.key}</strong>: {t.value}</> : t}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                <p>Powered by <a href="/cloud" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>VelBiz Cloud</a></p>
            </div>
        </div>
    );
}
