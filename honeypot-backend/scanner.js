const puppeteer = require("puppeteer");

async function scanURL(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let result = {
    url,
    scripts: 0,
    iframes: 0,
    redirects: [],
  };

  page.on("response", (response) => {
    if (response.status() >= 300 && response.status() < 400) {
      result.redirects.push(response.url());
    }
  });

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Count scripts
    const scripts = await page.$$eval("script", (tags) => tags.length);
    result.scripts = scripts;

    // Count hidden iframes
    const iframes = await page.$$eval("iframe", (tags) =>
      tags.filter((f) => f.style.display === "none" || f.style.visibility === "hidden").length
    );
    result.iframes = iframes;

  } catch (err) {
    console.log("Scan error:", err.message);
  }

  await browser.close();
  return result;
}

module.exports = scanURL;
