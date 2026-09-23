/**
 * Shared Puppeteer launcher for server-rendered PDFs.
 *
 * Full `puppeteer` bundles its own downloaded Chromium binary, which works
 * fine in local dev but does not survive Netlify's serverless function
 * bundling (the binary is too large / not present on the deployed function's
 * filesystem) - this was the cause of the "internal server error" on every
 * PDF route in production. `@sparticuz/chromium` ships a serverless-sized
 * Chromium build made for exactly this environment, driven via
 * `puppeteer-core` (no bundled browser of its own).
 */
import chromium from '@sparticuz/chromium';

/* The serverless Chromium is a Linux binary. A production build run on a
   laptop (`next start` on macOS) must use full puppeteer instead, so the
   platform is part of the test rather than NODE_ENV alone. */
const IS_SERVERLESS = !!(
    process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    (process.env.NODE_ENV === 'production' && process.platform === 'linux')
);

export async function launchPdfBrowser() {
    if (IS_SERVERLESS) {
        try {
            const puppeteerCore = await import('puppeteer-core');
            const executablePath = await chromium.executablePath();
            return await puppeteerCore.default.launch({
                args: chromium.args,
                executablePath,
                headless: true,
            });
        } catch (err) {
            // Every PDF route funnels through here, and their own catch blocks
            // return a deliberately generic 500 (safeCloudError). Logged here,
            // once, at the source, so the real failure is in the function log.
            console.error('[pdf-browser-launch]', err);
            throw err;
        }
    }
    // Local dev: full puppeteer already has a working Chromium install.
    const puppeteer = await import('puppeteer');
    return puppeteer.default.launch({ headless: 'new', args: ['--no-sandbox'] });
}
