/**
 * The VelBiz mark with the name beside it, for the ERP's dark surfaces: the
 * sign-in stage, the dashboard sidebar and the mobile header.
 *
 * Uses public/vb-mark-light.svg, the same white mark the marketing site's
 * footer uses, so the logo is identical everywhere it appears. One height
 * drives everything; the mark's width follows its own aspect ratio.
 */
const MARK_RATIO = 892.87 / 682.46;

export default function VelbizLockup({ height = 28, className = '' }) {
    return (
        <span className={`vbz-lockup ${className}`} style={{ '--vbz-h': `${height}px` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vb-mark-light.svg" alt="" width={Math.round(height * MARK_RATIO)} height={height} />
            <span className="vbz-lockup__name">VelBiz</span>
        </span>
    );
}
