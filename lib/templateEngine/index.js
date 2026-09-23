// Shared invoice/quote rendering engine.
//
// Single source of truth for document layout used identically by:
//   - PDF generator (src/app/api/cloud/documents/[id]/pdf/route.js)
//   - Dashboard live preview (src/components/dashboard/CloudDocPDFPreview.js)
//   - Public customer-facing view page (src/app/cloud/doc/[docNumber]/[secretKey]/page.js)
//   - Template builder canvas editor (src/app/cloud/dashboard/templates)

import { esc, money, qrCodeImg, numberToWords } from '../pdfUtils.js';
import { brand } from '../../config/site.js';

export const FIELD_STYLE_REGISTRY = {
    sellerBusinessName: { label: 'Seller - Business Name', group: 'Header', defaults: { fontSize: 17.5, align: 'center', bold: true } },
    sellerTag: { label: 'Seller - Tagline', group: 'Header', defaults: { fontSize: 12.5, align: 'center', bold: true } },
    sellerAddress: { label: 'Seller - Address', group: 'Header', defaults: { fontSize: 10.5, align: 'center', bold: false } },
    sellerContact: { label: 'Seller - Phone / Email', group: 'Header', defaults: { fontSize: 10.5, align: 'center', bold: false } },
    sellerGstin: { label: 'Seller - GSTIN', group: 'Header', defaults: { fontSize: 12.5, align: 'center', bold: true } },
    buyerName: { label: 'Buyer - Name', group: 'Header', defaults: { fontSize: 12.5, align: 'left', bold: true } },
    buyerCompany: { label: 'Buyer - Company', group: 'Header', defaults: { fontSize: 11.5, align: 'left', bold: false } },
    buyerAddress: { label: 'Buyer - Address', group: 'Header', defaults: { fontSize: 11.5, align: 'left', bold: false } },
    buyerContact: { label: 'Buyer - Phone / Email / GSTIN', group: 'Header', defaults: { fontSize: 11.5, align: 'left', bold: false } },
    documentDetailsLabel: { label: 'Document Details - Labels', group: 'Header', defaults: { fontSize: 11, align: 'left', bold: true } },
    documentDetailsValue: { label: 'Document Details - Values', group: 'Header', defaults: { fontSize: 11, align: 'left', bold: true } },
    itemTableHeader: { label: 'Item Table - Column Headers', group: 'Item Table', defaults: { fontSize: 10, align: 'left', bold: true } },
    itemTableCell: { label: 'Item Table - Row Text', group: 'Item Table', defaults: { fontSize: 11, align: 'left', bold: false } },
    taxBreakdownHeader: { label: 'Tax Breakdown - Header', group: 'Totals', defaults: { fontSize: 10, align: 'left', bold: true } },
    totalsLabel: { label: 'Summary - Labels', group: 'Totals', defaults: { fontSize: 11.5, align: 'left', bold: false } },
    totalsValue: { label: 'Summary - Values', group: 'Totals', defaults: { fontSize: 11.5, align: 'right', bold: true } },
    declarationText: { label: 'Declaration Text', group: 'Declaration', defaults: { fontSize: 10.5, align: 'left', bold: false } },
    termsText: { label: 'Terms and Conditions Text', group: 'Terms', defaults: { fontSize: 11.5, align: 'left', bold: false } },
    footerText: { label: 'Footer - Labels', group: 'Footer', defaults: { fontSize: 11, align: 'left', bold: true } },
};

export const FIELD_KEYS = Object.keys(FIELD_STYLE_REGISTRY);

function fstyle(fieldStyles, key) {
    const defaults = FIELD_STYLE_REGISTRY[key]?.defaults || { fontSize: 11, align: 'left', bold: false };
    const s = (fieldStyles && fieldStyles[key]) || {};
    return {
        fontSize: Number.isFinite(s.fontSize) ? s.fontSize : defaults.fontSize,
        align: s.align || defaults.align,
        bold: typeof s.bold === 'boolean' ? s.bold : defaults.bold,
    };
}

function styleCss(style, extra = '') {
    return `font-size:${style.fontSize}px;text-align:${style.align};font-weight:${style.bold ? 700 : 400};${extra}`;
}

