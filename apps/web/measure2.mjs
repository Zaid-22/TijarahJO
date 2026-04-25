import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/login');
  await page.waitForTimeout(2000); 
  
  const metrics = await page.evaluate(() => {
    const children = Array.from(document.body.children).map(child => ({
      tagName: child.tagName,
      id: child.id,
      className: child.className,
      offsetHeight: child.offsetHeight,
      scrollHeight: child.scrollHeight,
      offsetTop: child.offsetTop,
      marginTop: getComputedStyle(child).marginTop,
      marginBottom: getComputedStyle(child).marginBottom,
      position: getComputedStyle(child).position
    }));
    return {
      bodyStyle: {
        margin: getComputedStyle(document.body).margin,
        padding: getComputedStyle(document.body).padding,
      },
      children
    };
  });
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})();
