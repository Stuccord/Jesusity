const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8081';

const VIEWPORTS = [
  { name: 'Mobile 320px', width: 320, height: 568 },
  { name: 'Mobile 360px', width: 360, height: 640 },
  { name: 'Mobile 390px', width: 390, height: 844 },
  { name: 'Mobile 430px', width: 430, height: 932 },
  { name: 'Tablet 768px', width: 768, height: 1024 },
  { name: 'Desktop 1024px', width: 1024, height: 768 },
  { name: 'Desktop 1280px', width: 1280, height: 800 },
  { name: 'Desktop 1440px', width: 1440, height: 900 },
  { name: 'Desktop 1920px', width: 1920, height: 1080 },
  { name: 'Landscape 844x390', width: 844, height: 390 },
  { name: '200% Zoom (1280px)', width: 640, height: 800, deviceScaleFactor: 2 },
];

const PAGES = [
  '/',
  '/shop',
  '/products/valuable-fish-tee-vintage-black',
  '/cart',
  '/checkout',
  '/about',
  '/contact',
  '/faq',
];

async function run() {
  console.log('Starting Responsive & Overflow Verification Suite...');
  const browser = await chromium.launch();
  let totalTests = 0;
  let passedTests = 0;
  const issues = [];

  for (const pagePath of PAGES) {
    const url = `${BASE_URL}${pagePath}`;
    console.log(`\nTesting Page: ${pagePath}`);

    for (const vp of VIEWPORTS) {
      totalTests++;
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor || 1,
      });
      const page = await context.newPage();

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(500); // allow animations/fonts to settle

        const pageResult = await page.evaluate(({ vpWidth }) => {
          const clientWidth = document.documentElement.clientWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          const hasHorizontalOverflow = scrollWidth > clientWidth + 1; // 1px rounding tolerance

          // Find specific overflow offenders
          const overflowingElements = [];
          const allElements = document.querySelectorAll('*');
          for (const el of allElements) {
            // Ignore hidden/script/svg child tags
            if (['SCRIPT', 'STYLE', 'HEAD', 'META', 'TITLE', 'BR'].includes(el.tagName)) continue;
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) continue;
            
            // Check right edge exceeding clientWidth
            if (rect.right > clientWidth + 2) {
              const style = window.getComputedStyle(el);
              if (style.overflow !== 'hidden' && style.display !== 'none' && style.visibility !== 'hidden') {
                overflowingElements.push({
                  tag: el.tagName.toLowerCase(),
                  class: el.className ? (typeof el.className === 'string' ? el.className.slice(0, 50) : '') : '',
                  right: Math.round(rect.right),
                  clientWidth: clientWidth,
                  diff: Math.round(rect.right - clientWidth),
                });
              }
            }
          }

          // Check text < 11px
          const smallTextElements = [];
          for (const el of allElements) {
            if (['SCRIPT', 'STYLE', 'HEAD', 'META', 'TITLE'].includes(el.tagName)) continue;
            if (el.children.length === 0 && el.textContent && el.textContent.trim().length > 0) {
              const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
              if (fontSize < 10.9 && fontSize > 0) {
                smallTextElements.push({
                  tag: el.tagName.toLowerCase(),
                  text: el.textContent.trim().slice(0, 30),
                  size: fontSize,
                });
              }
            }
          }

          return {
            clientWidth,
            scrollWidth,
            hasHorizontalOverflow,
            overflowingCount: overflowingElements.length,
            overflowingElements: overflowingElements.slice(0, 5),
            smallTextCount: smallTextElements.length,
            smallTextElements: smallTextElements.slice(0, 3),
          };
        }, { vpWidth: vp.width });

        if (!pageResult.hasHorizontalOverflow && pageResult.overflowingCount === 0 && pageResult.smallTextCount === 0) {
          passedTests++;
          process.stdout.write(`  ✓ ${vp.name.padEnd(20)} [${pageResult.clientWidth}px]\n`);
        } else {
          const errs = [];
          if (pageResult.hasHorizontalOverflow) {
            errs.push(`scrollWidth (${pageResult.scrollWidth}) > clientWidth (${pageResult.clientWidth})`);
          }
          if (pageResult.overflowingCount > 0) {
            errs.push(`${pageResult.overflowingCount} overflowing element(s): ${JSON.stringify(pageResult.overflowingElements)}`);
          }
          if (pageResult.smallTextCount > 0) {
            errs.push(`${pageResult.smallTextCount} text node(s) < 11px: ${JSON.stringify(pageResult.smallTextElements)}`);
          }
          console.log(`  ✗ ${vp.name.padEnd(20)}: ${errs.join('; ')}`);
          issues.push({ page: pagePath, viewport: vp.name, errors: errs });
        }
      } catch (err) {
        console.log(`  ✗ ${vp.name.padEnd(20)}: Error loading - ${err.message}`);
        issues.push({ page: pagePath, viewport: vp.name, errors: [err.message] });
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();

  console.log(`\n========================================`);
  console.log(`Verification Summary: ${passedTests} / ${totalTests} passed`);
  if (issues.length > 0) {
    console.log(`Issues found (${issues.length}):`);
    for (const issue of issues) {
      console.log(`- [${issue.page}] @ ${issue.viewport}: ${issue.errors.join(' | ')}`);
    }
  } else {
    console.log(`ALL VIEWPORTS AND PAGES PASSED PERFECTLY! NO HORIZONTAL OVERFLOW DETECTED.`);
  }
  console.log(`========================================\n`);

  process.exit(issues.length === 0 ? 0 : 1);
}

run();
