/**
 * The link preview card, generated at build time.
 *
 * Next's file convention: an `opengraph-image` in the app root emits the
 * `og:image` tags for every route that does not override them. There was
 * no image at all before this, so a link shared to WhatsApp, LinkedIn or
 * Slack rendered as a bare title and URL, which for a studio that sells
 * websites is the worst possible first impression.
 *
 * Drawn rather than shipped as a file so it cannot drift from the brand:
 * it uses the same three locked colours and the same hard 6px offset
 * shadow as the site itself. `next/og` runs a very small subset of CSS
 * (flexbox only, no grid, every element needs an explicit `display`), so
 * this is deliberately plainer markup than the real page.
 *
 * It uses the renderer's own bundled face rather than loading Fraunces
 * or Inter. Fetching a font at build time makes the build depend on the
 * network, and shipping a woff2 purely for this one image is weight for
 * a card most people see at thumbnail size. The type here is doing a
 * different job from the type on the page.
 */
import { ImageResponse } from 'next/og';
import { brand } from '@/config/site';

export const alt = `${brand.name}: ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/* The three locked brand colours, written literally because the OG
   renderer has no access to the stylesheet's custom properties. Keep in
   step with the token block at the top of app/globals.css. */
const INK = '#0a0a0c';
const PAPER = '#faf8f7';
const FILL = '#0066cc';

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: PAPER,
                    padding: 72,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 64,
                            height: 64,
                            background: FILL,
                            border: `4px solid ${INK}`,
                            borderRadius: 20,
                            boxShadow: `6px 6px 0 ${INK}`,
                        }}
                    >
                        {/* The real mark, not the letters "VB" set in a
                            fallback face, which is what this was. next/og
                            renders inline SVG, so the same path the site
                            uses can be drawn here rather than approximated.
                            Kept in step with public/vb-mark.svg. */}
                        <svg
                            width="29"
                            height="22"
                            viewBox="88.16 206.08 892.87 682.46"
                            fill="none"
                        >
                            <path fill={PAPER} fillRule="evenodd" d="M216.5 219.85C221.58 227.77 223.37 238.73 226.92 247.51C236.02 270.08 243.73 293.24 252.57 315.92C281.56 390.29 308.95 465.26 337.83 539.67C347.26 563.96 356.49 588.34 365.8 612.67C368.84 620.6 374.68 640.47 379.5 646.1C385.03 638.79 388.59 629.29 392.54 621.03C399.63 606.17 407.05 591.49 414.17 576.65C437.22 528.59 460.32 480.39 484.35 432.81C493.13 415.44 500.87 397.54 509.7 380.19C511.59 376.49 515.69 364.31 518.85 362.36C521.17 360.92 524.89 361.59 527.5 361.59C534.16 361.6 540.83 361.58 547.49 361.53C563.83 361.38 580.16 361.51 596.5 361.46C605.79 361.42 615.23 360.93 624.5 361.56C624.51 366.12 621.4 370.65 619.31 374.77C614.7 383.87 610.16 393.05 605.77 402.27C590.79 433.76 575.15 464.95 559.72 496.23C517.1 582.64 474.02 668.86 432.2 755.67C419.11 782.85 406.05 810.05 392.53 837.02C387.63 846.79 379.96 867.06 373.5 874.46C369.21 869.44 367.3 861.84 364.67 855.77C359.22 843.23 353.86 830.67 348.37 818.15C327.92 771.59 308.33 724.65 288.63 677.79C245.47 575.1 202.65 472.29 160.27 369.27C146.64 336.14 133.31 302.91 119.67 269.79C115.11 258.7 110.71 247.53 106.16 236.43C104.04 231.27 101.2 225.99 100.16 220.5C107.58 218.08 131.34 219.5 140.5 219.54C155.83 219.61 171.17 219.63 186.5 219.63C196.44 219.63 206.61 218.91 216.5 219.85ZM868.34 533.5C871.64 536.95 877.79 538.37 882.19 540.36C889.08 543.46 895.65 547.35 901.91 551.57C923.06 565.81 939.48 586.14 950.42 609.08C962.97 635.42 969.03 671.56 966.21 700.5C964.08 722.44 960.89 743.53 952.58 764.13C946.85 778.35 939.16 792.14 929.8 804.29C922.03 814.39 913.06 823.64 903.3 831.84C854.25 873 792.46 875.89 731.5 875.7C711.17 875.64 690.83 875.69 670.5 875.56C634.5 875.31 598.5 875.68 562.5 875.64C528.5 875.6 494.5 875.67 460.5 875.76C450.17 875.79 439.83 875.87 429.5 875.82C424.67 875.8 419.07 876.54 414.5 875.09C477.5 746.41 540.5 617.73 603.5 489.05C608.53 487.72 614.29 488.52 619.5 488.55C628.53 488.6 637.56 488.5 646.59 488.51C670.89 488.53 695.2 488.49 719.5 488.51C755.32 488.54 795.84 490.38 819.58 458.08C823.78 452.37 827.27 445.96 829.83 439.37C832.82 431.65 834.63 423.78 835.4 415.55C836.63 402.48 836.13 389.41 832.75 376.65C826.36 352.56 807.35 332.26 783.12 325.46C766.94 320.92 750.18 320.99 733.5 321C681.83 321.03 630.17 321.1 578.5 321.05C560.83 321.04 543.17 321.03 525.5 321.05C516.55 321.06 506.63 319.79 497.87 321.5C458.79 400.56 419.71 479.62 380.63 558.68C380.63 445.64 380.63 332.6 380.63 219.57C416.16 218.31 451.95 219.39 487.5 219.46C549.16 219.57 610.84 219.74 672.5 219.54C694.83 219.47 717.17 219.44 739.5 219.65C777.18 220 814.98 221.8 849.83 237.65C916.18 267.8 949.52 330.86 947.75 402.5C947.18 425.49 942.21 449.52 931.53 470.04C922.18 488 909.95 504.84 893.78 517.3C885.73 523.5 876.69 527.91 868.34 533.5ZM602.02 774.87C611.74 775.9 621.72 775.34 631.5 775.32C647.83 775.27 664.17 775.25 680.5 775.3C693.17 775.34 705.83 775.3 718.5 775.36C762.54 775.55 813.66 778.42 839.69 735.22C843.45 728.98 846.75 722.42 848.85 715.42C852.07 704.7 853.26 693.67 853.32 682.5C853.38 671.79 852.25 660.76 848.94 650.53C845.94 641.25 842.09 632.11 836.37 624.15C809.75 587.05 763 589.21 722.5 589.23C709.5 589.24 696.5 589.26 683.5 589.25C665.83 589.23 648.17 589.25 630.5 589.23C621.34 589.23 610.97 587.98 602.02 589.89C602.02 651.55 602.02 713.21 602.02 774.87Z" />
                        </svg>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 30,
                            fontWeight: 800,
                            color: INK,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        {brand.name}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 82,
                            fontWeight: 700,
                            color: INK,
                            lineHeight: 1.05,
                            letterSpacing: '-0.03em',
                        }}
                    >
                        Grow your brand.
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 82,
                            fontWeight: 700,
                            color: FILL,
                            lineHeight: 1.05,
                            letterSpacing: '-0.03em',
                        }}
                    >
                        Grow your business.
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', fontSize: 26, color: '#4a4a52' }}>
                        Websites, SEO, and one place to run the orders.
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            padding: '14px 28px',
                            background: INK,
                            borderRadius: 999,
                            color: PAPER,
                            fontSize: 24,
                            fontWeight: 700,
                        }}
                    >
                        {brand.domain}
                    </div>
                </div>
            </div>
        ),
        size,
    );
}
