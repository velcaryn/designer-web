'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { Rnd } from 'react-rnd';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { renderDocumentHTML, DEFAULT_V2_CONFIG, SECTION_LABELS, HEADER_BOX_LABELS, FIELD_STYLE_REGISTRY, LOGO_POSITIONS, DEFAULT_LOGO_CONFIG } from '@/lib/templateEngine';
import { SkeletonCardGrid } from '@/components/ui/skeleton';
import { Check, Pencil, Trash2, X } from 'lucide-react';

const CANVAS_SCALE = 3; // px per mm, editor-only
const mmToPx = mm => mm * CANVAS_SCALE;
const pxToMm = px => Math.round((px / CANVAS_SCALE) * 10) / 10;
const CANVAS_WIDTH_MM = 186;

function emptyForm() {
    return {
        name: '', appliesTo: 'both', isDefault: false,
        flatCorners: false,
        header: {
            heightMm: DEFAULT_V2_CONFIG.header.heightMm,
            elements: DEFAULT_V2_CONFIG.header.elements.map(e => ({ ...e })),
            logo: { ...DEFAULT_LOGO_CONFIG },
        },
        sections: DEFAULT_V2_CONFIG.sections.map(s => ({ ...s })),
        fieldStyles: {},
    };
}

function SortableSectionRow({ section, onToggle }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.85 : 1,
    };
    return (
        <div ref={setNodeRef} style={{ ...style, display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-white)', border: '1.5px solid var(--border)', borderRadius: '8px', marginBottom: '8px' }}>
            <span {...attributes} {...listeners} style={{ cursor: 'grab', color: '#94a3b8', fontSize: '18px', lineHeight: 1, padding: '2px 4px', userSelect: 'none' }}>⋮⋮</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, fontSize: '13.5px', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>
                <input type="checkbox" checked={section.visible} onChange={() => onToggle(section.id)} style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)', cursor: 'pointer' }} />
                {SECTION_LABELS[section.id] || section.id}
            </label>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: section.visible ? '#f0fdf4' : 'var(--surface-sunken)', color: section.visible ? '#166534' : 'var(--text-secondary)', fontWeight: 600 }}>
                {section.visible ? 'Visible' : 'Hidden'}
            </span>
        </div>
    );
}

