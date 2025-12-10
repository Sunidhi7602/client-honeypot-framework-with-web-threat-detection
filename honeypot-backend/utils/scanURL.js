const puppeteer = require("puppeteer");

async function scanURL(url) {
    let browser;

    try {
        browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        const scriptCount = await page.evaluate(() =>
            document.querySelectorAll("script").length
        );

        const iframes = await page.evaluate(() =>
            Array.from(document.querySelectorAll("iframe")).map(f => f.src)
        );

        const response = await page.goto(url);
        const status = response.status();
        const redirected = response.url() !== url;

        await browser.close();

        return {
            url,
            scriptCount,
            iframes,
            redirected,
            status,
            scannedAt: new Date(),
        };

    } catch (err) {
        if (browser) await browser.close();
        return { url, error: err.message, scannedAt: new Date() };
    }
}

module.exports = scanURL;
