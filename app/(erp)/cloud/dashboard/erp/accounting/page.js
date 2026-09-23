'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { SkeletonPage } from '@/components/ui/skeleton';
import { money, TABS } from '@/components/cloud-app/accounting/constants';
import OverviewTab from '@/components/cloud-app/accounting/OverviewTab';
import ChartOfAccountsTab from '@/components/cloud-app/accounting/ChartOfAccountsTab';
import LedgerStatementTab from '@/components/cloud-app/accounting/LedgerStatementTab';
import DaybookTab from '@/components/cloud-app/accounting/DaybookTab';
import VoucherEntryTab from '@/components/cloud-app/accounting/VoucherEntryTab';
import ReportsTab from '@/components/cloud-app/accounting/ReportsTab';
import NewLedgerModal from '@/components/cloud-app/accounting/NewLedgerModal';
import { Plus, Receipt, Scale } from 'lucide-react';



export default function AccountingSuitePage() {
    /*
     * The tab lives in the URL.
     *
     * It was component state, so every view on this page shared one address:
     * you could not link a colleague to the trial balance, a bookmark always
     * landed on Overview, and the browser's back button skipped the whole
     * screen. The nav's Accounting sub-items are deep links, and they only work
     * because the tab is addressable.
     *
     * The URL is the ONLY source of truth. There is deliberately no
     * `activeTab` state mirroring it.
     *
     * There was, and the two fought. Clicking a tab set the state and called
     * router.replace; the effect that synced state back from the URL then ran
     * with the pre-navigation `urlTab` still in hand, decided the state was
     * wrong, and put it back. The tab returned to Overview and the URL never
     * moved. Two mechanisms, each correct alone, each undoing the other.
     *
     * Deriving it removes the race rather than sequencing it, and costs
     * nothing: the first paint is still the right tab, because the value is
     * read during render rather than applied by an effect afterwards.
     */
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlTab = searchParams.get('tab');
    const activeTab = TABS.some(t => t.id === urlTab) ? urlTab : 'overview';

    const setActiveTab = useCallback((key) => {
        // replace, not push - flicking between tabs should not fill the back
        // button with a dozen entries to escape from.
        router.replace(`/cloud/dashboard/erp/accounting?tab=${key}`, { scroll: false });
    }, [router]);
    const [loading, setLoading] = useState(true);

    // ── Data States ───────────────────────────────────────────────────────────
    const [coaGroups, setCoaGroups] = useState([]);
    const [ledgers, setLedgers] = useState([]);
    const [vouchers, setVouchers] = useState([]);

    // ── Search & Filter States ────────────────────────────────────────────────
    const [coaSearch, setCoaSearch] = useState('');
    const [coaPillarFilter, setCoaPillarFilter] = useState('ALL');
    const [expandedGroups, setExpandedGroups] = useState({});

    // ── Khata (Ledger Statement) States ───────────────────────────────────────
    const [selectedLedgerId, setSelectedLedgerId] = useState('');
    const [khataFromDate, setKhataFromDate] = useState('');
    const [khataToDate, setKhataToDate] = useState('');
    const [khataStatement, setKhataStatement] = useState(null);
    const [khataLoading, setKhataLoading] = useState(false);

    // ── Daybook States ────────────────────────────────────────────────────────
    const [daybookDate, setDaybookDate] = useState(new Date().toISOString().slice(0, 10));
    const [daybookTypeFilter, setDaybookTypeFilter] = useState('');
    const [daybookData, setDaybookData] = useState({ vouchers: [], totalAmount: 0, totalCount: 0 });
    const [daybookLoading, setDaybookLoading] = useState(false);

    // ── Financial Reports States ──────────────────────────────────────────────
    const [reportSubTab, setReportSubTab] = useState('trial-balance');
    const [reportFromDate, setReportFromDate] = useState('');
    const [reportToDate, setReportToDate] = useState('');
    const [trialBalanceData, setTrialBalanceData] = useState(null);
    const [plData, setPlData] = useState(null);
    const [bsData, setBsData] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);

    // ── New Ledger Modal ──────────────────────────────────────────────────────
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [ledgerForm, setLedgerForm] = useState({
        name: '',
        groupCode: 'INDIRECT_EXPENSES',
        openingBalance: '',
        openingBalanceType: 'debit',
        description: '',
        gstin: '',
        pan: '',
    });

    // ── Double-Entry Voucher Form ─────────────────────────────────────────────
    const [voucherType, setVoucherType] = useState('payment');
    const [voucherDate, setVoucherDate] = useState(new Date().toISOString().slice(0, 10));
    const [voucherNarration, setVoucherNarration] = useState('');
    const [voucherRef, setVoucherRef] = useState('');
    const [voucherEntries, setVoucherEntries] = useState([
        { ledgerId: '', entryType: 'debit', amount: '', narration: '' },
        { ledgerId: '', entryType: 'credit', amount: '', narration: '' },
    ]);
    const [submittingVoucher, setSubmittingVoucher] = useState(false);

    // ── Load COA ──────────────────────────────────────────────────────────────
    const loadCOA = useCallback(async () => {
        try {
            const res = await fetch('/api/cloud/erp/accounting/accounts');
            const data = await res.json();
            setCoaGroups(data.groups || []);
            setLedgers(data.ledgers || []);
            /*
             * Default the statement to the first ledger, but only if nothing is
             * chosen yet.
             *
             * Read through the setter rather than closing over
             * `selectedLedgerId`, which had to be a dependency and made this
             * callback change identity every time the user picked a ledger.
             * The initial-load effect depends on this callback, so each pick in
             * the statement dropdown re-ran the whole first load - chart of
             * accounts, vouchers, trial balance, P&L and balance sheet, five
             * requests, to answer a question none of them were asked.
             */
            if (data.ledgers && data.ledgers.length > 0) {
                setSelectedLedgerId(prev => prev || data.ledgers[0]._id);
            }
        } catch {
            toast.error('Failed to load Chart of Accounts');
        }
    }, []);

    // ── Load Vouchers ─────────────────────────────────────────────────────────
    const loadVouchers = useCallback(async () => {
        try {
            const res = await fetch('/api/cloud/erp/accounting/vouchers?limit=20');
            const data = await res.json();
            setVouchers(data.vouchers || []);
        } catch { /* non-fatal */ }
    }, []);

    // ── Load Khata Statement ──────────────────────────────────────────────────
    const loadKhataStatement = useCallback(async (lId, fromD, toD) => {
        if (!lId) return;
        setKhataLoading(true);
        try {
            const params = new URLSearchParams({ ledgerId: lId });
            if (fromD) params.set('fromDate', fromD);
            if (toD) params.set('toDate', toD);
            const res = await fetch(`/api/cloud/erp/accounting/reports/ledger-statement?${params}`);
            const data = await res.json();
            if (res.ok) {
                setKhataStatement(data);
            } else {
                toast.error(data.error || 'Failed to load ledger statement');
            }
        } catch {
            toast.error('Failed to load ledger statement');
        } finally {
            setKhataLoading(false);
        }
    }, []);

    // ── Load Daybook ──────────────────────────────────────────────────────────
    const loadDaybook = useCallback(async (dStr, vType) => {
        setDaybookLoading(true);
        try {
            const params = new URLSearchParams({ date: dStr });
            if (vType) params.set('voucherType', vType);
            const res = await fetch(`/api/cloud/erp/accounting/reports/daybook?${params}`);
            const data = await res.json();
            if (res.ok) {
                setDaybookData(data);
            }
        } catch {
            toast.error('Failed to load daybook');
        } finally {
            setDaybookLoading(false);
        }
    }, []);

    // ── Load Financial Reports ────────────────────────────────────────────────
    const loadReports = useCallback(async () => {
        setReportLoading(true);
        try {
            const params = new URLSearchParams();
            if (reportFromDate) params.set('fromDate', reportFromDate);
            if (reportToDate) params.set('toDate', reportToDate);

            const [tbRes, plRes, bsRes] = await Promise.all([
                fetch(`/api/cloud/erp/accounting/reports/trial-balance?${params}`).then(r => r.json()),
                fetch(`/api/cloud/erp/accounting/reports/pl?${params}`).then(r => r.json()),
                fetch(`/api/cloud/erp/accounting/reports/balance-sheet?${params}`).then(r => r.json()),
            ]);

            setTrialBalanceData(tbRes);
            setPlData(plRes);
            setBsData(bsRes);
        } catch {
            toast.error('Failed to load financial reports');
        } finally {
            setReportLoading(false);
        }
    }, [reportFromDate, reportToDate]);

    // Initial load
    useEffect(() => {
        Promise.all([loadCOA(), loadVouchers(), loadReports()]).finally(() => {
            setLoading(false);
        });
    }, [loadCOA, loadVouchers, loadReports]);

    // Trigger Khata on selection change
    useEffect(() => {
        if (selectedLedgerId && activeTab === 'khata') {
            loadKhataStatement(selectedLedgerId, khataFromDate, khataToDate);
        }
    }, [selectedLedgerId, khataFromDate, khataToDate, activeTab, loadKhataStatement]);

    // Trigger Daybook on date or tab change
    useEffect(() => {
        if (activeTab === 'daybook') {
            loadDaybook(daybookDate, daybookTypeFilter);
        }
    }, [daybookDate, daybookTypeFilter, activeTab, loadDaybook]);

    // ── Financial Overview Metrics ────────────────────────────────────────────
    const metrics = useMemo(() => {
        const cashBankLedgers = ledgers.filter(l => ['BANK_ACCOUNTS', 'CASH_IN_HAND'].includes(l.groupCode));
        const cashBankTotal = cashBankLedgers.reduce((s, l) => s + (l.closingBalanceType === 'debit' ? l.closingBalance : -l.closingBalance), 0);

        const debtorLedgers = ledgers.filter(l => l.groupCode === 'SUNDRY_DEBTORS');
        const receivableTotal = debtorLedgers.reduce((s, l) => s + (l.closingBalanceType === 'debit' ? l.closingBalance : 0), 0);

        const creditorLedgers = ledgers.filter(l => l.groupCode === 'SUNDRY_CREDITORS');
        const payableTotal = creditorLedgers.reduce((s, l) => s + (l.closingBalanceType === 'credit' ? l.closingBalance : 0), 0);

        const netProfit = plData?.operatingAccount?.netProfit || 0;

        return {
            cashBankTotal,
            receivableTotal,
            payableTotal,
            netProfit,
        };
    }, [ledgers, plData]);

    // ── Double-Entry Calculations ─────────────────────────────────────────────
    const voucherTotals = useMemo(() => {
        let dr = 0;
        let cr = 0;
        for (const e of voucherEntries) {
            const amt = Number(e.amount) || 0;
            if (e.entryType === 'debit') dr += amt;
            if (e.entryType === 'credit') cr += amt;
        }
        dr = Math.round(dr * 100) / 100;
        cr = Math.round(cr * 100) / 100;
        const diff = Math.round(Math.abs(dr - cr) * 100) / 100;
        const isBalanced = dr > 0 && cr > 0 && diff === 0;
        return { totalDebit: dr, totalCredit: cr, difference: diff, isBalanced };
    }, [voucherEntries]);

    // ── Handle Save Ledger ────────────────────────────────────────────────────
    async function handleCreateLedger(e) {
        e.preventDefault();
        if (!ledgerForm.name.trim()) return toast.error('Ledger name is required.');
        try {
            const res = await fetch('/api/cloud/erp/accounting/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ledgerForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(`Ledger "${data.ledger.name}" created successfully!`);
            setShowLedgerModal(false);
            setLedgerForm({
                name: '',
                groupCode: 'INDIRECT_EXPENSES',
                openingBalance: '',
                openingBalanceType: 'debit',
                description: '',
                gstin: '',
                pan: '',
            });
            loadCOA();
            loadReports();
        } catch (err) {
            toast.error(err.message || 'Failed to create ledger');
        }
    }

    // ── Handle Post Voucher ───────────────────────────────────────────────────
    async function handlePostVoucher(e) {
        e.preventDefault();
        if (!voucherTotals.isBalanced) {
            return toast.error(`Voucher is unbalanced. Difference: ₹${money(voucherTotals.difference)}`);
        }

        for (let i = 0; i < voucherEntries.length; i++) {
            if (!voucherEntries[i].ledgerId) {
                return toast.error(`Please select a ledger for line #${i + 1}`);
            }
            if (!voucherEntries[i].amount || Number(voucherEntries[i].amount) <= 0) {
                return toast.error(`Please enter a valid amount for line #${i + 1}`);
            }
        }

        setSubmittingVoucher(true);
        try {
            const payload = {
                voucherType,
                date: voucherDate,
                narration: voucherNarration,
                referenceNo: voucherRef,
                entries: voucherEntries.map(e => ({
                    ledgerId: e.ledgerId,
                    entryType: e.entryType,
                    amount: Number(e.amount),
                    narration: e.narration,
                })),
            };

            const res = await fetch('/api/cloud/erp/accounting/vouchers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success(`Voucher ${data.voucher.voucherNumber} posted successfully!`);
            // Reset form
            setVoucherNarration('');
            setVoucherRef('');
            setVoucherEntries([
                { ledgerId: '', entryType: 'debit', amount: '', narration: '' },
                { ledgerId: '', entryType: 'credit', amount: '', narration: '' },
            ]);
            loadCOA();
            loadVouchers();
            loadReports();
            setActiveTab('daybook');
        } catch (err) {
            toast.error(err.message || 'Failed to post voucher');
        } finally {
            setSubmittingVoucher(false);
        }
    }

    function addVoucherRow() {
        setVoucherEntries(prev => [
            ...prev,
            { ledgerId: '', entryType: 'credit', amount: '', narration: '' },
        ]);
    }

    function removeVoucherRow(index) {
        if (voucherEntries.length <= 2) {
            return toast.error('A voucher requires at least two rows.');
        }
        setVoucherEntries(prev => prev.filter((_, i) => i !== index));
    }

    function updateVoucherRow(index, field, value) {
        setVoucherEntries(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    }

    function toggleGroupExpand(code) {
        setExpandedGroups(p => ({ ...p, [code]: !p[code] }));
    }

    if (loading) return <SkeletonPage />;

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {/* ── Header & Navigation Bar ────────────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--secondary-color)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Scale size={26} color="var(--primary-color)" aria-hidden="true" />
                        Accounting & General Ledger
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0' }}>
                        Double-entry chart of accounts, vouchers, ledger statements and financial statements.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowLedgerModal(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: 'var(--bg-white)',
                            color: 'var(--text-main)',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                        }}
                    >
                        <Plus size={16} aria-hidden="true" />
                        New Ledger
                    </button>
                    <button
                        onClick={() => setActiveTab('voucher')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '9px 18px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--primary-color)',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(72,38,131,0.25)',
                        }}
                    >
                        <Receipt size={16} aria-hidden="true" />
                        Record Voucher
                    </button>
                </div>
            </div>

            {/* ── Main Tab Navigation ────────────────────────────────────────────── */}
            <div role="tablist" aria-label="Accounting views" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '1.75rem', overflowX: 'auto', paddingBottom: '2px' }}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            role="tab"
                            /*
                             * aria-selected is the accessible state, and it is also
                             * the only stable hook a test has: the selected tab was
                             * previously distinguishable only by an inline colour.
                             * The deep-link check in verify-accounting-tabs.mjs
                             * asserts on this.
                             */
                            aria-selected={isActive}
                            data-tab={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 18px',
                                border: 'none',
                                background: isActive ? 'var(--primary-color)' : 'transparent',
                                color: isActive ? '#fff' : 'var(--text-muted)',
                                fontWeight: isActive ? '600' : '500',
                                fontSize: '0.9rem',
                                borderRadius: '8px 8px 0 0',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Icon size={16} aria-hidden="true" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ── TAB 1: OVERVIEW ────────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
                <OverviewTab
                    metrics={metrics}
                    ledgers={ledgers}
                    vouchers={vouchers}
                    setActiveTab={setActiveTab}
                    setSelectedLedgerId={setSelectedLedgerId}
                />
            )}

            {/* ── TAB 2: CHART OF ACCOUNTS (COA TREE) ────────────────────────────── */}
            {activeTab === 'coa' && (
                <ChartOfAccountsTab
                    coaGroups={coaGroups}
                    coaPillarFilter={coaPillarFilter}
                    coaSearch={coaSearch}
                    expandedGroups={expandedGroups}
                    setActiveTab={setActiveTab}
                    setCoaPillarFilter={setCoaPillarFilter}
                    setCoaSearch={setCoaSearch}
                    setSelectedLedgerId={setSelectedLedgerId}
                    toggleGroupExpand={toggleGroupExpand}
                />
            )}

            {/* ── TAB 3: GENERAL LEDGER STATEMENT (KHATA) ────────────────────────── */}
            {activeTab === 'khata' && (
                <LedgerStatementTab
                    khataFromDate={khataFromDate}
                    khataLoading={khataLoading}
                    khataStatement={khataStatement}
                    khataToDate={khataToDate}
                    ledgers={ledgers}
                    loadKhataStatement={loadKhataStatement}
                    selectedLedgerId={selectedLedgerId}
                    setKhataFromDate={setKhataFromDate}
                    setKhataToDate={setKhataToDate}
                    setSelectedLedgerId={setSelectedLedgerId}
                />
            )}

            {/* ── TAB 4: DAYBOOK ────────────────────────────────────────────────── */}
            {activeTab === 'daybook' && (
                <DaybookTab
                    daybookData={daybookData}
                    daybookDate={daybookDate}
                    daybookLoading={daybookLoading}
                    daybookTypeFilter={daybookTypeFilter}
                    loadDaybook={loadDaybook}
                    setDaybookDate={setDaybookDate}
                    setDaybookTypeFilter={setDaybookTypeFilter}
                />
            )}

            {/* ── TAB 5: VOUCHER ENTRY (DOUBLE ENTRY) ──────────────────────────────── */}
            {activeTab === 'voucher' && (
                <VoucherEntryTab
                    addVoucherRow={addVoucherRow}
                    handlePostVoucher={handlePostVoucher}
                    ledgers={ledgers}
                    removeVoucherRow={removeVoucherRow}
                    setActiveTab={setActiveTab}
                    setVoucherDate={setVoucherDate}
                    setVoucherNarration={setVoucherNarration}
                    setVoucherRef={setVoucherRef}
                    setVoucherType={setVoucherType}
                    submittingVoucher={submittingVoucher}
                    updateVoucherRow={updateVoucherRow}
                    voucherDate={voucherDate}
                    voucherEntries={voucherEntries}
                    voucherNarration={voucherNarration}
                    voucherRef={voucherRef}
                    voucherTotals={voucherTotals}
                    voucherType={voucherType}
                />
            )}

            {/* ── TAB 6: FINANCIAL STATEMENTS ────────────────────────────────────── */}
            {activeTab === 'reports' && (
                <ReportsTab
                    bsData={bsData}
                    loadReports={loadReports}
                    plData={plData}
                    reportFromDate={reportFromDate}
                    reportLoading={reportLoading}
                    reportSubTab={reportSubTab}
                    reportToDate={reportToDate}
                    setReportFromDate={setReportFromDate}
                    setReportSubTab={setReportSubTab}
                    setReportToDate={setReportToDate}
                    trialBalanceData={trialBalanceData}
                />
            )}

            {/* ── MODAL: CREATE CUSTOM LEDGER ────────────────────────────────────── */}
            {showLedgerModal && (
                <NewLedgerModal
                    coaGroups={coaGroups}
                    handleCreateLedger={handleCreateLedger}
                    ledgerForm={ledgerForm}
                    setLedgerForm={setLedgerForm}
                    setShowLedgerModal={setShowLedgerModal}
                />
            )}
        </div>
    );
}
