'use client';
import { useEffect, useRef } from 'react';
import { renderDocumentHTML } from '@/lib/templateEngine';

export default function CloudDocPDFPreview({ document, onClose }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        if (!iframeRef.current || !document) return;
        const html = renderDocumentHTML(document, { viewUrl: null });
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (doc) { doc.open(); doc.write(html); doc.close(); }
    }, [document]);

    function handlePrint() {
        iframeRef.current?.contentWindow?.focus();
        iframeRef.current?.contentWindow?.print();
    }

    if (!document) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div style={{ width: '100%', maxWidth: '920px', background: 'var(--secondary-color)', borderRadius: '12px 12px 0 0', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '15px' }}>📄 Preview ({document.docType || 'Document'})</span>
                    {document.customer?.name && <span style={{ color: '#94a3b8', fontSize: '13px' }}>→ {document.customer.name}</span>}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handlePrint} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '7px', padding: '8px 18px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                        🖨 Print / Save PDF
                    </button>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: 'none', borderRadius: '7px', padding: '8px 14px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                        ✕ Close
                    </button>
                </div>
            </div>
            <iframe ref={iframeRef} title="Cloud Document Preview" style={{ width: '100%', maxWidth: '920px', height: '80vh', border: 'none', background: '#d0d0d0', borderRadius: '0 0 12px 12px', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }} />
        </div>
    );
}
