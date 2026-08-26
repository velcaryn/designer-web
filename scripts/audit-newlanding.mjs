import puppeteer from 'puppeteer';
import path from 'path';

const outDir = '/Users/aru/.gemini/antigravity-ide/brain/9ec0c694-d019-4780-bc2f-4e141d62470b';

async function main() {
    console.log('Auditing http://localhost:4000/newlanding ...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:4000/newlanding', { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Scroll through page to trigger all reveals
    await page.evaluate(async () => {
        const totalHeight = document.body.scrollHeight;
        for (let y = 0; y < totalHeight; y += 400) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 50));
        }
        window.scrollTo(0, 0);
        document.querySelectorAll('.nv-reveal').forEach(el => el.classList.add('is-in'));
    });
    await new Promise(r => setTimeout(r, 1500));

    // Full page desktop screenshot
    await page.screenshot({
        path: path.join(outDir, 'newlanding_full_desktop.png'),
        fullPage: true
    });
    console.log('Saved newlanding_full_desktop.png');

    // Section screenshots
    const sections = await page.$$('section, footer, .nl-marquee-wrapper');
    for (let i = 0; i < sections.length; i++) {
        const el = sections[i];
        const id = await el.evaluate(e => e.id || e.className.split(' ')[0] || `section_${i}`);
        await el.screenshot({
            path: path.join(outDir, `newlanding_${i}_${id.replace(/[^a-zA-Z0-9_-]/g, '_')}.png`)
        });
    }
    console.log(`Saved ${sections.length} section screenshots.`);

    // Mobile viewport screenshot
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:4000/newlanding', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.evaluate(async () => {
        const totalHeight = document.body.scrollHeight;
        for (let y = 0; y < totalHeight; y += 400) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 50));
        }
        window.scrollTo(0, 0);
        document.querySelectorAll('.nv-reveal').forEach(el => el.classList.add('is-in'));
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({
        path: path.join(outDir, 'newlanding_full_mobile.png'),
        fullPage: true
    });
    console.log('Saved newlanding_full_mobile.png');

    await browser.close();
}

main();
