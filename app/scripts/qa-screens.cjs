/* Visual QA: drive the production preview through the demo narrative. */
const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1600, height: 950 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text().slice(0, 220)}`);
  });

  await page.goto("http://localhost:4173/", { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(9000);
  await page.screenshot({ path: "/tmp/qa-1-explore.png" });

  // Step 2 of the demo: select Belfast via search
  await page.fill('input[aria-label="Search councils and postcode geographies"]', "Belfast");
  await page.waitForTimeout(400);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "/tmp/qa-2-belfast.png" });

  // Theme switch: Access To via KPI card
  await page.click('button.kpi-card:has-text("Access To")');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "/tmp/qa-3-theme.png" });

  // Step 3: Perception vs Provision
  await page.click('nav.mode-nav button:has-text("PERCEPTION VS PROVISION")');
  await page.waitForTimeout(9000);
  await page.screenshot({ path: "/tmp/qa-4-pvp.png" });

  // Understand + Compare
  await page.click('nav.mode-nav button:has-text("UNDERSTAND")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/qa-5-understand.png" });
  await page.evaluate(() => document.querySelector(".overlay-stage")?.scrollTo(0, 1400));
  await page.waitForTimeout(800);
  await page.screenshot({ path: "/tmp/qa-6-understand-charts.png" });

  await page.click('nav.mode-nav button:has-text("COMPARE")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "/tmp/qa-7-compare.png" });

  // Methodology modal
  await page.click('button[aria-label="Data and methodology"]');
  await page.waitForTimeout(600);
  await page.screenshot({ path: "/tmp/qa-8-methodology.png" });

  const uniq = [...new Set(errors)];
  console.log("JS errors (deduped):", uniq.length);
  uniq.slice(0, 15).forEach((e) => console.log(" -", e));
  await browser.close();
})();
