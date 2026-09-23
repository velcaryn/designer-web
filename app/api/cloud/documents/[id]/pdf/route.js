import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { renderDocumentHTML } from '@/lib/templateEngine';
import { permissionDenied } from '@/lib/permissions';
import { launchPdfBrowser } from '@/lib/pdfBrowser';

export const dynamic = 'force-dynamic';

export async function GET(req, context) {
    try {
        const { id } = await context.params;
        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 });
        }
        const db = await getCloudDb();

        // Two ways in: an authenticated cloud dashboard session scoped to the doc's tenant,
        // or the document's own secretKey (used by the public share link - no session required).
        const user = await getCloudUser(req);
        if (user) {
            const denied = permissionDenied(user, 'documents');
            if (denied) return denied;
        }
        const { searchParams } = new URL(req.url);
        const keyParam = searchParams.get('key');

        let doc = null;
        if (user) {
            doc = await db.collection('tenant_documents').findOne({ _id: new ObjectId(id), tenantId: user.tenantId });
        }
        if (!doc && keyParam) {
            doc = await db.collection('tenant_documents').findOne({ _id: new ObjectId(id), secretKey: keyParam });
        }
        if (!doc) {
            return NextResponse.json({ error: user ? 'Document not found.' : 'Unauthorized' }, { status: user ? 404 : 401 });
        }

        // Apply tenant-level branding/letterhead fallback values if not stored on the document itself
        const tenant = await db.collection('tenants').findOne({ tenantId: doc.tenantId });
        if (tenant) {
            if (!doc.brandLogo) doc.brandLogo = tenant.branding?.brandLogo || '';
            if (!doc.signatoryImage) doc.signatoryImage = tenant.branding?.signatoryImage || '';
            if (!doc.letterheadPage1) doc.letterheadPage1 = tenant.branding?.letterheadPage1 || '';
            if (!doc.letterheadPage2) doc.letterheadPage2 = tenant.branding?.letterheadPage2 || '';
            if (doc.useUploadedLetterhead === undefined) {
                doc.useUploadedLetterhead = !!tenant.branding?.useUploadedLetterhead;
            }
        }

        // Build the public view URL for QR code embedding
        const origin = new URL(req.url).origin;
        const viewUrl = doc.status === 'sent' && doc.docNumber && doc.secretKey
            ? `${origin}/cloud/doc/${doc.docNumber}/${doc.secretKey}`
            : null;

        const html = renderDocumentHTML(doc, { viewUrl });

        const browser = await launchPdfBrowser();
        const pg = await browser.newPage();
        await pg.setContent(html, { waitUntil: 'networkidle0' });
        await pg.emulateMediaType('print');

        const useLetterhead = !!doc.useUploadedLetterhead;
        const pdfBuffer = await pg.pdf({
            format: 'A4',
            printBackground: true,
            margin: useLetterhead
                ? { top: 0, right: 0, bottom: 0, left: 0 }
                : { top: '7mm', right: '14mm', bottom: '10mm', left: '12mm' },
        });

        await browser.close();

        const isDownload = searchParams.get('download') === '1';
        return new Response(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="${doc.docType || 'Document'}_${doc.docNumber || 'Draft'}.pdf"`,
            },
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/documents/[id]/pdf') }, { status: 500 });
    }
}
