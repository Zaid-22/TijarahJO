import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/login');
  await page.waitForTimeout(2000); // wait for render
  await page.screenshot({ path: 'login_gap.png', fullPage: true });
  await browser.close();
})();
