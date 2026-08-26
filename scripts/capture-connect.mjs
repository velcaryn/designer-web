import puppeteer from 'puppeteer';
import path from 'path';

const outPath = '/Users/aru/.gemini/antigravity/scratch/designer-web/public/connect-desktop.webp';

async function main() {
    console.log('Capturing Velcaryn Connect screenshot...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    try {
        await page.goto('https://velcaryn.com/connect/', { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: outPath, type: 'webp', quality: 90 });
        console.log('Saved connect-desktop.webp successfully.');
    } catch (e) {
        console.error('Failed to capture live URL:', e.message);
    } finally {
        await browser.close();
    }
}

main();
