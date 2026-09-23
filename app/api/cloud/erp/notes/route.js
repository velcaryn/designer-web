import { NextResponse } from 'next/server';
import { getCloudDb, getCloudUser, safeCloudError } from '@/lib/cloudAuth';
import { generateErpNumber, sanitizeStr, paginationFromParams, escapeRegex } from '@/lib/erpHelpers';
import { permissionDenied } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const VALID_LINK_TYPES = ['client', 'lead', 'opportunity', 'document', 'order', 'vendor'];

/**
 * GET /api/cloud/erp/notes
 */
export async function GET(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const { searchParams } = new URL(req.url);
        const linkedType = searchParams.get('linkedType');
        const linkedId = searchParams.get('linkedId');
        const pinned = searchParams.get('pinned');
        const search = searchParams.get('q');
        const { skip, limit, page } = paginationFromParams(searchParams);

        const db = await getCloudDb();
        const filter = { tenantId: user.tenantId };

        if (linkedType && linkedId) {
            filter['links'] = { $elemMatch: { type: linkedType, id: linkedId } };
        }
        if (pinned === 'true') filter.isPinned = true;
        if (search) {
            const safeSearch = escapeRegex(search);
            filter.$or = [
                { title: { $regex: safeSearch, $options: 'i' } },
                { body: { $regex: safeSearch, $options: 'i' } },
            ];
        }

        const [notes, total] = await Promise.all([
            db.collection('erp_notes')
                .find(filter)
                .sort({ isPinned: -1, updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray(),
            db.collection('erp_notes').countDocuments(filter),
        ]);

        return NextResponse.json({
            notes: notes.map(n => ({ ...n, _id: n._id.toString() })),
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'GET /api/cloud/erp/notes') }, { status: 500 });
    }
}

/**
 * POST /api/cloud/erp/notes
 */
export async function POST(req) {
    try {
        const user = await getCloudUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const denied = permissionDenied(user, 'crm');
        if (denied) return denied;

        const body = await req.json();
        const title = sanitizeStr(body.title, 300);
        if (!title) return NextResponse.json({ error: 'Note title is required.' }, { status: 400 });

        const db = await getCloudDb();
        const noteNumber = await generateErpNumber(user.tenantId, 'note');
        const now = new Date();

        // Sanitize links array
        const links = Array.isArray(body.links)
            ? body.links.slice(0, 10).filter(l =>
                l && VALID_LINK_TYPES.includes(l.type) && l.id
            ).map(l => ({
                type: sanitizeStr(l.type, 30),
                id: sanitizeStr(l.id, 50),
                label: sanitizeStr(l.label, 200) || '',
            }))
            : [];

        const note = {
            tenantId: user.tenantId,
            noteNumber,
            title,
            body: sanitizeStr(body.body, 50000) || '',
            links,
            createdByEmail: user.email,
            createdByName: user.businessName || user.email,
            lastEditedByEmail: user.email,
            isPinned: !!body.isPinned,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('erp_notes').insertOne(note);

        return NextResponse.json({
            success: true,
            _id: result.insertedId.toString(),
            noteNumber,
        }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: safeCloudError(err, 'POST /api/cloud/erp/notes') }, { status: 500 });
    }
}
