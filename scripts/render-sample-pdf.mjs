import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { renderDocumentHTML } from '../lib/templateEngine/index.js';

const sampleInvoice = {
    version: 'v2',
    docType: 'Invoice',
    docNumber: 'SLT-2026-INV-0042',
    createdAt: '2026-07-23T10:00:00Z',
    businessName: 'SRI LAKSHMI TRADERS',
    companyTag1: 'Rice, Pulses and Provisions Wholesale',
    companyTag2: 'GSTIN: 33AAAAA0000A1Z5',
    brandColor: '#482683',
    brandLogo: '',
    sellerInfo: {
        name: 'SRI LAKSHMI TRADERS',
        address: '12 Car Street, Madurai - 625001\nTamil Nadu, India',
        phone: '+91 98765 43210',
        email: 'accounts@srilakshmi.example',
        gstin: '33AAAAA0000A1Z5'
    },
    customer: {
        name: 'City Care Super Speciality Hospital',
        company: 'City Care Healthcare Pvt Ltd',
        address: '104, Medical College Road, Palayamkottai\nTirunelveli - 627002, Tamil Nadu',
        phone: '+91 462 2501234',
        email: 'purchase@citycarehospital.com',
        gstin: '33AAACC1234F1Z5'
    },
    orderReferences: {
        buyersOrderNo: 'PO-2026-8812',
        buyersOrderDate: '21/07/2026',
        termsOfPayment: 'Net 30 Days',
        despatchedThrough: 'BlueDart Express',
        destination: 'Tirunelveli'
    },
    lineItems: [
        {
            product: 'Nelaton Catheter 100% Silicone 2-Way (FG 14)',
            description: 'Medical Grade Silicone, Sterile Individual Pack, Box of 10 Pcs',
            hsnCode: '90183990',
            taxRate: 12,
            qty: 50,
            unit: 'Box',
            unitPrice: 850,
            totalPrice: 42500
        },
        {
            product: 'Endotracheal Tube Cuffed (Size 7.5mm)',
            description: 'High Volume Low Pressure Cuff, Radio-opaque Line, Box of 5',
            hsnCode: '90183900',
            taxRate: 12,
            qty: 20,
            unit: 'Box',
            unitPrice: 1200,
            totalPrice: 24000
        },
        {
            product: 'Surgical Gown Reinforced Sterile (XL)',
            description: 'AAMI Level 3 Protection, Breathable Fluid-Resistant Fabric',
            hsnCode: '62101000',
            taxRate: 5,
            qty: 100,
            unit: 'Pcs',
            unitPrice: 280,
            totalPrice: 28000
        }
    ],
    subtotal: 94500,
    taxRate: 12,
    taxAmount: 10500,
    taxType: 'CGST_SGST',
    discountRate: 0,
    discountAmount: 0,
    grandTotal: 105000,
    notes: 'Payment Due in 30 Days from date of invoice.\nPlease make electronic transfer to HDFC Bank A/c: 50200012345678, IFSC: HDFC0000123.'
};

async function run() {
    console.log('Rendering document HTML...');
    const html = renderDocumentHTML(sampleInvoice, { viewUrl: 'https://velbiz.com/cloud/doc/SLT-2026-INV-0042/sample123' });
    
    const outputHtmlPath = path.join(process.cwd(), 'sample_invoice.html');
    const outputPdfPath = path.join(process.cwd(), 'sample_invoice.pdf');
    const outputPngPath = path.join(process.cwd(), 'sample_invoice.png');
    
    fs.writeFileSync(outputHtmlPath, html, 'utf8');
    console.log('Wrote sample_invoice.html');

    console.log('Rendering PDF & Screenshot with Puppeteer...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');

    await page.pdf({
        path: outputPdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    console.log('Wrote sample_invoice.pdf');

    await page.screenshot({
        path: outputPngPath,
        fullPage: true
    });
    console.log('Wrote sample_invoice.png');

    await browser.close();
    console.log('Done rendering samples!');
}

run().catch(err => console.error(err));
