import puppeteer from 'puppeteer';
import path from 'path';

const outDir = '/Users/aru/.gemini/antigravity-ide/brain/9ec0c694-d019-4780-bc2f-4e141d62470b';

async function main() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle0' });

    // Force all nv-reveal elements to is-in immediately and wait
    await page.evaluate(() => {
        document.querySelectorAll('.nv-reveal').forEach(el => {
            el.classList.add('is-in');
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    });

    await new Promise(r => setTimeout(r, 1000));

    // Full page desktop
    await page.screenshot({ path: path.join(outDir, 'full_page_desktop_settled.png'), fullPage: true });

    // Capture sections
    const sections = await page.$$('section, .nv-marquee, footer');
    for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const id = await sec.evaluate(el => el.id || el.className.split(' ')[0] || `sec-${i}`);
        await sec.screenshot({ path: path.join(outDir, `settled_${i}_${id}.png`) });
    }

    console.log('Settled screenshots captured.');
    await browser.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
