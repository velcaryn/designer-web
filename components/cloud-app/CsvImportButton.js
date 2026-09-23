'use client';
import { useRef, useState } from 'react';
import { Download, X } from 'lucide-react';

/**
 * Reusable "Import CSV" entry point used across Cloud ERP list pages.
 *
 * Clicking it opens a small dialog offering two actions - upload a file, or
 * download a sample CSV (headers + one example row) - instead of a bare
 * upload button with no indication of what columns/format are expected.
 */
export default function CsvImportButton({ label = '📥 Import CSV', columns, sampleRow, filename = 'sample.csv', onFile, disabled }) {
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef(null);

    function downloadSample() {
        const header = columns.join(',');
        const row = columns.map(c => {
            const v = sampleRow?.[c] ?? '';
            const s = String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(',');
        const csv = `${header}\n${row}\n`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setOpen(false);
    }

    function handleFileChange(e) {
        const file = e.target.files?.[0];
        setOpen(false);
        if (file) onFile(file);
        e.target.value = '';
    }

    return (
        <div style={{ display: 'inline-block', position: 'relative' }}>
            <button type="button" onClick={() => setOpen(true)} className="cd-csv-btn" disabled={disabled}>
                {label}
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} style={{ display: 'none' }} />

            {open && (
                <div className="cd-csv-modal-overlay" onClick={() => setOpen(false)}>
                    <div className="cd-csv-modal" onClick={e => e.stopPropagation()}>
                        <div className="cd-csv-modal-header">
                            <h3>Import from CSV</h3>
                            <button type="button" className="cd-csv-modal-close" onClick={() => setOpen(false)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <p className="cd-csv-modal-hint">
                            New to this? Download the sample file first to see the exact column headers and an example row, fill in your data, then upload it back here.
                        </p>
                        <div className="cd-csv-modal-actions">
                            <button type="button" className="cd-csv-modal-option" onClick={downloadSample}>
                                <span className="cd-csv-modal-option-icon"><Download size={14} aria-hidden="true" /> </span>
                                <span>
                                    <strong>Download sample file</strong>
                                    <small>See the expected headers &amp; an example row</small>
                                </span>
                            </button>
                            <button type="button" className="cd-csv-modal-option" onClick={() => fileInputRef.current?.click()}>
                                <span className="cd-csv-modal-option-icon">📤</span>
                                <span>
                                    <strong>Upload from local</strong>
                                    <small>Choose a .csv file from your device</small>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .cd-csv-btn {
                    padding: 10px 20px; background: var(--bg-light); color: var(--primary-color);
                    border: 1.5px solid var(--border); border-radius: 8px; font-weight: 600; cursor: pointer;
                    font-size: 13px; min-height: 40px; font-family: inherit;
                }
                .cd-csv-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .cd-csv-modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000; padding: 20px; backdrop-filter: blur(4px);
                }
                .cd-csv-modal {
                    background: var(--bg-white); border-radius: 16px; width: 100%; max-width: 420px;
                    padding: 22px; box-shadow: 0 20px 60px rgba(45,23,82,0.25);
                }
                .cd-csv-modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                .cd-csv-modal-header h3 { margin: 0; font-size: 16px; font-weight: 800; color: var(--secondary-color); }
                .cd-csv-modal-close { border: none; background: none; font-size: 16px; cursor: pointer; color: var(--text-muted); }
                .cd-csv-modal-hint { font-size: 12.5px; color: var(--text-muted); margin: 0 0 16px; line-height: 1.5; }
                .cd-csv-modal-actions { display: flex; flex-direction: column; gap: 10px; }
                .cd-csv-modal-option {
                    display: flex; align-items: center; gap: 12px; text-align: left;
                    padding: 14px; border: 1.5px solid var(--border); border-radius: 10px;
                    background: var(--bg-light); cursor: pointer; font-family: inherit;
                    transition: border-color 0.15s, background 0.15s;
                }
                .cd-csv-modal-option:hover { border-color: var(--primary-color); background: var(--bg-white); }
                .cd-csv-modal-option-icon { font-size: 20px; }
                .cd-csv-modal-option strong { display: block; font-size: 13.5px; color: var(--secondary-color); }
                .cd-csv-modal-option small { display: block; font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
            `}</style>
        </div>
    );
}