function FieldStyleRow({ meta, value, onChange }) {
    const v = { ...meta.defaults, ...value };
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ flex: 1, fontSize: '12.5px', color: 'var(--text-main)', fontWeight: 500 }}>{meta.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Size:</span>
                <input
                    type="number" onFocus={(e) => e.target.select()} min={6} max={48} step={0.5} value={v.fontSize}
                    onChange={e => onChange({ ...v, fontSize: parseFloat(e.target.value) || v.fontSize })}
                    style={{ width: '56px', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                />
            </div>
            <div style={{ display: 'flex', gap: '3px' }}>
                {['left', 'center', 'right'].map(a => (
                    <button
                        key={a} type="button" onClick={() => onChange({ ...v, align: a })}
                        style={{
                            padding: '4px 8px', fontSize: '11px', border: '1.5px solid',
                            borderColor: v.align === a ? 'var(--primary-color)' : '#e2e8f0',
                            borderRadius: '5px', background: v.align === a ? 'var(--primary-color)' : 'var(--surface)',
                            color: v.align === a ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600,
                        }}
                    >
                        {a === 'left' ? 'L' : a === 'center' ? 'C' : 'R'}
                    </button>
                ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, marginLeft: '4px' }}>
                <input type="checkbox" checked={!!v.bold} onChange={e => onChange({ ...v, bold: e.target.checked })} style={{ accentColor: 'var(--primary-color)' }} /> Bold
            </label>
        </div>
    );
}

export default function CloudTemplatesPage() {
    const [templates, setTemplates] = useState([]);
    const [platformDefault, setPlatformDefault] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm());
    const [previewDoc, setPreviewDoc] = useState(null);
    const [previewModalConfig, setPreviewModalConfig] = useState(null);
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'sections' | 'typography'

    useEffect(() => { setIsMounted(true); }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function loadTemplates() {
        fetch('/api/cloud/templates').then(r => r.json()).then(d => {
            setTemplates(d.templates || []);
            setPlatformDefault(d.platformDefault || null);
            setLoading(false);
        }).catch(() => setLoading(false));
    }

    function loadPreviewDoc() {
        fetch('/api/cloud/documents').then(r => r.json()).then(d => {
            const docs = d.documents || [];
            setPreviewDoc(docs.find(x => x.version === 'v2') || docs[0] || null);
        }).catch(() => setPreviewDoc(null));
    }

    useEffect(() => {
        loadTemplates();
        loadPreviewDoc();
    }, []);

    function resetForm() {
        setForm(emptyForm());
        setEditId(null);
        setShowForm(false);
    }

    function startCreate() {
        const initialForm = emptyForm();
        initialForm.name = `Custom Template ${templates.length + 1}`;
        setForm(initialForm);
        setEditId(null);
        setShowForm(true);
        setTimeout(() => {
            document.getElementById('template-editor-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    function startEdit(template) {
        const cfg = template.config || {};
        setForm({
            name: template.name || '',
            appliesTo: template.appliesTo || 'both',
            isDefault: !!template.isDefault,
            flatCorners: cfg.flatCorners === true,
            header: {
                heightMm: cfg.header?.heightMm || DEFAULT_V2_CONFIG.header.heightMm,
                elements: (cfg.header?.elements?.length ? cfg.header.elements : DEFAULT_V2_CONFIG.header.elements).map(e => ({ ...e })),
                logo: { ...DEFAULT_LOGO_CONFIG, ...(cfg.header?.logo || {}) },
            },
            sections: (cfg.sections?.length ? [...cfg.sections] : DEFAULT_V2_CONFIG.sections)
                .slice()
                .sort((a, b) => a.order - b.order)
                .map(s => ({ id: s.id, visible: s.visible !== false })),
            fieldStyles: { ...(cfg.fieldStyles || {}) },
        });
        setEditId(template._id);
        setShowForm(true);
    }

    function handleDuplicate(template) {
        const cfg = template.config || {};
        setForm({
            name: `${template.name} (Copy)`,
            appliesTo: template.appliesTo || 'both',
            isDefault: false,
            flatCorners: cfg.flatCorners === true,
            header: {
                heightMm: cfg.header?.heightMm || DEFAULT_V2_CONFIG.header.heightMm,
                elements: (cfg.header?.elements?.length ? cfg.header.elements : DEFAULT_V2_CONFIG.header.elements).map(e => ({ ...e })),
                logo: { ...DEFAULT_LOGO_CONFIG, ...(cfg.header?.logo || {}) },
            },
            sections: (cfg.sections?.length ? [...cfg.sections] : DEFAULT_V2_CONFIG.sections)
                .slice()
                .sort((a, b) => a.order - b.order)
                .map(s => ({ id: s.id, visible: s.visible !== false })),
            fieldStyles: { ...(cfg.fieldStyles || {}) },
        });
        setEditId(null);
        setShowForm(true);
        toast.success(`Cloned template config into editor!`);
    }

    async function handleSetDefault(template) {
        try {
            const res = await fetch(`/api/cloud/templates/${template._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: true }),
            });
            if (!res.ok) { toast.error('Failed to set default template.'); return; }
            toast.success(`"${template.name}" is now your default template!`);
            loadTemplates();
        } catch {
            toast.error('Network error.');
        }
    }

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setForm(prev => {
            const oldIndex = prev.sections.findIndex(s => s.id === active.id);
            const newIndex = prev.sections.findIndex(s => s.id === over.id);
            return { ...prev, sections: arrayMove(prev.sections, oldIndex, newIndex) };
        });
    }

    function toggleSection(id) {
        setForm(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s),
        }));
    }

    function updateElement(id, patch) {
        setForm(prev => ({
            ...prev,
            header: {
                ...prev.header,
                elements: prev.header.elements.map(e => e.id === id ? { ...e, ...patch } : e),
            },
        }));
    }

    function toggleElementVisible(id) {
        setForm(prev => ({
            ...prev,
            header: {
                ...prev.header,
                elements: prev.header.elements.map(e => e.id === id ? { ...e, visible: !e.visible } : e),
            },
        }));
    }

    function updateFieldStyle(key, value) {
        setForm(prev => ({ ...prev, fieldStyles: { ...prev.fieldStyles, [key]: value } }));
    }

    function updateLogo(patch) {
        setForm(prev => ({ ...prev, header: { ...prev.header, logo: { ...prev.header.logo, ...patch } } }));
    }

    function buildConfigPayload() {
        return {
            flatCorners: form.flatCorners,
            header: { heightMm: form.header.heightMm, elements: form.header.elements, logo: form.header.logo },
            sections: form.sections.map((s, i) => ({ id: s.id, visible: s.visible, order: (i + 1) * 10 })),
            fieldStyles: form.fieldStyles,
        };
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name.trim()) { toast.error('Template name is required.'); return; }
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                appliesTo: form.appliesTo,
                isDefault: form.isDefault,
                config: buildConfigPayload(),
            };
            const url = editId ? `/api/cloud/templates/${editId}` : '/api/cloud/templates';
            const method = editId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) { const d = await res.json(); toast.error(d.error || 'Save failed.'); return; }
            toast.success(editId ? 'Template updated!' : 'Template created!');
            resetForm();
            loadTemplates();
        } catch {
            toast.error('Network error.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this template? Documents already created with it keep their saved layout.')) return;
        try {
            const res = await fetch(`/api/cloud/templates/${id}`, { method: 'DELETE' });
            if (!res.ok) { toast.error('Delete failed.'); return; }
            toast.success('Template deleted.');
            loadTemplates();
        } catch {
            toast.error('Network error.');
        }
    }

    const previewHTML = previewDoc
        ? renderDocumentHTML(previewDoc, { viewUrl: null, templateConfig: buildConfigPayload() })
        : null;

    const modalPreviewHTML = (previewModalConfig && previewDoc)
        ? renderDocumentHTML(previewDoc, { viewUrl: null, templateConfig: previewModalConfig.config })
        : null;

    const fieldGroups = {};
    Object.entries(FIELD_STYLE_REGISTRY).forEach(([key, meta]) => {
        if (!fieldGroups[meta.group]) fieldGroups[meta.group] = [];
        fieldGroups[meta.group].push({ key, meta });
    });

    if (loading) return <SkeletonCardGrid count={6} />;

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Link href="/cloud/dashboard" style={{ textDecoration: 'none', color: 'var(--primary-color)', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-light)' }}>
                            🏠 Dashboard
                        </Link>
                        <span style={{ color: '#cbd5e1' }}>/</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Templates</span>
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>🧩 Invoice & Quote Templates</h1>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Design custom layout templates for your invoices and quotations.</p>
                </div>
                <button onClick={startCreate} style={btnPrimary}>+ New Template</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: showForm ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr', gap: '24px', alignItems: 'start' }}>
                <div>
                    {/* Template List */}
                    <div style={{ background: 'var(--bg-white)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: '24px' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                                <thead>
                                    <tr style={{ background: 'var(--surface-sunken)' }}>
                                        <th style={thStyle}>Template Name</th>
                                        <th style={thStyle}>Applies To</th>
                                        <th style={thStyle}>Default Status</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={tdStyle}>
                                            <strong style={{ color: 'var(--secondary-color)', fontWeight: 700 }}>{platformDefault?.name || 'VelBiz Default'}</strong>
                                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Standard platform document layout</div>
                                        </td>
                                        <td style={tdStyle}><span style={pillStyle}>Both</span></td>
                                        <td style={tdStyle}>
                                            {templates.some(t => t.isDefault) ? (
                                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>-</span>
                                            ) : (
                                                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', background: 'var(--accent-subtle)', color: '#6d28d9', fontWeight: 700 }}>
                                                    <Check size={14} aria-hidden="true" /> Active Default
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                            <button onClick={() => setPreviewModalConfig({ name: 'VelBiz Default', config: DEFAULT_V2_CONFIG })} style={btnSmall}>
                                                👁️ Preview
                                            </button>
                                        </td>
                                    </tr>
                                    {templates.length === 0 && (
                                        <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No custom templates yet - create one to customize box placements and typography.</td></tr>
                                    )}
                                    {templates.map(t => (
                                        <tr key={t._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={tdStyle}>
                                                <strong style={{ color: '#0f172a', fontWeight: 700 }}>{t.name}</strong>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={pillStyle}>{t.appliesTo === 'both' ? 'Both' : t.appliesTo}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                {t.isDefault ? (
                                                    <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '12px', background: 'var(--status-success-bg)', color: '#15803d', fontWeight: 700 }}>
                                                        <Check size={14} aria-hidden="true" /> Default
                                                    </span>
                                                ) : (
                                                    <button onClick={() => handleSetDefault(t)} style={{ ...btnSmall, background: 'var(--bg-white)', border: '1px solid #cbd5e1' }}>
                                                        Set Default
                                                    </button>
                                                )}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => setPreviewModalConfig(t)} style={btnSmall}>👁️ Preview</button>
                                                    <button onClick={() => startEdit(t)} style={btnSmall}><Pencil size={14} aria-hidden="true" /> Edit</button>
                                                    <button onClick={() => handleDuplicate(t)} style={btnSmall}>📋 Clone</button>
                                                    <button onClick={() => handleDelete(t._id)} style={{ ...btnSmall, background: 'var(--status-danger-bg)', color: '#991b1b', border: '1px solid #fca5a5' }}><Trash2 size={14} aria-hidden="true" /> </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Editor Form */}
                    {showForm && (
                        <div id="template-editor-form" style={{ background: 'var(--bg-white)', borderRadius: '12px', border: '1.5px solid var(--border)', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--secondary-color)', margin: 0 }}>
                                    {editId ? '✏️ Edit Template' : '✨ New Template'}
                                </h3>
                                <button type="button" onClick={resetForm} style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} aria-hidden="true" /> </button>
                            </div>

                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Template Name *</label>
                                        <input style={inputStyle} placeholder="e.g. Modern Executive Layout" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Applies To</label>
                                        <select style={inputStyle} value={form.appliesTo} onChange={e => setForm(p => ({ ...p, appliesTo: e.target.value }))}>
                                            <option value="both">Invoices & Quotes</option>
                                            <option value="Invoice">Invoices only</option>
                                            <option value="Quote">Quotes only</option>
                                        </select>
                                    </div>
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#0f172a', cursor: 'pointer', background: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <input type="checkbox" checked={form.flatCorners} onChange={e => setForm(p => ({ ...p, flatCorners: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
                                    <span><strong>Flat Corners:</strong> Turn off rounded borders for a sharp architectural aesthetic</span>
                                </label>

                                {/* Editor Navigation Tabs */}
                                <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border)', paddingBottom: '2px' }}>
                                    {[
                                        { id: 'canvas', label: '1. Header Canvas Layout' },
                                        { id: 'sections', label: '2. Body Sections Order' },
                                        { id: 'typography', label: '3. Field Typography Styles' },
                                    ].map(tab => (
                                        <button
                                            key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                                            style={{
                                                padding: '8px 14px', fontSize: '13px', fontWeight: 700, border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--primary-color)' : '3px solid transparent',
                                                color: activeTab === tab.id ? 'var(--primary-color)' : 'var(--text-secondary)', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* TAB 1: Header Canvas */}
                                {activeTab === 'canvas' && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={labelStyle}>Header Canvas - Drag boxes to move, drag corner handles to resize</label>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Width: 186mm (Standard A4 width)</div>
                                        </div>

                                        {/* Overflow container so canvas scale never clips on narrow screens */}
                                        <div style={{ width: '100%', overflowX: 'auto', background: 'var(--surface-sunken)', border: '1.5px dashed #cbd5e1', borderRadius: '8px', padding: '12px', boxSizing: 'border-box' }}>
                                            <div style={{ position: 'relative', width: `${mmToPx(CANVAS_WIDTH_MM)}px`, height: `${mmToPx(form.header.heightMm)}px`, background: 'var(--bg-white)', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                                                {isMounted && form.header.elements.map(el => (
                                                    <Rnd
                                                        key={el.id}
                                                        bounds="parent"
                                                        size={{ width: mmToPx(el.w), height: mmToPx(el.h) }}
                                                        position={{ x: mmToPx(el.x), y: mmToPx(el.y) }}
                                                        onDragStop={(e, d) => updateElement(el.id, { x: pxToMm(d.x), y: pxToMm(d.y) })}
                                                        onResizeStop={(e, dir, ref, delta, pos) => updateElement(el.id, {
                                                            w: pxToMm(ref.offsetWidth), h: pxToMm(ref.offsetHeight),
                                                            x: pxToMm(pos.x), y: pxToMm(pos.y),
                                                        })}
                                                        style={{
                                                            border: '1.5px solid var(--primary-color)',
                                                            background: 'rgba(72,38,131,0.08)',
                                                            opacity: el.visible ? 1 : 0.35,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            borderRadius: '4px',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--primary-color)', textAlign: 'center', padding: '2px', userSelect: 'none' }}>
                                                            {HEADER_BOX_LABELS[el.boxType] || el.boxType}
                                                            {el.boxType === 'sellerBox' && form.header.logo.position !== 'hidden' ? ' 🖼️' : ''}
                                                        </span>
                                                    </Rnd>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {form.header.elements.map(el => (
                                                <label key={el.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-main)', border: '1.5px solid var(--border)', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', background: el.visible ? 'var(--bg-light)' : 'var(--surface)', fontWeight: 600 }}>
                                                    <input type="checkbox" checked={el.visible} onChange={() => toggleElementVisible(el.id)} style={{ accentColor: 'var(--primary-color)' }} />
                                                    {HEADER_BOX_LABELS[el.boxType] || el.boxType}
                                                </label>
                                            ))}
                                        </div>

                                        {/* Logo Settings - bound to the seller box so it can never overlap the seller text */}
                                        <div style={{ marginTop: '16px', background: 'var(--surface-sunken)', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                                🖼️ Logo (bound to Seller / Consigner box)
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'start' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                                        Position within Seller Box
                                                    </label>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                        {LOGO_POSITIONS.map(pos => {
                                                            const isActive = form.header.logo.position === pos;
                                                            return (
                                                                <button
                                                                    key={pos} type="button"
                                                                    onClick={() => updateLogo({ position: pos })}
                                                                    style={{
                                                                        padding: '6px 12px', fontSize: '11.5px', fontWeight: 700, textTransform: 'capitalize',
                                                                        border: '1.5px solid', borderColor: isActive ? 'var(--primary-color)' : '#cbd5e1',
                                                                        borderRadius: '6px', background: isActive ? 'var(--primary-color)' : 'var(--surface)',
                                                                        color: isActive ? '#fff' : 'var(--text-primary)', cursor: 'pointer',
                                                                        transition: 'all 0.2s',
                                                                    }}
                                                                >
                                                                    {pos === 'hidden' ? 'Hidden' : pos}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                                        The seller&rsquo;s text always reflows to fill the space the logo isn&rsquo;t using &mdash; they can&rsquo;t overlap.
                                                    </div>
                                                </div>

                                                <div>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                                        Logo Size (Width × Height mm)
                                                    </label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>W:</span>
                                                            <input
                                                                type="number" onFocus={(e) => e.target.select()} min={10} max={60} step={1} value={form.header.logo.widthMm}
                                                                onChange={e => updateLogo({ widthMm: Math.max(10, Math.min(60, parseFloat(e.target.value) || 20)) })}
                                                                style={{ width: '56px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                                                            />
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>mm</span>
                                                        </div>
                                                        <span style={{ color: '#94a3b8', fontWeight: 700 }}><X size={14} aria-hidden="true" /> </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>H:</span>
                                                            <input
                                                                type="number" onFocus={(e) => e.target.select()} min={10} max={60} step={1} value={form.header.logo.heightMm}
                                                                onChange={e => updateLogo({ heightMm: Math.max(10, Math.min(60, parseFloat(e.target.value) || 20)) })}
                                                                style={{ width: '56px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
                                                            />
                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>mm</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: Body Sections */}
                                {activeTab === 'sections' && (
                                    <div>
                                        <label style={labelStyle}>Body Sections Order (Drag handle ⋮⋮ to reorder, uncheck to hide)</label>
                                        {isMounted && (
                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                                <SortableContext items={form.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                                    {form.sections.map(s => (
                                                        <SortableSectionRow key={s.id} section={s} onToggle={toggleSection} />
                                                    ))}
                                                </SortableContext>
                                            </DndContext>
                                        )}
                                    </div>
                                )}

                                {/* TAB 3: Field Styles */}
                                {activeTab === 'typography' && (
                                    <div>
                                        <label style={labelStyle}>Typography & Alignment Per Field</label>
                                        {Object.entries(fieldGroups).map(([group, fields]) => (
                                            <div key={group} style={{ marginBottom: '16px', border: '1.5px solid var(--border)', borderRadius: '10px', padding: '12px 16px', background: 'var(--bg-white)' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{group}</div>
                                                {fields.map(({ key, meta }) => (
                                                    <FieldStyleRow
                                                        key={key}
                                                        meta={meta}
                                                        value={form.fieldStyles[key]}
                                                        onChange={v => updateFieldStyle(key, v)}
                                                    />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#0f172a', cursor: 'pointer', marginTop: '6px' }}>
                                    <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }} />
                                    <span>Make this my primary default template for new documents</span>
                                </label>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button type="submit" style={btnPrimary} disabled={saving}>{saving ? 'Saving…' : (editId ? 'Update Template' : 'Create Template')}</button>
                                    <button type="button" onClick={resetForm} style={btnSecondary}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Live Preview Column */}
                {showForm && (
                    <div style={{ position: 'sticky', top: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={labelStyle}>Live Document Preview</label>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Updates live as you edit</span>
                        </div>
                        {previewDoc ? (
                            <div style={{ border: '1.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-white)', boxShadow: 'var(--shadow-md)' }}>
                                <div style={{ background: 'var(--surface-sunken)', padding: '8px 14px', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--primary-color)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Showing sample document: <strong>{previewDoc.docNumber || 'Draft'}</strong></span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{previewDoc.docType}</span>
                                </div>
                                <iframe
                                    key={JSON.stringify(buildConfigPayload())}
                                    title="Template preview"
                                    srcDoc={previewHTML}
                                    style={{ width: '100%', height: '80vh', border: 'none', background: 'var(--bg-white)' }}
                                />
                            </div>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: 'var(--bg-white)', border: '1.5px dashed #cbd5e1', borderRadius: '12px' }}>
                                Create at least one document to render a live preview.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Preview Modal for template table items */}
            {previewModalConfig && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-white)', borderRadius: '14px', width: '100%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ padding: '14px 20px', background: 'var(--secondary-color)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '16px' }}>Template Preview - {previewModalConfig.name}</strong>
                            <button onClick={() => setPreviewModalConfig(null)} style={{ border: 'none', background: 'transparent', color: '#fff', fontSize: '20px', cursor: 'pointer' }}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div style={{ flex: 1, padding: '10px' }}>
                            {modalPreviewHTML ? (
                                <iframe title="Template Modal Preview" srcDoc={modalPreviewHTML} style={{ width: '100%', height: '100%', border: 'none' }} />
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading preview document…</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const thStyle = { padding: '12px 16px', textAlign: 'left', fontWeight: 800, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--secondary-color)', borderBottom: '2px solid var(--border)' };
const tdStyle = { padding: '14px 16px', color: 'var(--text-main)' };
const pillStyle = { fontSize: '12px', padding: '3px 10px', borderRadius: '12px', background: 'var(--bg-light)', color: 'var(--primary-color)', fontWeight: 600 };
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: 'var(--bg-white)', boxSizing: 'border-box' };
const btnPrimary = { padding: '10px 20px', background: 'var(--primary-color)', color: 'var(--text-on-accent)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '13px', minHeight: '40px', fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 20px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px', minHeight: '40px', fontFamily: 'inherit' };
const btnSmall = { padding: '6px 12px', background: 'var(--bg-light)', color: 'var(--primary-color)', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, minHeight: '32px', fontFamily: 'inherit' };
