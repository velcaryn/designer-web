'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCloudUser } from '@/app/(erp)/cloud/dashboard/layout';
import toast from 'react-hot-toast';
import { SkeletonStatBar, SkeletonKanban } from '@/components/ui/skeleton';
import KpiStrip from '@/components/cloud-app/crm/KpiStrip';
import CrmFilterBar from '@/components/cloud-app/crm/CrmFilterBar';
import LeadCard from '@/components/cloud-app/crm/LeadCard';
import LeadDetailDrawer from '@/components/cloud-app/crm/LeadDetailDrawer';
import { leadHealth, VALUE_BANDS, compactMoney } from '@/components/cloud-app/crm/leadMeta';
import { Plus, Trash2, X } from 'lucide-react';
import { contact } from '@/config/site';

export default function CRMPage() {
    const user = useCloudUser();
    const [leads, setLeads] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editLead, setEditLead] = useState(null);
    const [dragId, setDragId] = useState(null);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    // Filters / sort / view - a text search alone couldn't answer "what needs
    // chasing today", which is the question the board exists to answer.
    const [health, setHealth] = useState('all');
    const [source, setSource] = useState('');
    const [owner, setOwner] = useState('');
    const [band, setBand] = useState('');
    const [stageFilter, setStageFilter] = useState('');
    const [sort, setSort] = useState('newest');
    const [view, setView] = useState('board');
    const [detailLead, setDetailLead] = useState(null);
    const formRef = useRef(null);

    // Pipeline configuration (rename/reorder/recolor/add/remove stages)
    const [showConfig, setShowConfig] = useState(false);
    const [configStages, setConfigStages] = useState([]);
    const [savingConfig, setSavingConfig] = useState(false);
    const [dragStageIndex, setDragStageIndex] = useState(null);
    const [dragOverStageIndex, setDragOverStageIndex] = useState(null);

    const [form, setForm] = useState({
        name: '', company: '', email: '', phone: '',
        expectedRevenue: '', probability: '', expectedCloseDate: '', source: '', notes: '', assignee: '', followUpDate: '',
    });

    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        setRefreshing(true);
        try {
            const [leadsRes, stagesRes] = await Promise.all([
                fetch('/api/cloud/erp/crm/leads').then(r => r.json()),
                fetch('/api/cloud/erp/crm/pipeline').then(r => r.json()),
            ]);
            setLeads(leadsRes.leads || []);
            setStages(stagesRes.stages || []);
        } catch (err) {
            toast.error('Failed to load CRM data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const money = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

    // Health is computed once per lead and reused by the cards, the filters and
    // the KPI strip, so all three agree on what "stale" and "overdue" mean.
    const withHealth = useMemo(
        () => leads.map(l => ({ lead: l, health: leadHealth(l) })),
        [leads],
    );

    const sources = useMemo(
        () => [...new Set(leads.map(l => l.source).filter(Boolean))].sort(),
        [leads],
    );
    const owners = useMemo(
        () => [...new Set(leads.map(l => l.assignee).filter(Boolean))].sort(),
        [leads],
    );

    const filteredLeads = useMemo(() => {
        const q = search.trim().toLowerCase();
        const bandTest = VALUE_BANDS.find(b => b.key === band)?.test;

        const rows = withHealth.filter(({ lead: l, health: h }) => {
            if (q && !(
                l.name.toLowerCase().includes(q) ||
                (l.company || '').toLowerCase().includes(q) ||
                (l.email || '').toLowerCase().includes(q) ||
                (l.leadNumber || '').toLowerCase().includes(q)
            )) return false;
            if (health === 'overdue' && !h.overdue) return false;
            if (health === 'stale' && !h.stale) return false;
            if (health === 'dueSoon' && !h.dueSoon) return false;
            if (health === 'healthy' && (h.overdue || h.stale)) return false;
            if (source && l.source !== source) return false;
            if (owner && l.assignee !== owner) return false;
            if (stageFilter && l.stage !== stageFilter) return false;
            if (bandTest && !bandTest(l.expectedRevenue || 0)) return false;
            return true;
        });

        const dir = {
            valueDesc: (a, b) => (b.lead.expectedRevenue || 0) - (a.lead.expectedRevenue || 0),
            valueAsc: (a, b) => (a.lead.expectedRevenue || 0) - (b.lead.expectedRevenue || 0),
            staleDesc: (a, b) => b.health.idleDays - a.health.idleDays,
            followUp: (a, b) => {
                // Leads with no follow-up date sort last rather than colliding at 0.
                const av = a.health.followUpIn, bv = b.health.followUpIn;
                if (av === null && bv === null) return 0;
                if (av === null) return 1;
                if (bv === null) return -1;
                return av - bv;
            },
            newest: (a, b) => new Date(b.lead.createdAt) - new Date(a.lead.createdAt),
        }[sort] || (() => 0);

        return rows.sort(dir).map(r => r.lead);
    }, [withHealth, search, health, source, owner, stageFilter, band, sort]);

    const kpis = useMemo(() => {
        const open = withHealth.filter(({ lead: l }) => l.stage !== 'won' && l.stage !== 'lost');
        const won = leads.filter(l => l.stage === 'won');
        const lost = leads.filter(l => l.stage === 'lost');
        const decided = won.length + lost.length;
        const pipelineValue = open.reduce((s, { lead: l }) => s + (l.expectedRevenue || 0), 0);
        const wonValue = won.reduce((s, l) => s + (l.expectedRevenue || 0), 0);
        return [
            { key: 'all', label: 'Open Leads', value: String(open.length), hint: 'Leads not yet won or lost' },
            { key: 'pipeline', label: 'Pipeline Value', value: compactMoney(pipelineValue), hint: 'Expected revenue across open leads' },
            { key: 'overdue', label: 'Overdue Follow-ups', value: String(open.filter(({ health: h }) => h.overdue).length), tone: 'critical', hint: 'Follow-up date has passed' },
            { key: 'stale', label: 'Going Cold', value: String(open.filter(({ health: h }) => h.stale).length), tone: 'warning', hint: 'No activity in 14+ days' },
            { key: 'winRate', label: 'Win Rate', value: decided ? `${Math.round((won.length / decided) * 100)}%` : '-', tone: 'good', hint: 'Won ÷ (won + lost)' },
            { key: 'wonValue', label: 'Won Value', value: compactMoney(wonValue), tone: 'good', hint: 'Expected revenue of won leads' },
        ];
    }, [withHealth, leads]);

    function clearFilters() {
        setSearch(''); setHealth('all'); setSource(''); setOwner('');
        setBand(''); setStageFilter(''); setSort('newest');
    }

    async function handleSave(e) {
        e.preventDefault();
        if (!form.name.trim()) return toast.error('Lead name is required.');

        setSaving(true);
        try {
            const url = editLead
                ? `/api/cloud/erp/crm/leads/${editLead._id}`
                : '/api/cloud/erp/crm/leads';
            const method = editLead ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    expectedRevenue: parseFloat(form.expectedRevenue) || 0,
                    probability: parseInt(form.probability) || 0,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(editLead ? 'Lead updated!' : 'Lead created!');
            setShowForm(false);
            setEditLead(null);
            setForm({ name: '', company: '', email: '', phone: '', expectedRevenue: '', probability: '', expectedCloseDate: '', source: '', notes: '', assignee: '', followUpDate: '' });
            await loadData();
        } catch (err) {
            toast.error(err.message || 'Failed to save lead.');
        } finally {
            setSaving(false);
        }
    }

    // ─── Pipeline configuration ─────────────────────────────────────────
    function openConfig() {
        setConfigStages(stages.map(s => ({ ...s })));
        setShowConfig(true);
    }

    function moveStage(index, dir) {
        setConfigStages(prev => {
            const next = [...prev];
            const target = index + dir;
            if (target < 0 || target >= next.length) return prev;
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }

    function reorderStage(fromIndex, toIndex) {
        setConfigStages(prev => {
            if (fromIndex === toIndex || fromIndex == null || toIndex == null) return prev;
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    }

    function handleStageDragStart(index) { setDragStageIndex(index); }
    function handleStageDragOver(e, index) {
        e.preventDefault();
        if (index !== dragOverStageIndex) setDragOverStageIndex(index);
    }
    function handleStageDrop(index) {
        reorderStage(dragStageIndex, index);
        setDragStageIndex(null);
        setDragOverStageIndex(null);
    }
    function handleStageDragEnd() {
        setDragStageIndex(null);
        setDragOverStageIndex(null);
    }

    function renameStage(index, name) {
        setConfigStages(prev => prev.map((s, i) => i === index ? { ...s, name } : s));
    }

    function recolorStage(index, color) {
        setConfigStages(prev => prev.map((s, i) => i === index ? { ...s, color } : s));
    }

    function addStage() {
        setConfigStages(prev => [...prev, { id: `stage_${Date.now()}`, name: 'New Stage', color: '#6b7280' }]);
    }

    function removeStage(index) {
        if (configStages.length <= 2) return toast.error('At least 2 stages are required.');
        setConfigStages(prev => prev.filter((_, i) => i !== index));
    }

    async function saveConfig() {
        if (configStages.some(s => !s.name.trim())) return toast.error('Every stage needs a name.');
        setSavingConfig(true);
        try {
            const res = await fetch('/api/cloud/erp/crm/pipeline', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stages: configStages }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Pipeline updated!');
            setShowConfig(false);
            loadData();
        } catch (err) {
            toast.error(err.message || 'Failed to update pipeline.');
        } finally {
            setSavingConfig(false);
        }
    }

    // Confirmation lives in the detail drawer (type-to-confirm), which is the
    // only route to deletion now - it used to be a bare 🗑 beside ✏️ on every
    // card, one mis-click from destroying a record.
    async function handleDelete(lead) {
        try {
            const res = await fetch(`/api/cloud/erp/crm/leads/${lead._id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            toast.success('Lead deleted');
            setDetailLead(null);
            loadData();
        } catch { toast.error('Failed to delete lead.'); }
    }

    /** Stage change from the detail drawer's dropdown (same endpoint as drag-drop). */
    async function handleStageChange(lead, stageId) {
        if (lead.stage === stageId) return;
        try {
            const res = await fetch(`/api/cloud/erp/crm/leads/${lead._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: stageId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            const stageName = stages.find(s => s.id === stageId)?.name || stageId;
            toast.success(`Moved to ${stageName}`);
            setDetailLead(prev => (prev ? { ...prev, stage: stageId } : prev));
            loadData();
        } catch (err) {
            toast.error(err.message || 'Stage transition failed.');
        }
    }

    function openEdit(lead) {
        setEditLead(lead);
        setForm({
            name: lead.name || '',
            company: lead.company || '',
            email: lead.email || '',
            phone: lead.phone || '',
            expectedRevenue: lead.expectedRevenue || '',
            probability: lead.probability || '',
            expectedCloseDate: lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toISOString().slice(0, 10) : '',
            source: lead.source || '',
            notes: lead.notes || '',
            assignee: lead.assignee || '',
            followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().slice(0, 10) : '',
        });
        setShowForm(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }

    function openCreate() {
        setEditLead(null);
        setForm({ name: '', company: '', email: '', phone: '', expectedRevenue: '', probability: '', expectedCloseDate: '', source: '', notes: '', assignee: '', followUpDate: '' });
        setShowForm(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }

    // ─── Drag & Drop stage transition ─────────────────────────────────────
    function handleDragStart(leadId) { setDragId(leadId); }
    function handleDragOver(e) { e.preventDefault(); }

    async function handleDrop(stageId) {
        if (!dragId) return;
        const lead = leads.find(l => l._id === dragId);
        if (!lead || lead.stage === stageId) { setDragId(null); return; }

        try {
            const res = await fetch(`/api/cloud/erp/crm/leads/${dragId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: stageId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Moved to ${stageId}`);
            loadData();
        } catch (err) {
            toast.error(err.message || 'Stage transition failed.');
        } finally {
            setDragId(null);
        }
    }

    // Pipeline stats now live in the `kpis` memo above, which shares its
    // health definitions with the cards and filters.

    if (loading) {
        return (
            <div>
                <SkeletonStatBar count={3} />
                <SkeletonKanban columns={6} cardsPerCol={3} />
            </div>
        );
    }

    return (
        <div className="erp-crm">
            {/* Header */}
            <div className="erp-crm-header">
                <div>
                    <h1 className="erp-crm-title">CRM Pipeline</h1>
                    <p className="erp-crm-subtitle">Manage leads from first contact to deal closure</p>
                </div>
                <div className="erp-crm-header-actions">
                    <button onClick={openConfig} className="erp-btn-secondary">
                        ⚙️ Configure
                    </button>
                    <button onClick={openCreate} className="erp-btn-primary">
                        <Plus size={14} aria-hidden="true" /> New Lead
                    </button>
                </div>
            </div>

            {/* KPI strip - clicking a health KPI filters the board to it */}
            <KpiStrip
                kpis={kpis}
                activeKey={health}
                onSelect={key => setHealth(h => (h === key ? 'all' : key))}
            />

            {/* Create Form Modal */}
            {showForm && (
                <div className="erp-modal-overlay" onClick={() => { setShowForm(false); setEditLead(null); }}>
                    <div className="erp-modal" onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>{editLead ? '✏️ Edit Lead' : '➕ New Lead / Deal'}</h2>
                            <button className="erp-modal-close" onClick={() => { setShowForm(false); setEditLead(null); }}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="erp-modal-body">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Lead Name *</label>
                                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Apollo Hospitals Q3 Order" required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Client / Company</label>
                                        <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Apollo Hospitals" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Email</label>
                                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@example.com" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Phone</label>
                                        <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder={contact.phonePlaceholder} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Deal Value / Expected Revenue (₹)</label>
                                        <input type="number" value={form.expectedRevenue} onChange={e => setForm(f => ({ ...f, expectedRevenue: e.target.value }))} placeholder="500000" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Probability (%)</label>
                                        <input type="number" min="0" max="100" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} placeholder="50" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Expected Close Date</label>
                                        <input type="date" value={form.expectedCloseDate} onChange={e => setForm(f => ({ ...f, expectedCloseDate: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Source</label>
                                        <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Referral, Website, Event..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Assignee (Email)</label>
                                        <input type="email" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} placeholder={user?.email} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Follow-up Date</label>
                                        <input type="date" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Notes</label>
                                        <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' }}></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="erp-modal-footer">
                                <button type="button" onClick={() => { setShowForm(false); setEditLead(null); }} className="erp-btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="erp-btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
                                    {saving ? '⏳ Saving...' : (editLead ? 'Update Lead' : 'Create Lead')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <CrmFilterBar
                search={search} onSearch={setSearch}
                health={health} onHealth={setHealth}
                source={source} onSource={setSource} sources={sources}
                owner={owner} onOwner={setOwner} owners={owners}
                band={band} onBand={setBand}
                stage={stageFilter} onStage={setStageFilter} stages={stages}
                sort={sort} onSort={setSort}
                view={view} onView={setView}
                refreshing={refreshing}
                resultCount={filteredLeads.length} totalCount={leads.length}
                onClear={clearFilters}
            />

            {/* Board / List Views */}
            {refreshing && (
                <div className="erp-crm-refreshing">
                    <span className="erp-crm-refreshing-spinner" /> Updating…
                </div>
            )}
            
            {view === 'board' ? (
                <div className={`erp-kanban-board ${stages.length > 6 ? 'erp-kanban-board-scroll' : 'erp-kanban-board-fit'}`}>
                    {stages.map(stage => {
                        const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
                        const stageValue = stageLeads.reduce((s, l) => s + (l.expectedRevenue || 0), 0);
                        return (
                            <div
                                key={stage.id}
                                className="erp-kanban-column"
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(stage.id)}
                            >
                                <div className="erp-kanban-col-header" style={{ borderTopColor: stage.color }}>
                                    <span className="erp-kanban-col-name">{stage.name}</span>
                                    <span className="erp-kanban-col-count" style={{ background: `${stage.color}20`, color: stage.color }}>
                                        {stageLeads.length}
                                    </span>
                                </div>
                                {stageValue > 0 && (
                                    <div className="erp-kanban-col-value">{money(stageValue)}</div>
                                )}
                                <div className="erp-kanban-col-cards">
                                    {stageLeads.map(lead => (
                                        <LeadCard
                                            key={lead._id}
                                            lead={lead}
                                            dragging={dragId === lead._id}
                                            onOpen={setDetailLead}
                                            onEdit={openEdit}
                                            onDragStart={() => handleDragStart(lead._id)}
                                        />
                                    ))}
                                    {stageLeads.length === 0 && (
                                        <div className="erp-kanban-empty">
                                            {leads.length && filteredLeads.length === 0
                                                ? 'No leads match the filters'
                                                : 'Drop leads here'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="erp-list-view">
                    <table className="erp-list-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Company</th>
                                <th>Value</th>
                                <th>Stage</th>
                                <th>Follow-up</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => {
                                const stage = stages.find(s => s.id === lead.stage);
                                return (
                                    <tr key={lead._id} onClick={() => setDetailLead(lead)}>
                                        <td style={{ fontWeight: 600, color: 'var(--secondary-color)' }}>{lead.name}</td>
                                        <td>{lead.company || '-'}</td>
                                        <td style={{ fontWeight: 600, color: '#059669' }}>{lead.expectedRevenue ? money(lead.expectedRevenue) : '-'}</td>
                                        <td>
                                            <span style={{ 
                                                background: stage ? `${stage.color}20` : '#f3f4f6', 
                                                color: stage ? stage.color : '#4b5563', 
                                                padding: '4px 10px', 
                                                borderRadius: 20, 
                                                fontSize: '12px', 
                                                fontWeight: 600 
                                            }}>
                                                {stage ? stage.name : lead.stage}
                                            </span>
                                        </td>
                                        <td>{lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '-'}</td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <button onClick={() => openEdit(lead)} className="erp-kanban-card-btn">Edit</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="erp-kanban-empty">No leads found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Removed redundant modal form */}

            {/* Configure Pipeline Modal */}
            {showConfig && (
                <div className="erp-modal-overlay" onClick={() => setShowConfig(false)}>
                    <div className="erp-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
                        <div className="erp-modal-header">
                            <h2>⚙️ Configure Pipeline</h2>
                            <button className="erp-modal-close" onClick={() => setShowConfig(false)}><X size={14} aria-hidden="true" /> </button>
                        </div>
                        <div className="erp-modal-body">
                            <p className="erp-config-hint">
                                Rename stages, reorder them, or add/remove stages to match how your team actually works. Leads can be dragged freely between any two stages on the board - there&apos;s no fixed sequence to follow.
                            </p>
                            <div className="erp-config-stage-list">
                                {configStages.map((s, i) => (
                                    <div
                                        key={s.id}
                                        className={`erp-config-stage-row ${dragStageIndex === i ? 'dragging' : ''} ${dragOverStageIndex === i && dragStageIndex !== i ? 'drag-over' : ''}`}
                                        draggable
                                        onDragStart={() => handleStageDragStart(i)}
                                        onDragOver={e => handleStageDragOver(e, i)}
                                        onDrop={() => handleStageDrop(i)}
                                        onDragEnd={handleStageDragEnd}
                                    >
                                        <span className="erp-config-stage-handle" title="Drag to reorder">⠿</span>
                                        <span className="erp-config-stage-index">{i + 1}</span>
                                        <input type="color" value={s.color} onChange={e => recolorStage(i, e.target.value)} className="erp-config-stage-color" title="Stage color" />
                                        <input
                                            type="text"
                                            value={s.name}
                                            onChange={e => renameStage(i, e.target.value)}
                                            className="erp-config-stage-name"
                                            placeholder="Stage name"
                                        />
                                        <div className="erp-config-stage-order">
                                            <button type="button" onClick={() => moveStage(i, -1)} disabled={i === 0} title="Move earlier">◀</button>
                                            <button type="button" onClick={() => moveStage(i, 1)} disabled={i === configStages.length - 1} title="Move later">▶</button>
                                        </div>
                                        <button type="button" onClick={() => removeStage(i)} className="erp-config-stage-del" title="Remove stage"><Trash2 size={14} aria-hidden="true" /> </button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addStage} className="erp-btn-secondary" style={{ marginTop: 14 }}>+ Add Stage</button>
                        </div>
                        <div className="erp-modal-footer">
                            <button type="button" onClick={() => setShowConfig(false)} className="erp-btn-secondary" disabled={savingConfig}>Cancel</button>
                            <button type="button" onClick={saveConfig} className="erp-btn-primary" disabled={savingConfig}>
                                {savingConfig ? '⏳ Saving…' : 'Save Pipeline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {detailLead && (
                <LeadDetailDrawer
                    key={detailLead._id}
                    lead={leads.find(l => l._id === detailLead._id) || detailLead}
                    stages={stages}
                    onClose={() => setDetailLead(null)}
                    onEdit={lead => { setDetailLead(null); openEdit(lead); }}
                    onDelete={handleDelete}
                    onStageChange={handleStageChange}
                />
            )}

            <style>{`
                .erp-crm { font-family: 'Inter', sans-serif; }

                .erp-crm-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
                    background: var(--bg-white); border: 1px solid var(--border); border-radius: 14px;
                    padding: 18px 22px;
                }
                .erp-crm-title {
                    font-size: clamp(1.3rem, 3vw, 1.6rem); font-weight: 800;
                    color: var(--secondary-color); margin: 0 0 4px;
                }
                .erp-crm-subtitle { color: #6c757d; font-size: 14px; margin: 0; }
                .erp-crm-header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

                .erp-crm-refreshing {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 12.5px; color: var(--primary-color); font-weight: 600;
                    margin-bottom: 10px;
                }
                .erp-crm-refreshing-spinner {
                    width: 13px; height: 13px; border-radius: 50%;
                    border: 2px solid var(--border); border-top-color: var(--primary-color);
                    animation: erp-crm-spin 0.6s linear infinite;
                }
                @keyframes erp-crm-spin { to { transform: rotate(360deg); } }

                .erp-config-hint {
                    font-size: 12.5px; color: var(--text-muted); line-height: 1.55;
                    margin: 0 0 18px; padding-bottom: 14px; border-bottom: 1px solid #f0edf5;
                }
                .erp-config-stage-list { display: flex; flex-direction: column; gap: 10px; }
                .erp-config-stage-row {
                    display: flex; align-items: center; gap: 12px;
                    padding: 10px 12px; border: 1.5px solid var(--border); border-radius: 12px;
                    background: var(--surface-sunken); transition: border-color 0.15s, background 0.15s, opacity 0.15s, box-shadow 0.15s;
                    position: relative;
                }
                .erp-config-stage-row:focus-within { border-color: var(--primary-color); background: var(--surface); }
                .erp-config-stage-row.dragging { opacity: 0.4; }
                .erp-config-stage-row.drag-over {
                    border-top: 3px solid var(--primary-color);
                    box-shadow: 0 -2px 0 0 var(--primary-color);
                }
                .erp-config-stage-handle {
                    flex-shrink: 0; cursor: grab; color: #b9b3d6; font-size: 16px;
                    line-height: 1; user-select: none; padding: 2px 1px;
                }
                .erp-config-stage-handle:active { cursor: grabbing; }
                .erp-config-stage-row.dragging .erp-config-stage-handle { cursor: grabbing; }
                .erp-config-stage-index {
                    flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%;
                    background: var(--bg-light); color: var(--text-muted);
                    font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;
                }
                .erp-config-stage-color {
                    flex-shrink: 0; width: 34px; height: 34px; border: 2px solid white;
                    border-radius: 8px; cursor: pointer; padding: 0;
                    box-shadow: 0 0 0 1.5px #e5e7eb;
                }
                .erp-config-stage-name {
                    flex: 1; min-width: 0; padding: 9px 12px; border: 1.5px solid var(--border); border-radius: 8px;
                    font-size: 13.5px; font-family: inherit; outline: none; background: var(--surface);
                    transition: border-color 0.15s;
                }
                .erp-config-stage-name:focus { border-color: var(--primary-color); }
                .erp-config-stage-order {
                    display: flex; gap: 3px; flex-shrink: 0;
                    background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 2px;
                }
                .erp-config-stage-order button {
                    border: none; background: none; border-radius: 5px;
                    width: 26px; height: 26px; cursor: pointer; font-size: 11px; color: var(--text-muted);
                    transition: background 0.15s, color 0.15s;
                }
                .erp-config-stage-order button:not(:disabled):hover { background: var(--bg-light); color: var(--primary-color); }
                .erp-config-stage-order button:disabled { opacity: 0.3; cursor: not-allowed; }
                .erp-config-stage-del {
                    flex-shrink: 0; width: 32px; height: 32px; border: none; background: none;
                    border-radius: 8px; cursor: pointer; font-size: 14px; color: #cbd5e1;
                    transition: background 0.15s, color 0.15s;
                }
                .erp-config-stage-del:hover { background: var(--status-danger-bg); color: #dc2626; }
                .erp-action-btn {
                    padding: 6px 10px; border: 1px solid var(--border); background: var(--bg-light);
                    border-radius: 6px; cursor: pointer; font-size: 12px; color: var(--text-muted);
                }
                .erp-action-btn-del:hover { background: var(--status-danger-bg); border-color: #fca5a5; color: #991b1b; }

                .erp-btn-primary {
                    background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); color: white;
                    border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600;
                    font-size: 14px; cursor: pointer; font-family: inherit;
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 4px 12px rgba(72,38,131,0.25);
                }
                .erp-btn-primary:hover {
                    background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(72,38,131,0.35);
                }
                .erp-btn-secondary {
                    background: var(--bg-light); color: var(--primary-color); border: 1.5px solid #e2e0ea;
                    padding: 10px 20px; border-radius: 10px; font-weight: 600;
                    font-size: 14px; cursor: pointer; font-family: inherit;
                    transition: all 0.2s;
                }
                .erp-btn-secondary:hover { background: var(--accent-subtle); border-color: var(--primary-color); }

                /* Stats Bar */
                .erp-stats-bar {
                    display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; align-items: center;
                }
                .erp-stat-chip {
                    background: var(--surface); border-radius: 10px; padding: 10px 16px;
                    display: flex; flex-direction: column; gap: 2px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #f0edf5;
                }
                .erp-stat-chip-label { font-size: 11px; color: #6c757d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em; }
                .erp-stat-chip-value { font-size: 18px; font-weight: 800; color: var(--secondary-color); }
                .erp-stat-chip-won { border-left: 3px solid #10b981; }
                .erp-stat-chip-won .erp-stat-chip-value { color: #059669; }

                .erp-search-input {
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 8px 14px;
                    font-size: 13px; font-family: inherit; width: 220px; outline: none;
                    transition: border-color 0.2s;
                }
                .erp-search-input:focus { border-color: var(--primary-color); }

                /* Kanban Board */
                /* padding-right gives the last column (usually "Lost") breathing room
                   instead of ending flush against the viewport edge when the board is
                   wider than the screen and horizontally scrollable. */
                .erp-kanban-board {
                    display: flex; align-items: flex-start; gap: 14px;
                    /* Real headroom above the columns, not 2px - overflow-x:auto (in the
                       scroll variant below) forces the Y axis to compute as 'auto' too
                       per spec, and 2px of padding was enough to shave the pixel or two
                       a rounded top corner needs, reading as a hard-clipped border. */
                    padding: 8px 4px 16px;
                }
                .erp-kanban-column {
                    background: var(--surface-sunken); border-radius: 12px; padding: 0;
                    border: 1px solid var(--border); display: flex; flex-direction: column;
                    overflow: hidden; /* keeps the header's own top-radius from bleeding a square corner */
                }
                /* ≤ 6 stages: divide the available width evenly, no horizontal scroll. */
                .erp-kanban-board-fit {
                    overflow-x: visible; flex-wrap: nowrap;
                }
                .erp-kanban-board-fit .erp-kanban-column {
                    flex: 1 1 0; min-width: 0; max-width: none;
                }
                /* > 6 stages: columns keep a working minimum width and the board scrolls. */
                .erp-kanban-board-scroll {
                    overflow-x: auto; padding-left: 20px; padding-right: 20px;
                    /* Fade only paints while there is more content to that side, so it
                       reads as a scroll affordance rather than permanent decoration. */
                    background:
                        linear-gradient(to right, #f6f5fb 30%, rgba(246,245,251,0)) left / 28px 100% no-repeat,
                        linear-gradient(to left, #f6f5fb 30%, rgba(246,245,251,0)) right / 28px 100% no-repeat,
                        radial-gradient(farthest-side at 0 50%, rgba(15,23,42,0.13), transparent) left / 12px 100% no-repeat,
                        radial-gradient(farthest-side at 100% 50%, rgba(15,23,42,0.13), transparent) right / 12px 100% no-repeat;
                    background-attachment: local, local, scroll, scroll;
                    scrollbar-width: thin;
                }
                .erp-kanban-board-scroll .erp-kanban-column {
                    min-width: 260px; max-width: 300px; flex-shrink: 0;
                }
                .erp-kanban-board-scroll::-webkit-scrollbar { height: 9px; }
                .erp-kanban-board-scroll::-webkit-scrollbar-thumb {
                    background: var(--border-strong); border-radius: 5px;
                }
                .erp-kanban-board-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                .erp-kanban-col-header {
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 12px 14px; border-top: 3px solid transparent;
                    border-radius: 12px 12px 0 0; background: var(--surface);
                    border-bottom: 1px solid #f0edf5;
                }
                .erp-kanban-col-name { font-weight: 700; font-size: 13px; color: var(--secondary-color); }
                .erp-kanban-col-count {
                    font-size: 11px; font-weight: 700; padding: 2px 8px;
                    border-radius: 20px; min-width: 20px; text-align: center;
                }
                .erp-kanban-col-value {
                    font-size: 11px; color: #6c757d; padding: 4px 14px; font-weight: 600;
                    border-bottom: 1px solid #f0edf5;
                }
                .erp-kanban-col-cards {
                    padding: 10px; display: flex; flex-direction: column; gap: 8px;
                    overflow-y: auto; max-height: 55vh; min-height: 90px;
                }

                .erp-kanban-card {
                    background: var(--surface); border-radius: 10px; padding: 12px;
                    border: 1px solid #f0edf5; cursor: grab;
                    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
                }
                .erp-kanban-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(72,38,131,0.12);
                    border-color: #d8d0e8;
                }
                .erp-kanban-card.dragging {
                    opacity: 0.4; transform: rotate(2deg);
                }
                .erp-kanban-card-top {
                    display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;
                }
                .erp-kanban-card-name { font-weight: 700; font-size: 13px; color: var(--secondary-color); }
                .erp-kanban-card-number { font-size: 10px; color: #a78bfa; font-weight: 600; white-space: nowrap; }
                .erp-kanban-card-company { font-size: 12px; color: #6c757d; margin-top: 4px; }
                .erp-kanban-card-revenue {
                    font-size: 14px; font-weight: 800; color: #059669; margin-top: 8px;
                    background: var(--status-success-bg); padding: 4px 8px; border-radius: 6px; display: inline-block;
                }
                .erp-kanban-card-actions {
                    display: flex; gap: 6px; margin-top: 8px; justify-content: flex-end;
                }
                .erp-kanban-card-btn {
                    background: none; border: 1px solid var(--border); padding: 4px 8px;
                    border-radius: 6px; cursor: pointer; font-size: 12px;
                    transition: all 0.15s;
                }
                .erp-kanban-card-btn:hover { background: var(--bg-light); border-color: #d8d0e8; }
                .erp-kanban-card-btn-del:hover { background: var(--status-danger-bg); border-color: #fca5a5; }

                .erp-kanban-empty {
                    text-align: center; color: #c4b5fd; font-size: 12px; padding: 24px 8px;
                    border: 2px dashed var(--border); border-radius: 8px;
                    font-weight: 500;
                }

                /* Modal */
                .erp-modal-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 2000; padding: 20px;
                    backdrop-filter: blur(4px);
                }
                .erp-modal {
                    background: var(--surface); border-radius: 16px; width: 100%; max-width: 620px;
                    max-height: 90vh; overflow-y: auto;
                    box-shadow: 0 20px 60px rgba(45,23,82,0.25);
                    animation: erp-modal-in 0.25s ease;
                }
                @keyframes erp-modal-in {
                    from { opacity: 0; transform: translateY(20px) scale(0.96); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .erp-modal-header {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 20px 24px; border-bottom: 1px solid #f0edf5;
                }
                .erp-modal-header h2 { margin: 0; font-size: 18px; font-weight: 800; color: var(--secondary-color); display: flex; align-items: center; gap: 8px; }
                .erp-modal-close {
                    background: none; border: none; font-size: 18px; cursor: pointer;
                    color: #6c757d; transition: color 0.15s; width: 36px; height: 36px;
                    border-radius: 8px; display: flex; align-items: center; justify-content: center;
                }
                .erp-modal-close:hover { background: var(--bg-light); color: var(--secondary-color); }
                
                .erp-modal-body { padding: 24px; }
                .erp-modal-footer {
                    padding: 16px 24px; border-top: 1px solid #f0edf5;
                    display: flex; justify-content: flex-end; gap: 12px;
                    background: var(--surface-sunken); border-radius: 0 0 16px 16px;
                }

                .erp-lead-form { padding: 24px; }
                .erp-form-grid {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
                }
                .erp-form-field {
                    display: flex; flex-direction: column; gap: 4px; min-width: 0;
                }

                /* List View Styles */
                .erp-list-view {
                    background: var(--surface); border-radius: 12px; border: 1px solid var(--border);
                    overflow-x: auto; box-shadow: var(--shadow-sm);
                }
                .erp-list-table {
                    width: 100%; border-collapse: collapse; text-align: left;
                    font-size: 13.5px;
                }
                .erp-list-table th {
                    padding: 14px 16px; background: var(--surface-sunken); color: var(--text-muted);
                    font-weight: 600; font-size: 12px; text-transform: uppercase;
                    border-bottom: 2px solid var(--border); letter-spacing: 0.02em;
                }
                .erp-list-table td {
                    padding: 14px 16px; border-bottom: 1px solid #f0edf5;
                    cursor: pointer;
                }
                .erp-list-table tbody tr:hover { background: var(--surface-sunken); }
                .erp-list-table tbody tr:last-child td { border-bottom: none; }
                .erp-form-field span {
                    font-size: 12px; font-weight: 600; color: var(--primary-color);
                    text-transform: uppercase; letter-spacing: 0.04em;
                }
                .erp-form-field input,
                .erp-form-field select,
                .erp-form-field textarea {
                    width: 100%; box-sizing: border-box; min-width: 0;
                    border: 1.5px solid #e2e0ea; border-radius: 8px; padding: 10px 12px;
                    font-size: 14px; font-family: inherit; outline: none;
                    transition: border-color 0.2s; background: var(--surface-sunken);
                }
                .erp-form-field input:focus,
                .erp-form-field select:focus,
                .erp-form-field textarea:focus {
                    border-color: var(--primary-color); background: var(--surface);
                }
                .erp-form-actions {
                    display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;
                    padding-top: 16px; border-top: 1px solid #f0edf5;
                }

                @media (max-width: 768px) {
                    .erp-form-grid { grid-template-columns: 1fr; }
                    .erp-kanban-board { gap: 10px; }
                    /* Squeezing even 3-4 columns to fit a phone width isn't readable -
                       below this breakpoint every board scrolls, fit mode or not. */
                    .erp-kanban-board-fit {
                        overflow-x: auto; padding-left: 16px; padding-right: 16px;
                    }
                    .erp-kanban-board-fit .erp-kanban-column { flex: 0 0 auto; min-width: 240px; max-width: 240px; }
                    .erp-kanban-board-scroll .erp-kanban-column { min-width: 240px; }
                    .erp-stats-bar { flex-direction: column; }
                    .erp-search-input { width: 100%; }
                }
            `}</style>
        </div>
    );
}
