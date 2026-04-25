import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/login');
  await page.waitForTimeout(2000); 
  
  const metrics = await page.evaluate(() => {
    const root = document.getElementById('root');
    const appContent = root.firstElementChild;
    const main = document.getElementById('main-content');
    const pageShell = main?.firstElementChild;
    const authLayout = pageShell?.firstElementChild?.firstElementChild;

    const getMetrics = (el, name) => {
      if (!el) return null;
      return {
        name,
        tagName: el.tagName,
        className: el.className,
        offsetHeight: el.offsetHeight,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        marginTop: getComputedStyle(el).marginTop,
        marginBottom: getComputedStyle(el).marginBottom,
      };
    };

    return [
      getMetrics(root, 'root'),
      getMetrics(appContent, 'appContent'),
      getMetrics(main, 'main'),
      getMetrics(pageShell, 'pageShell'),
      getMetrics(authLayout, 'authLayout'),
      getMetrics(authLayout?.firstElementChild, 'authLayoutChild'),
    ];
  });
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})();
