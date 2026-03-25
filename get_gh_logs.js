const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("https://github.com/Zaid-22/TijarahJO/actions/runs/23515846538/job/68447970835", { waitUntil: 'networkidle' });
  
  // Wait for the logs container to appear
  await page.waitForSelector('.log-line', { timeout: 10000 }).catch(() => console.log('Timeout waiting for .log-line'));
  
  const text = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync('gh_logs.txt', text);
  await browser.close();
})();
