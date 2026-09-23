import { DEFAULT_V2_CONFIG, SECTION_RENDERERS, HEADER_BOX_TYPES, FIELD_KEYS, LOGO_POSITIONS, DEFAULT_LOGO_CONFIG } from '@/lib/templateEngine';

export const VALID_SECTION_IDS = Object.keys(SECTION_RENDERERS);
export const VALID_APPLIES_TO = ['both', 'Invoice', 'Quote'];
export const VALID_ALIGN = ['left', 'center', 'right'];

// Matches the editor's CANVAS_WIDTH_MM - the header canvas is rendered at this width,
// so element bounds are clamped against it here to prevent out-of-bounds configs
// (e.g. submitted directly to the API, bypassing the UI's drag/resize bounds="parent")
// from bleeding past the header container into the body sections below.
const HEADER_WIDTH_MM = 186;

function sanitizeHeaderElements(rawElements, heightMm) {
    const elements = Array.isArray(rawElements) ? rawElements : DEFAULT_V2_CONFIG.header.elements;
    return elements
        .filter(e => e && e.type === 'box' && HEADER_BOX_TYPES.includes(e.boxType))
        .map(e => {
            const w = Math.min(Number.isFinite(e.w) && e.w > 0 ? e.w : 50, HEADER_WIDTH_MM);
            const h = Math.min(Number.isFinite(e.h) && e.h > 0 ? e.h : 30, heightMm);
            const x = Math.max(0, Math.min(Number.isFinite(e.x) ? e.x : 0, HEADER_WIDTH_MM - w));
            const y = Math.max(0, Math.min(Number.isFinite(e.y) ? e.y : 0, heightMm - h));
            return {
                id: String(e.id || e.boxType).slice(0, 60),
                type: 'box',
                boxType: e.boxType,
                x, y, w, h,
                visible: e.visible !== false,
            };
        });
}

// The logo is a single slot bound to the seller box (see templateEngine's sellerBoxContent),
// not a free element - this is what guarantees there's exactly one logo and it never overlaps
// the seller text (flexbox reflows the text around whichever side the logo occupies).
function sanitizeHeaderLogo(rawLogo) {
    const src = (rawLogo && typeof rawLogo === 'object') ? rawLogo : {};
    return {
        position: LOGO_POSITIONS.includes(src.position) ? src.position : DEFAULT_LOGO_CONFIG.position,
        widthMm: Number.isFinite(src.widthMm) ? Math.max(10, Math.min(60, src.widthMm)) : DEFAULT_LOGO_CONFIG.widthMm,
        heightMm: Number.isFinite(src.heightMm) ? Math.max(10, Math.min(60, src.heightMm)) : DEFAULT_LOGO_CONFIG.heightMm,
    };
}

function sanitizeFieldStyles(rawStyles) {
    const src = (rawStyles && typeof rawStyles === 'object') ? rawStyles : {};
    const out = {};
    for (const key of FIELD_KEYS) {
        const s = src[key];
        if (!s || typeof s !== 'object') continue;
        const entry = {};
        if (Number.isFinite(s.fontSize)) entry.fontSize = Math.max(6, Math.min(48, s.fontSize));
        if (VALID_ALIGN.includes(s.align)) entry.align = s.align;
        if (typeof s.bold === 'boolean') entry.bold = s.bold;
        if (Object.keys(entry).length) out[key] = entry;
    }
    return out;
}

/**
 * Whitelists and normalizes a template's config object before it's persisted -
 * shared by the create (POST) and update (PUT) routes so both apply the same rules.
 */
export function sanitizeTemplateConfig(rawConfig) {
    const src = rawConfig || {};
    const sections = Array.isArray(src.sections) ? src.sections : DEFAULT_V2_CONFIG.sections;
    const heightMm = Number.isFinite(src.header?.heightMm) && src.header.heightMm > 0
        ? src.header.heightMm
        : DEFAULT_V2_CONFIG.header.heightMm;
    return {
        schemaVersion: 3,
        isCustomCanvas: src.isCustomCanvas !== false,
        flatCorners: src.flatCorners === true,
        header: {
            heightMm,
            elements: sanitizeHeaderElements(src.header?.elements, heightMm),
            logo: sanitizeHeaderLogo(src.header?.logo),
        },
        sections: sections
            .filter(s => s && VALID_SECTION_IDS.includes(s.id))
            .map(s => ({
                id: s.id,
                visible: s.visible !== false,
                order: Number.isFinite(s.order) ? s.order : 0,
            })),
        fieldStyles: sanitizeFieldStyles(src.fieldStyles),
    };
}
