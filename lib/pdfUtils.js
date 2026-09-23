/**
 * pdfUtils.js - Shared PDF rendering utilities
 *
 * Previously duplicated across 8 files:
 *   - app/api/quotes/[id]/pdf/route.js
 *   - app/api/cloud/documents/[id]/pdf/route.js
 *   - app/api/quotes/[id]/view/route.js
 *   - app/cloud/[quoteNumber]/[secretKey]/page.js
 *   - app/cloud/doc/[docNumber]/[secretKey]/page.js
 *   - components/dashboard/CloudDocPDFPreview.js
 *   - components/dashboard/FinancePDFPreview.js
 *   - components/dashboard/QuotePDFPreview.js
 *
 * Import from here:
 *   import { esc, money, qrCodeImg, chunkTC, renderTCPage, pageNum, numberToWords } from '@/lib/pdfUtils';
 */

/**
 * HTML-escape a value to prevent XSS in generated HTML/PDF documents.
 * @param {*} s - Any value; coerced to string.
 * @returns {string} Escaped string safe for HTML output.
 */
export function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Format a number as a currency string using Indian locale formatting.
 * @param {number} n - The numeric amount.
 * @param {string} [cur='INR'] - ISO 4217 currency code prefix (e.g. 'INR', 'USD').
 * @returns {string} Formatted string like "INR 1,23,456.00".
 */
export function money(n, cur = 'INR') {
    return `${cur} ${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate an HTML <img> tag for a QR code using the qrserver.com public API.
 * @param {string} url - The URL/data to encode in the QR code.
 * @param {number} [size=72] - Width and height in pixels.
 * @returns {string} An HTML img tag string, or '' if url is falsy.
 */
export function qrCodeImg(url, size = 72) {
    if (!url) return '';
    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}&format=svg&qzone=1&color=1e1b4b`;
    return `<img src="${apiUrl}" width="${size}" height="${size}" alt="QR Code" style="display:block;margin:0 auto" />`;
}

/**
 * Split a Terms & Conditions string into pages fitting within a fixed height budget.
 * @param {string} fullText - Full T&C text, newline-separated paragraphs.
 * @returns {string[][]} Array of pages, each an array of text block strings.
 */
export function chunkTC(fullText) {
    const blocks = (fullText || '').split('\n').map(l => l.trim()).filter(Boolean);
    let pages = [];
    let currentPage = [];
    const MAX_HEIGHT = 960;
    let currentHeight = 70;

    for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i];
        let isHeading = /^\d+\.\s+[A-Z\s&/]+$/.test(block);

        let blockHeight = 0;
        if (isHeading) {
            blockHeight = 22;
        } else if (block.startsWith('•')) {
            let lines = Math.ceil(block.length / 135);
            blockHeight = lines * 15 + 2;
        } else {
            let lines = Math.ceil(block.length / 140);
            blockHeight = lines * 15.5 + 4;
        }

        let lookaheadHeight = blockHeight;
        if (isHeading && i + 1 < blocks.length) {
            let nextBlock = blocks[i + 1];
            if (nextBlock.startsWith('•')) {
                lookaheadHeight += Math.ceil(nextBlock.length / 135) * 15 + 2;
            } else {
                lookaheadHeight += Math.ceil(nextBlock.length / 140) * 15.5 + 4;
            }
        }

        if (currentHeight + lookaheadHeight > MAX_HEIGHT && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [];
            currentHeight = 40;
        }

        currentPage.push(block);
        currentHeight += blockHeight;
    }
    if (currentPage.length > 0) pages.push(currentPage);
    return pages;
}

/**
 * Render an array of T&C text blocks into styled HTML for a PDF page.
 * @param {string[]} lines - Array of text block strings from chunkTC().
 * @returns {string} HTML string of rendered T&C content.
 */
export function renderTCPage(lines) {
    return lines.map(line => {
        if (/^\d+\.\s+[A-Z\s&/]+$/.test(line)) {
            return `<div style="font-size:10px;font-weight:700;color:#1e1b4b;text-transform:uppercase;letter-spacing:0.3px;margin-top:8px;margin-bottom:2px">${esc(line)}</div>`;
        }
        if (line.startsWith('•')) {
            return `<div style="padding-left:14px;margin-bottom:2px;font-size:10px;color:#374151;line-height:1.5;text-align:justify">${esc(line)}</div>`;
        }
        return `<div style="font-size:10px;color:#374151;line-height:1.55;margin-bottom:4px;text-align:justify">${esc(line)}</div>`;
    }).join('');
}

/**
 * Render an absolutely-positioned page number footer for paginated PDFs.
 * @param {number} current - Current page number (1-indexed).
 * @param {number} total - Total number of pages.
 * @returns {string} HTML div string positioned at bottom-right.
 */
export function pageNum(current, total) {
    return `<div style="position:absolute;bottom:21mm;right:18mm;font-size:9px;color:#6b7280;font-weight:500">Page ${current} / ${total}</div>`;
}

/**
 * Convert a numeric amount to English words (Indian number system).
 * Used for "Amount in Words" on tax invoices.
 * @param {number} num - A non-negative integer (rupee amount, no paise).
 * @returns {string} Words string e.g. "twelve lakh fifty thousand rupees only".
 */
/**
 * Title-Cased amount in words - "One Hundred And Fifty Rupees Only".
 *
 * A separate export rather than a change to numberToWords(): that function is
 * consumed by Cloud's templateEngine and 8 other call sites which expect the
 * existing lowercase output, so changing it in place would silently restyle
 * every Cloud invoice too.
 */
export function numberToWordsTitleCase(num) {
    const words = numberToWords(num);
    if (!words || words === 'overflow') return words || '';
    return words.replace(/\b[a-z]/g, c => c.toUpperCase());
}

export function numberToWords(num) {
    const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ',
        'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() ? str.trim() + ' rupees only' : 'zero rupees only';
}
