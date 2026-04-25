import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/login');
  await page.waitForTimeout(2000); 
  
  const metrics = await page.evaluate(() => {
    const root = document.getElementById('root');
    const main = document.getElementById('main-content');
    const pageShell = main?.querySelector('.min-h-screen');
    const authLayout = pageShell?.querySelector('.min-h-screen');
    const body = document.body;
    const html = document.documentElement;

    return {
      windowHeight: window.innerHeight,
      htmlHeight: html.scrollHeight,
      bodyHeight: body.scrollHeight,
      rootHeight: root?.offsetHeight,
      mainHeight: main?.offsetHeight,
      pageShellHeight: pageShell?.offsetHeight,
      authLayoutHeight: authLayout?.offsetHeight,
      authLayoutScrollHeight: authLayout?.scrollHeight,
    };
  });
  console.log(metrics);
  await browser.close();
})();
