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

    // Scroll through page to trigger all IntersectionObservers
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    window.scrollTo(0, 0);
                    setTimeout(resolve, 500);
                }
            }, 50);
        });
    });

    await new Promise(r => setTimeout(r, 1000));

    // Full page desktop screenshot after scroll triggers
    await page.screenshot({ path: path.join(outDir, 'full_page_desktop_scrolled.png'), fullPage: true });

    // Capture individual section screenshots for granular UI/UX review
    const sections = await page.$$('section, .nv-marquee, footer');
    for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const id = await sec.evaluate(el => el.id || el.className.split(' ')[0] || `sec-${i}`);
        await sec.screenshot({ path: path.join(outDir, `section_${i}_${id}.png`) });
    }

    console.log('Audited and captured all individual sections.');
    await browser.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
