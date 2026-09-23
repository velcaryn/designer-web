'use client';

/**
 * Static showcase panels for VelBiz Cloud.
 *
 * All data is fabricated for illustration. Business names and transaction
 * details are sample data to demonstrate ERP, CRM, and financial workflows.
 */

function Table({ head, rows }) {
    return (
        <div className="vcx-table-wrap">
            <table className="vcx-table">
                <thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Pill({ tone, children }) {
    return <span className={`vcx-pill vcx-pill--${tone}`}>{children}</span>;
}

function Stats({ items }) {
    return (
        <div className="vcx-stats">
            {items.map(s => (
                <div key={s.label} className="vcx-stat">
                    <span className="vcx-stat-num">{s.value}</span>
                    <span className="vcx-stat-label">{s.label}</span>
                </div>
            ))}
        </div>
    );
}

export const CLOUD_STATIC_PANELS = {
    invoicing: () => (
        <>
            <Stats items={[
                { value: 'Rs 14.8L', label: 'Billed this month' },
                { value: '98.4%', label: 'Collection rate' },
                { value: '18', label: 'Invoices cleared' },
            ]} />
            <Table
                head={['Invoice No', 'Client', 'Taxable (Rs)', 'Status']}
                rows={[
                    ['INV-2026-084', 'Apex Technologies', '1,45,000', <Pill key="a" tone="good">Paid</Pill>],
                    ['INV-2026-085', 'Zenith Pharma Ltd', '3,20,000', <Pill key="b" tone="warn">Due in 3d</Pill>],
                    ['INV-2026-086', 'Kaveri Healthcare', '85,000', <Pill key="c" tone="good">Paid</Pill>],
                    ['INV-2026-087', 'Nexus Logistics', '2,10,000', <Pill key="d" tone="info">Sent</Pill>],
                ]}
            />
        </>
    ),

    accounting: () => (
        <>
            <Stats items={[
                { value: 'Rs 42.5L', label: 'Gross revenue' },
                { value: 'Rs 11.2L', label: 'Operating expenses' },
                { value: 'Rs 31.3L', label: 'Net P&L' },
            ]} />
            <Table
                head={['Voucher', 'Particulars', 'Debit (Rs)', 'Credit (Rs)']}
                rows={[
                    ['JV-0491', 'HDFC Bank - Client Wire', '3,20,000', '-'],
                    ['JV-0492', 'Sundry Creditors: Supply Co', '-', '1,15,000'],
                    ['JV-0493', 'Office Operations & Cloud Inf', '-', '42,500'],
                    ['JV-0494', 'Accounts Receivable: Apex', '1,45,000', '-'],
                ]}
            />
        </>
    ),

    crm: () => (
        <>
            <Stats items={[
                { value: '24', label: 'Active deals' },
                { value: 'Rs 68L', label: 'Pipeline value' },
                { value: '42%', label: 'Win rate' },
            ]} />
            <Table
                head={['Opportunity', 'Company', 'Stage', 'Value']}
                rows={[
                    ['Enterprise Cloud Rollout', 'Sun Pharma Group', <Pill key="a" tone="active">Negotiation</Pill>, 'Rs 18.5L'],
                    ['Supply Chain Integration', 'MedSource India', <Pill key="b" tone="info">Proposal Sent</Pill>, 'Rs 12.0L'],
                    ['Multi-Branch Upgrade', 'Apollo Care Hub', <Pill key="c" tone="good">Won</Pill>, 'Rs 24.0L'],
                    ['Annual Maintenance SLA', 'Apex Lifesciences', <Pill key="d" tone="warn">Qualified</Pill>, 'Rs 6.5L'],
                ]}
            />
        </>
    ),

    inventory: () => (
        <>
            <Stats items={[
                { value: '1,420', label: 'Total SKUs' },
                { value: '3', label: 'Warehouses' },
                { value: '12', label: 'Reorder alerts' },
            ]} />
            <Table
                head={['Item Code', 'Product Name', 'Location', 'Available Qty']}
                rows={[
                    ['SKU-MED-091', 'Digital Infusion Pump Gen-3', 'Central Hub (CHN)', <Pill key="a" tone="good">142 Units</Pill>],
                    ['SKU-SUR-044', 'Precision Titanium Scalpel Set', 'South Depo (BLR)', <Pill key="b" tone="good">850 Units</Pill>],
                    ['SKU-MON-102', 'Bedside Multi-Para Monitor', 'West Unit (MUM)', <Pill key="c" tone="warn">4 Units (Low)</Pill>],
                    ['SKU-PPE-511', 'Sterile Surgical Gloves (L)', 'Central Hub (CHN)', <Pill key="d" tone="good">2,400 Boxes</Pill>],
                ]}
            />
        </>
    ),

    hr: () => (
        <>
            <Stats items={[
                { value: '96.8%', label: 'Today attendance' },
                { value: '48', label: 'Team members' },
                { value: 'Rs 18.4L', label: 'Monthly payroll' },
            ]} />
            <Table
                head={['Employee', 'Department', 'Check-in', 'Status']}
                rows={[
                    ['Aravind Swaminathan', 'Engineering', '09:12 AM', <Pill key="a" tone="good">On Time</Pill>],
                    ['Priya Venkataraman', 'Operations', '09:04 AM', <Pill key="b" tone="good">On Time</Pill>],
                    ['Karthik Sundaram', 'Finance & Tax', '09:28 AM', <Pill key="c" tone="active">Present</Pill>],
                    ['Meenakshi Iyer', 'Client Success', '-', <Pill key="d" tone="info">Approved Leave</Pill>],
                ]}
            />
        </>
    ),

    analytics: () => (
        <>
            <Stats items={[
                { value: '+28.4%', label: 'YoY Growth' },
                { value: 'Rs 1.82 Cr', label: 'Annual run rate' },
                { value: '64.2%', label: 'Gross margin' },
            ]} />
            <Table
                head={['Revenue Stream', 'Q1 Actual', 'Q2 Projected', 'Growth']}
                rows={[
                    ['Cloud Platform Subscriptions', 'Rs 42,50,000', 'Rs 55,000,000', <Pill key="a" tone="good">+29.4%</Pill>],
                    ['Custom Enterprise Deployments', 'Rs 28,00,000', 'Rs 34,50,000', <Pill key="b" tone="good">+23.2%</Pill>],
                    ['Annual Maintenance & SLAs', 'Rs 14,20,000', 'Rs 16,80,000', <Pill key="c" tone="good">+18.3%</Pill>],
                    ['Integration & API Services', 'Rs 8,90,000', 'Rs 12,00,000', <Pill key="d" tone="good">+34.8%</Pill>],
                ]}
            />
        </>
    ),
};
