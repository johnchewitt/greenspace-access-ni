/* QA for the Stage 3 brief features. */
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("http://localhost:4178/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(9000);

  // Insights
  await p.click('nav.mode-nav button:has-text("INSIGHTS")');
  await p.waitForTimeout(2500);
  await p.screenshot({ path: "/tmp/qg-1-insights.png" });

  // Story: open, step through chapters
  await p.click('nav.mode-nav button:has-text("STORY")');
  await p.waitForTimeout(2500);
  await p.screenshot({ path: "/tmp/qg-2-story-ch1.png" });
  await p.click(".story-controls button.primary");
  await p.waitForTimeout(2500);
  await p.screenshot({ path: "/tmp/qg-3-story-ch2.png" });
  for (let i = 0; i < 4; i++) {
    await p.click(".story-controls button.primary");
    await p.waitForTimeout(1500);
  }
  await p.screenshot({ path: "/tmp/qg-4-story-ch6.png" });
  // exit via final CTA
  await p.click(".story-controls button.primary");
  await p.waitForTimeout(1500);
  const backToExplore = await p.evaluate(() =>
    !!document.querySelector(".kpi-strip"));
  console.log("story exit returns to explore:", backToExplore);

  // PvP evidence drawer
  await p.click('nav.mode-nav button:has-text("PERCEPTION VS PROVISION")');
  await p.waitForTimeout(7000);
  const drawer = await p.evaluate(() => document.querySelector(".evidence-drawer")?.className ?? "none");
  console.log("drawer present:", drawer);
  const handle = await p.$(".drawer-handle");
  if (handle) {
    await handle.click();
    await p.waitForTimeout(2000);
    await p.screenshot({ path: "/tmp/qg-5-quadrant.png" });
    // click first enabled quadrant button
    await p.click(".quadrant-buttons button:not([disabled])");
    await p.waitForTimeout(1500);
    await p.screenshot({ path: "/tmp/qg-6-quadrant-filter.png" });
  }

  // threshold switcher (SDZ off → turn on, switch to 1km)
  const sw = await p.$('.pvp-panel.right .switch');
  if (sw) {
    await sw.click();
    await p.waitForTimeout(1200);
    const btn = await p.$('.pvp-panel.right .format-toggle button:has-text("1 km")');
    if (btn) { await btn.click(); await p.waitForTimeout(800); }
    const sdzField = await p.evaluate(() => {
      const maps = [...document.querySelectorAll("arcgis-map")];
      const v = maps[1]?.view;
      const l = v?.map.layers.items.find((x) => x.title?.includes("Super Data Zones"));
      return l?.renderer?.field ?? "none";
    });
    console.log("sdz renderer field after switch:", sdzField);
  }

  // Compare: two-council section
  await p.click('nav.mode-nav button:has-text("COMPARE")');
  await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector(".overlay-stage")?.scrollTo(0, 99999));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: "/tmp/qg-7-twocouncils.png" });

  // Understand: PfG card + theme card buttons
  await p.click('nav.mode-nav button:has-text("UNDERSTAND")');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: "/tmp/qg-8-understand-cards.png" });

  console.log("page errors:", errs.length ? [...new Set(errs)] : "none");
  await b.close();
})();