function fmtNum(n) {
    return (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const HEADER_BOX_TYPES = ['sellerBox', 'buyerBox', 'consigneeBox', 'documentDetails'];

export const HEADER_BOX_LABELS = {
    sellerBox: 'Seller / Consigner',
    buyerBox: 'Buyer (Bill To)',
    consigneeBox: 'Consignee (Ship To)',
    documentDetails: 'Document Details',
};

// Same 60/40 left/right split (and the same gap) as the tax breakdown vs. summary row
// further down the page (renderTotalsRow) - column edges line up top to bottom.
const HEADER_WIDTH_MM = 186;
const COLUMN_GAP_MM = 4;
const LEFT_COLUMN_MM = (HEADER_WIDTH_MM - COLUMN_GAP_MM) * 0.6;
const RIGHT_COLUMN_MM = (HEADER_WIDTH_MM - COLUMN_GAP_MM) * 0.4;

const DEFAULT_HEADER_ELEMENTS = [
    { id: 'sellerBox', type: 'box', boxType: 'sellerBox', x: 0, y: 0, w: LEFT_COLUMN_MM, h: 48, visible: true },
    { id: 'buyerBox', type: 'box', boxType: 'buyerBox', x: 0, y: 52, w: LEFT_COLUMN_MM, h: 48, visible: true },
    { id: 'documentDetails', type: 'box', boxType: 'documentDetails', x: LEFT_COLUMN_MM + COLUMN_GAP_MM, y: 0, w: RIGHT_COLUMN_MM, h: 100, visible: true },
    { id: 'consigneeBox', type: 'box', boxType: 'consigneeBox', x: 0, y: 104, w: 186, h: 40, visible: false },
];

// The logo is bound to the seller box rather than a free-floating absolute element - it renders
// as a flex sibling of the seller box's text, so the two can never overlap: whichever side the
// logo sits on, the text column automatically fills the remaining space (and vice versa).
export const LOGO_POSITIONS = ['right', 'left', 'top', 'hidden'];

export const DEFAULT_LOGO_CONFIG = { position: 'right', widthMm: 26, heightMm: 20 };

export const DEFAULT_V2_CONFIG = {
    schemaVersion: 3,
    flatCorners: false,
    header: {
        heightMm: 100,
        elements: DEFAULT_HEADER_ELEMENTS.map(e => ({ ...e })),
        logo: { ...DEFAULT_LOGO_CONFIG },
    },
    sections: [
        { id: 'itemTable', visible: true, order: 5 },
        { id: 'totalsRow', visible: true, order: 10 },
        { id: 'declaration', visible: true, order: 20 },
        { id: 'terms', visible: true, order: 30 },
        { id: 'footerSignature', visible: true, order: 40 },
    ],
    fieldStyles: {},
};

function logoContent(doc, showPlaceholder = true) {
    const { brandLogo = '' } = doc;
    if (brandLogo) {
        return `<img src="${brandLogo}" style="width:100%;height:100%;object-fit:contain;display:block;" />`;
    }
    if (showPlaceholder) {
        return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1.5px dashed #482683;border-radius:var(--box-radius);font-size:10px;font-weight:800;color:#482683;background:rgba(72,38,131,0.04);box-sizing:border-box;padding:2px;text-align:center;user-select:none;">
            <span style="font-size:12px;line-height:1;">🖼️</span>
            <span style="font-size:8.5px;margin-top:2px;">LOGO</span>
        </div>`;
    }
    return '';
}

// The single logo slot, bound to the seller box. Rendered as a flex sibling so it never
// overlaps the seller text - the text column (flex:1) reflows to fill whatever space the
// logo isn't using, on whichever side it's placed.
function sellerBoxContent(doc, fs, logoConfig) {
    const { businessName = 'Business', sellerInfo = {}, sellerCustomFields = [], companyTag1 = '', companyTag2 = '', companyTag3 = '' } = doc;
    const sellerCustomHTML = (sellerCustomFields || []).map(f => f.label && f.value ? `
        <div style="${styleCss(fstyle(fs, 'sellerContact'))}color:#333;margin-bottom:2px;">${esc(f.label)}: ${esc(f.value)}</div>
    ` : '').join('');

    const lc = logoConfig || DEFAULT_LOGO_CONFIG;
    const position = LOGO_POSITIONS.includes(lc.position) ? lc.position : DEFAULT_LOGO_CONFIG.position;
    const showLogo = position !== 'hidden';
    const logoWrapStyle = position === 'top'
        ? `width:${lc.widthMm}mm;height:${lc.heightMm}mm;margin:0 auto 6px;flex-shrink:0;`
        : `width:${lc.widthMm}mm;height:${lc.heightMm}mm;flex-shrink:0;align-self:center;${position === 'left' ? 'order:-1;' : ''}`;
    const logoHTML = showLogo ? `<div style="${logoWrapStyle}">${logoContent(doc, true)}</div>` : '';

    const textHTML = `
        <div style="flex:1;min-width:0;display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center;">
            <div style="font-weight:700;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;border-bottom:1px solid #e2e8f0;padding-bottom:2px;width:100%;">Seller / Consigner</div>
            <div style="${styleCss(fstyle(fs, 'sellerBusinessName'))}text-transform:uppercase;margin-bottom:2px;color:#0f172a;">${esc(sellerInfo.name || businessName)}</div>
            ${companyTag1 ? `<div style="${styleCss(fstyle(fs, 'sellerTag'))}color:#2d1752;margin-bottom:2px;">${esc(companyTag1)}</div>` : ''}
            ${companyTag2 ? `<div style="${styleCss(fstyle(fs, 'sellerTag'))}color:#475569;margin-bottom:2px;">${esc(companyTag2)}</div>` : ''}
            ${companyTag3 ? `<div style="${styleCss(fstyle(fs, 'sellerTag'))}color:#475569;margin-bottom:2px;">${esc(companyTag3)}</div>` : ''}
            <div style="${styleCss(fstyle(fs, 'sellerAddress'))}line-height:1.4;color:#333;margin:4px 0;text-align:center;width:100%;">
                ${esc(sellerInfo.address || '').replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>')}
            </div>
            ${sellerInfo.phone ? `<div style="${styleCss(fstyle(fs, 'sellerContact'))}color:#333;margin-bottom:2px;">Phone: ${esc(sellerInfo.phone)}</div>` : ''}
            ${sellerInfo.email ? `<div style="${styleCss(fstyle(fs, 'sellerContact'))}color:#333;margin-bottom:2px;">Email: ${esc(sellerInfo.email)}</div>` : ''}
            ${sellerInfo.gstin ? `<div style="${styleCss(fstyle(fs, 'sellerGstin'))}color:#000;margin-top:2px;">GSTIN/UIN: ${esc(sellerInfo.gstin)}</div>` : ''}
            ${sellerCustomHTML}
        </div>
    `;

    if (position === 'top') {
        return `<div style="display:flex;flex-direction:column;width:100%;height:100%;box-sizing:border-box;align-items:center;justify-content:center;">${logoHTML}${textHTML}</div>`;
    }
    return `<div style="display: flex; gap: 10px; width: 100%; height: 100%; box-sizing: border-box; align-items: center;">${textHTML}${logoHTML}</div>`;
}

function buyerBoxContent(doc, fs) {
    const { customer = {}, customerCustomFields = [] } = doc;
    const customerCustomHTML = (customerCustomFields || []).map(f => f.label && f.value ? `
        <div style="${styleCss(fstyle(fs, 'buyerContact'))}color:#333;margin-top:2px;">${esc(f.label)}: ${esc(f.value)}</div>
    ` : '').join('');
    return `
        <div style="font-weight:700;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">Buyer (Bill To)</div>
        <div style="${styleCss(fstyle(fs, 'buyerName'))}color:#0f172a;margin-bottom:3px;">${esc(customer.name)}</div>
        ${customer.company ? `<div style="${styleCss(fstyle(fs, 'buyerCompany'))}color:#333;margin-bottom:2px;">${esc(customer.company)}</div>` : ''}
        <div style="${styleCss(fstyle(fs, 'buyerAddress'))}line-height:1.45;color:#333;">
            <strong>Address:</strong><br/>
            ${esc(customer.address || '-').replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>')}
        </div>
        ${customer.phone ? `<div style="${styleCss(fstyle(fs, 'buyerContact'))}color:#333;margin-top:3px;">Phone: ${esc(customer.phone)}</div>` : ''}
        ${customer.email ? `<div style="${styleCss(fstyle(fs, 'buyerContact'))}color:#333;">Email: ${esc(customer.email)}</div>` : ''}
        ${customer.gstin ? `<div style="${styleCss(fstyle(fs, 'buyerContact'))}color:#000;margin-top:4px;">GSTIN/UIN: ${esc(customer.gstin)}</div>` : ''}
        ${customerCustomHTML}
    `;
}

function consigneeBoxContent(doc, fs) {
    const { customer = {}, shippingAddress = {} } = doc;
    return `
        <div style="font-weight:700;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">Consignee (Ship To)</div>
        <div style="${styleCss(fstyle(fs, 'buyerName'))}color:#0f172a;margin-bottom:3px;">${esc(shippingAddress.name || customer.name)}</div>
        <div style="${styleCss(fstyle(fs, 'buyerAddress'))}line-height:1.45;color:#333;">
            <strong>Address:</strong><br/>
            ${shippingAddress.address ? esc(shippingAddress.address).replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>') : (customer.address ? esc(customer.address).replace(/\\n/g, '<br/>').replace(/\n/g, '<br/>') : 'Same as billing address')}
        </div>
        ${shippingAddress.gstin ? `<div style="${styleCss(fstyle(fs, 'buyerContact'))}color:#000;margin-top:4px;">GSTIN/UIN: ${esc(shippingAddress.gstin)}</div>` : ''}
    `;
}

function documentDetailsContent(doc, fs) {
    const { docType = 'Invoice', docNumber, createdAt, orderReferences = {} } = doc;
    const isInvoice = docType === 'Invoice';
    const dateStr = new Date(createdAt || new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const detailsRows = [
        { label: isInvoice ? 'Invoice No' : 'Quotation No', val: docNumber },
        { label: 'Date', val: dateStr },
        { label: 'Delivery Note', val: orderReferences.deliveryNote },
        { label: 'Mode/Terms of Payment', val: orderReferences.termsOfPayment },
        { label: "Supplier's Ref", val: orderReferences.suppliersRef },
        { label: 'Other Reference', val: orderReferences.otherReference },
        { label: "Buyer's Order No", val: orderReferences.buyersOrderNo },
        { label: 'Order Date', val: orderReferences.buyersOrderDate },
        { label: 'Despatch Doc No', val: orderReferences.despatchDocumentNo },
        { label: 'Despatched through', val: orderReferences.despatchedThrough },
        { label: 'Destination', val: orderReferences.destination },
        { label: 'e-Way Bill No', val: orderReferences.eWayBillNo },
        { label: 'Terms of Delivery', val: orderReferences.termsOfDelivery },
        { label: 'Contact Person', val: orderReferences.deliveryContactPerson },
        { label: 'Contact Number', val: orderReferences.deliveryContactNumber },
    ].filter(r => r.val && String(r.val).trim() !== '-' && String(r.val).trim() !== '');

    const rowsHTML = detailsRows.map(r => `
        <tr style="border-bottom:1px dashed #e2e8f0;">
            <td style="${styleCss(fstyle(fs, 'documentDetailsLabel'))}width:145px;color:#475569;vertical-align:top;padding:4px 0;">${esc(r.label)}:</td>
            <td style="${styleCss(fstyle(fs, 'documentDetailsValue'))}color:#0f172a;vertical-align:top;padding:4px 0;">${esc(r.val)}</td>
        </tr>
    `).join('');

    return `
        <div style="font-weight:700;font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;">Document Details</div>
        <table style="width:100%;border-collapse:collapse;line-height:1.4;font-size:11px;">${rowsHTML}</table>
    `;
}

const HEADER_BOX_CONTENT = {
    sellerBox: sellerBoxContent,
    buyerBox: buyerBoxContent,
    consigneeBox: consigneeBoxContent,
    documentDetails: documentDetailsContent,
};

function renderHeaderCanvas(doc, config, fieldStyles) {
    const { hideDocumentDetails = false } = doc;
    const fs = fieldStyles;

    const header = (config && config.header) ? config.header : DEFAULT_V2_CONFIG.header;
    const elements = (header.elements && header.elements.length) ? header.elements : DEFAULT_HEADER_ELEMENTS;
    const logoConfig = header.logo || DEFAULT_LOGO_CONFIG;

    const isVisible = (type) => {
        if (type === 'documentDetails' && hideDocumentDetails) return false;
        const el = elements.find(e => e.boxType === type);
        return el ? el.visible : false;
    };

    const renderBox = (type) => {
        if (!isVisible(type)) return '';
        const contentFn = HEADER_BOX_CONTENT[type];
        if (!contentFn) return '';
        const content = type === 'sellerBox' ? contentFn(doc, fs, logoConfig) : contentFn(doc, fs);
        return `
            <div style="flex: 1 1 auto; min-height: min-content; border: 1.5px solid #000; border-radius: var(--box-radius); background: #fff; padding: 10px; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column;">
                ${content}
            </div>
        `;
    };

    const leftHTML = [
        renderBox('sellerBox'),
        renderBox('buyerBox'),
        renderBox('consigneeBox')
    ].filter(Boolean).join('');

    const rightHTML = renderBox('documentDetails');

    return `
    <div style="display: flex; gap: ${COLUMN_GAP_MM}mm; margin-bottom: 12px; width: 100%; align-items: stretch; box-sizing: border-box;">
        <div style="flex: 6; min-width: 0; display: flex; flex-direction: column; gap: ${COLUMN_GAP_MM}mm; box-sizing: border-box;">
            ${leftHTML}
        </div>
        ${rightHTML ? `
        <div style="flex: 4; min-width: 0; display: flex; flex-direction: column; box-sizing: border-box;">
            ${rightHTML}
        </div>
        ` : ''}
    </div>
    `;
}

function computeTaxBreakdown(doc) {
    const { lineItems = [], taxType = 'CGST_SGST' } = doc;
    const taxBreakdown = {};
    let totalTaxable = 0;
    lineItems.forEach(item => {
        const rate = parseFloat(item.taxRate) || 0;
        const itemDiscount = (item.totalPrice || 0) * ((doc.discountRate || 0) / 100);
        const taxable = (item.totalPrice || 0) - itemDiscount;
        const tax = taxable * (rate / 100);
        totalTaxable += taxable;
        if (rate > 0) {
            if (!taxBreakdown[rate]) taxBreakdown[rate] = { taxable: 0, tax: 0, cgst: 0, sgst: 0, igst: 0 };
            taxBreakdown[rate].taxable += taxable;
            taxBreakdown[rate].tax += tax;
            if (taxType === 'IGST') {
                taxBreakdown[rate].igst += tax;
            } else {
                taxBreakdown[rate].cgst += tax / 2;
                taxBreakdown[rate].sgst += tax / 2;
            }
        }
    });
    return { taxBreakdown, totalTaxable, isInterState: taxType === 'IGST' };
}

function renderItemTableSection(doc, ctx) {
    const fs = ctx.fieldStyles;
    const { lineItems = [] } = doc;
    const headerStyle = fstyle(fs, 'itemTableHeader');
    const cellStyle = fstyle(fs, 'itemTableCell');
    const itemRowsHTML = lineItems.map((item, idx) => `
        <tr>
            <td style="${styleCss(cellStyle)}text-align:center;">${idx + 1}</td>
            <td style="${styleCss(cellStyle)}">
                <strong style="color:#0f172a;">${esc(item.product)}</strong>
                ${item.description ? `<br/><span style="color:#475569;font-size:${Math.max(cellStyle.fontSize - 1, 8.5)}px;">${esc(item.description)}</span>` : ''}
            </td>
            <td style="${styleCss(cellStyle)}text-align:center;">${esc(item.hsnCode)}</td>
            <td style="${styleCss(cellStyle)}text-align:center;">${item.taxRate}%</td>
            <td style="${styleCss(cellStyle)}text-align:center;">${item.qty}</td>
            <td style="${styleCss(cellStyle)}text-align:right;">${fmtNum(item.unitPrice)}</td>
            <td style="${styleCss(cellStyle)}text-align:center;">${esc(item.unit)}</td>
            <td style="${styleCss(cellStyle)}text-align:right;font-weight:600;color:#0f172a;">${fmtNum(item.totalPrice)}</td>
        </tr>
    `).join('');

    return `
    <table class="item-table">
        <thead>
            <tr>
                <th style="${styleCss(headerStyle)}width:30px;text-align:center;">Sl.<br/>No</th>
                <th style="${styleCss(headerStyle)}">Description of Goods</th>
                <th style="${styleCss(headerStyle)}width:60px;text-align:center;">HSN/SAC</th>
                <th style="${styleCss(headerStyle)}width:50px;text-align:center;">GST Rate</th>
                <th style="${styleCss(headerStyle)}width:40px;text-align:center;">Qty</th>
                <th style="${styleCss(headerStyle)}width:70px;text-align:right;">Rate</th>
                <th style="${styleCss(headerStyle)}width:40px;text-align:center;">Per</th>
                <th style="${styleCss(headerStyle)}width:85px;text-align:right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${itemRowsHTML}
            <tr style="font-weight: 700; background: #f8fafc;">
                <td colspan="7" style="${styleCss(cellStyle)}text-align:right;border-top:1.5px solid #000;padding:6px 8px;font-weight:700;color:#0f172a;">Total Taxable Value (Subtotal):</td>
                <td style="${styleCss(cellStyle)}text-align:right;border-top:1.5px solid #000;padding:6px 8px;font-weight:700;color:#0f172a;">${fmtNum(doc.subtotal)}</td>
            </tr>
        </tbody>
    </table>
    `;
}

function renderTotalsRow(doc, ctx) {
    const fs = ctx.fieldStyles;
    const { docType = 'Invoice', grandTotal = 0, taxAmount = 0 } = doc;
    const isInvoice = docType === 'Invoice';
    const { taxBreakdown, totalTaxable, isInterState } = ctx.taxInfo;
    const headerStyle = fstyle(fs, 'taxBreakdownHeader');
    const labelStyle = fstyle(fs, 'totalsLabel');
    const valueStyle = fstyle(fs, 'totalsValue');

    let detailedTaxTable = '';
    if (isInvoice && taxAmount > 0) {
        let taxBreakdownRows = '';
        Object.entries(taxBreakdown).forEach(([rate, b]) => {
            if (isInterState) {
                taxBreakdownRows += `
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px;">${rate}% GST</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${fmtNum(b.taxable)}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${rate}%</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${fmtNum(b.igst)}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${fmtNum(b.igst)}</td>
                    </tr>
                `;
            } else {
                taxBreakdownRows += `
                    <tr>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px;">${rate}% GST</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${fmtNum(b.taxable)}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${rate / 2}%</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${fmtNum(b.cgst)}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${rate / 2}%</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${fmtNum(b.sgst)}</td>
                        <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${fmtNum(b.tax)}</td>
                    </tr>
                `;
            }
        });

        detailedTaxTable = `
            <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                <div>
                    <div style="${styleCss(headerStyle)}text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-size:9px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;margin-bottom:6px;">Tax Breakdown</div>
                    <table class="tax-table" style="width: 100%; border-collapse: collapse; font-size: 10px; line-height: 1.4; border: none;">
                        <thead>
                            <tr style="background: #f8fafc; font-weight: 700; color: #1e293b;">
                                <th style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left;">GST Rate</th>
                                <th style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">Taxable Value</th>
                                ${isInterState ? `
                                    <th style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;" colspan="2">Integrated Tax</th>
                                ` : `
                                    <th style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;" colspan="2">Central Tax</th>
                                    <th style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;" colspan="2">State Tax</th>
                                `}
                                <th style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">Total Tax</th>
                            </tr>
                            <tr style="background: #f8fafc; font-size: 9px; font-weight: 600; color: #475569;">
                                <th style="border: 1px solid #cbd5e1; padding: 2px 4px;"></th>
                                <th style="border: 1px solid #cbd5e1; padding: 2px 4px;"></th>
                                ${isInterState ? `
                                    <th style="border: 1px solid #cbd5e1; padding: 2px 4px; text-align: right;">Rate</th>
                                    <th style="border: 1px solid #cbd5e1; padding: 2px 4px; text-align: right;">Amount</th>
                                ` : `
                                    <th style="border: 1px solid #cbd5e1; padding: 2px 4px; text-align: right;">Rate</th>
                                    <th style="border: 1px solid #cbd5e1; padding: 2px 4px; text-align: right;">Amount</th>
                                    <th style="border: 1px solid #cbd5e1; padding: 2px 4px; text-align: right;">Rate</th>
                                    <th style="border: 1px solid #cbd5e1; padding: 2px 4px; text-align: right;">Amount</th>
                                `}
                                <th style="border: 1px solid #cbd5e1; padding: 2px 4px;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${taxBreakdownRows}
                            <tr style="font-weight: 700; background: #f8fafc; color: #0f172a;">
                                <td style="border: 1px solid #cbd5e1; padding: 4px 6px;">Total</td>
                                <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${fmtNum(totalTaxable)}</td>
                                ${isInterState ? `
                                    <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;" colspan="2">${fmtNum(taxAmount)}</td>
                                ` : `
                                    <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;" colspan="2">${fmtNum(taxAmount / 2)}</td>
                                    <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;" colspan="2">${fmtNum(taxAmount / 2)}</td>
                                `}
                                <td style="border: 1px solid #cbd5e1; padding: 4px 6px; text-align: right;">${fmtNum(taxAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // With no GST on this document there's nothing to show in a tax-breakdown box -
    // rather than display an empty box saying so, skip it entirely. The Summary box
    // keeps the same flex:4 width it always has (matching the Document Details box
    // in the header row above, also a 6:4 split) rather than stretching to fill the
    // row - right-aligning it via justify-content keeps both boxes' edges lined up
    // instead of the summary drifting to the far left once its sibling disappears.
    return `
    <div style="display: flex; justify-content: flex-end; gap: ${COLUMN_GAP_MM}mm; margin-top: 12px; margin-bottom: 12px; width: 100%; align-items: stretch; box-sizing: border-box;">
        ${detailedTaxTable ? `
        <div style="flex: 1 1 0%; min-width: 0; border: 1.5px solid #000; border-radius: var(--box-radius); padding: 10px; background: #fff; display: flex; flex-direction: column; box-sizing: border-box;">
            ${detailedTaxTable}
        </div>
        ` : ''}

        <div style="flex: 0 0 40%; min-width: 0; border: 1.5px solid #000; border-radius: var(--box-radius); padding: 10px; background: #fff; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
            <div>
                <div style="${styleCss(headerStyle)}text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-size:9px;border-bottom:1px solid #e2e8f0;padding-bottom:3px;margin-bottom:6px;">Summary</div>
                <table style="width: 100%; border-collapse: collapse; line-height: 1.55;">
                    <tr>
                        <td style="${styleCss(labelStyle)}color:#475569;">Taxable Subtotal:</td>
                        <td style="${styleCss(valueStyle)}color:#0f172a;">${fmtNum(doc.subtotal)}</td>
                    </tr>
                    ${doc.discountAmount > 0 ? `
                        <tr>
                            <td style="${styleCss(labelStyle)}color:#475569;">Discount:</td>
                            <td style="${styleCss(valueStyle)}color:#dc2626;">- ${fmtNum(doc.discountAmount)}</td>
                        </tr>
                    ` : ''}
                    ${Object.entries(taxBreakdown).map(([rate, b]) => {
        if (isInterState) {
            return `
                                <tr>
                                    <td style="${styleCss(labelStyle)}color:#475569;">IGST @ ${rate}%:</td>
                                    <td style="${styleCss(valueStyle)}color:#0f172a;">${fmtNum(b.igst)}</td>
                                </tr>
                            `;
        } else {
            return `
                                <tr>
                                    <td style="${styleCss(labelStyle)}color:#475569;">CGST @ ${rate / 2}%:</td>
                                    <td style="${styleCss(valueStyle)}color:#0f172a;">${fmtNum(b.cgst)}</td>
                                </tr>
                                <tr>
                                    <td style="${styleCss(labelStyle)}color:#475569;">SGST @ ${rate / 2}%:</td>
                                    <td style="${styleCss(valueStyle)}color:#0f172a;">${fmtNum(b.sgst)}</td>
                                </tr>
                            `;
        }
    }).join('')}
                    ${doc.roundOff ? `
                        <tr>
                            <td style="${styleCss(labelStyle)}color:#475569;">Round off:</td>
                            <td style="${styleCss(valueStyle)}color:#0f172a;">${fmtNum(doc.roundOff)}</td>
                        </tr>
                    ` : ''}
                </table>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
                <tr style="border-top: 1.5px solid #000;">
                    <td style="${styleCss(labelStyle)}color:#0f172a;font-size:${labelStyle.fontSize + 1}px;font-weight:800;padding-top:6px;">Grand Total:</td>
                    <td style="${styleCss(valueStyle)}color:#0f172a;font-size:${valueStyle.fontSize + 1}px;font-weight:800;padding-top:6px;">${fmtNum(grandTotal)}</td>
                </tr>
            </table>
        </div>
    </div>
    `;
}

function renderTermsSection(doc, ctx) {
    const fs = ctx.fieldStyles;
    const { termsList = [] } = doc;
    if (!termsList.length) return '';
    const textStyle = fstyle(fs, 'termsText');
    return `
    <div style="margin-top: 14px; margin-bottom: 12px;">
        <div style="font-size: ${textStyle.fontSize + 1}px; font-weight: 700; color: #482683; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">Terms and Conditions:</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            ${termsList.map(t => `<tr><td style="${styleCss(textStyle)}width:130px;font-weight:600;padding:2px 0;vertical-align:top;color:#475569;">${esc(t.key)}</td><td style="${styleCss(textStyle)}padding:2px 0;color:#0f172a;">: ${esc(t.value)}</td></tr>`).join('')}
        </table>
    </div>
    `;
}

function renderDeclaration(doc, ctx) {
    const fs = ctx.fieldStyles;
    const { docType = 'Invoice', grandTotal = 0 } = doc;
    const isInvoice = docType === 'Invoice';
    const textStyle = fstyle(fs, 'declarationText');
    return `
    <div class="declaration-box" style="border: 1.5px solid #000; border-radius: var(--box-radius); padding: 10px 12px; background: #fff; margin-bottom: 12px; color: #0f172a;">
        <div style="${styleCss(textStyle)}margin-bottom:4px;"><strong>Amount in words:</strong> <span style="font-weight: 700; text-transform: capitalize; color:#0f172a;">INR ${numberToWords(Math.floor(grandTotal || 0))}</span></div>
        ${isInvoice ? `
            <div style="font-weight: 700; text-decoration: underline; margin-bottom: 3px; margin-top: 6px; color:#0f172a;">Declaration</div>
            <div style="${styleCss(textStyle)}line-height:1.45;color:#334155;">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
        ` : `
            ${!ctx.termsVisible ? `<div style="${styleCss(textStyle)}line-height:1.45;margin-top:6px;color:#334155;">We trust the above would meet your requirements and we now look forward to receive your valuable order at the earliest.</div>` : ''}
        `}
    </div>
    `;
}

function renderFooterSignature(doc, ctx) {
    const fs = ctx.fieldStyles;
    const { businessName = 'Business', signatoryImage = '' } = doc;
    const textStyle = fstyle(fs, 'footerText');
    return `
    <div class="footer-sig-box" style="border: 1.5px solid #000; border-radius: var(--box-radius); padding: 10px 12px; background: #fff; margin-bottom: 12px;">
        <div style="display: flex; align-items: stretch; gap: 15px; min-height: 95px;">
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="${styleCss(textStyle)}color:#0f172a;">Customer's Seal & Signature</div>
                <div style="height: 50px;"></div>
            </div>
            ${ctx.viewUrl ? `
            <div style="flex: 0 0 auto; width: 92px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 10px; border-left: 1px dashed #cbd5e1; border-right: 1px dashed #cbd5e1;">
                ${qrCodeImg(ctx.viewUrl, 62)}
                <div style="font-size: 8.5px; font-weight: 700; color: #475569; text-align: center; margin-top: 5px; line-height: 1.3; letter-spacing: 0.01em;">Scan to view digital copy</div>
            </div>
            ` : ''}
            <div style="flex: 1; text-align: right; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between;">
                <div style="${styleCss(textStyle)}color:#0f172a;">For ${esc(businessName)}</div>
                <div style="height: 50px; display: flex; align-items: flex-end; justify-content: flex-end; margin-top: 4px; margin-bottom: 4px;">
                    ${signatoryImage ? `
                        <img src="${signatoryImage}" style="max-height: 48px; display: block;" />
                    ` : ''}
                </div>
                <div style="${styleCss(textStyle)}color:#0f172a;">Authorised Signatory</div>
            </div>
        </div>
    </div>
    `;
}

export const SECTION_RENDERERS = {
    itemTable: renderItemTableSection,
    totalsRow: renderTotalsRow,
    terms: renderTermsSection,
    declaration: renderDeclaration,
    footerSignature: renderFooterSignature,
};

export const SECTION_LABELS = {
    itemTable: 'Item Table',
    totalsRow: 'Tax Breakdown & Summary',
    terms: 'Terms and Conditions',
    declaration: 'Amount in Words / Declaration',
    footerSignature: 'Signature & QR Code',
};

function buildLegacyHTML(doc, viewUrl) {
    return buildV2HTML(doc, viewUrl, null);
}

function buildV2HTML(doc, viewUrl, config) {
    const cfg = config || DEFAULT_V2_CONFIG;
    const {
        docType = 'Invoice', docNumber,
        letterheadPage1 = '', useUploadedLetterhead = false,
    } = doc;

    const isInvoice = docType === 'Invoice';
    const typeLabel = isInvoice ? 'TAX INVOICE' : 'QUOTATION';
    const bg1 = useUploadedLetterhead && letterheadPage1 ? `background-image: url('${letterheadPage1}');` : '';
    const bodyPadding = useUploadedLetterhead ? 'padding: 42mm 15mm 20mm;' : 'padding: 7mm 12mm 10mm 12mm;';

    const taxInfo = computeTaxBreakdown(doc);
    const sections = (cfg.sections || DEFAULT_V2_CONFIG.sections);
    const termsSection = sections.find(s => s.id === 'terms');
    const termsVisible = !!termsSection?.visible && (doc.termsList || []).length > 0;
    const fieldStyles = cfg.fieldStyles || {};

    const ctx = { taxInfo, viewUrl, termsVisible, fieldStyles };

    const headerHTML = renderHeaderCanvas(doc, cfg, fieldStyles);
    const sectionsHTML = [...sections]
        .filter(s => s.visible)
        .sort((a, b) => a.order - b.order)
        .map(s => (SECTION_RENDERERS[s.id] ? SECTION_RENDERERS[s.id](doc, ctx) : ''))
        .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <title>${esc(docNumber || 'Preview')}</title>
    <style>
        :root { --box-radius: ${cfg.flatCorners ? '0px' : '6px'}; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000; background: #fff; ${bodyPadding} background-size: 100% 100%; background-repeat: no-repeat; ${bg1} }
        .title { text-align: center; font-size: 16px; font-weight: 800; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a; }
        
        .item-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1.5px solid #000; border-radius: var(--box-radius); overflow: hidden; margin-bottom: 12px; }
        .item-table th { border-bottom: 1.5px solid #000; border-right: 1px solid #000; padding: 7px 6px; background: #f8fafc; font-weight: 700; color: #0f172a; }
        .item-table th:last-child { border-right: none; }
        .item-table td { border-bottom: 1px solid #e2e8f0; border-right: 1px solid #000; padding: 7px 6px; }
        .item-table td:last-child { border-right: none; }
        .item-table tr:last-child td { border-bottom: none; }

        .tax-table { width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11px; }
        .tax-table th { border: 1px solid #000; padding: 6px; background: #f8fafc; font-weight: 700; }
        .tax-table td { border: 1px solid #000; padding: 6px; }

        .print-note { text-align: center; font-size: 8.5px; color: #94a3b8; margin-top: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; letter-spacing: 0.5px; }

        @media print {
            body { padding: ${useUploadedLetterhead ? '42mm 15mm 20mm' : '0'}; }
        }
    </style>
</head>
<body>
    ${isInvoice ? `<div class="title">${typeLabel}</div>` : ''}

    ${headerHTML}
    ${sectionsHTML}
    <div class="print-note">
        This document is created and managed in VelBiz Cloud. For more details contact ${brand.email} or visit https://${brand.domain}/cloud/
    </div>
</body>
</html>
    `;
}

export function renderDocumentHTML(doc, opts = {}) {
    const { viewUrl = null, templateConfig } = opts;
    const resolvedConfig = templateConfig !== undefined ? templateConfig : (doc.templateConfig || null);
    return doc.version === 'v2' ? buildV2HTML(doc, viewUrl, resolvedConfig) : buildLegacyHTML(doc, viewUrl);
}
