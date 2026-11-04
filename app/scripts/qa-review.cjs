/* Targeted QA for the review-pass fixes. */
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("http://localhost:4174/", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(9000);

  const order = await p.evaluate(() => {
    const v = document.querySelector("arcgis-map").view;
    return v.map.layers.items.map((l) => l.title ?? "selection");
  });
  console.log("layer order bottom→top:", JSON.stringify(order));

  await p.mouse.move(760, 520);
  await p.waitForTimeout(500);
  await p.mouse.move(765, 525);
  await p.waitForTimeout(700);
  const tip = await p.evaluate(
    () => document.querySelector('[role="tooltip"]')?.textContent ?? "NONE",
  );
  console.log("tooltip:", tip);
  await p.screenshot({ path: "/tmp/qc-1-tooltip.png" });

  await p.click('.layer-row:has-text("Greenspace sites") .switch');
  await p.waitForTimeout(800);
  const legendHasContext = await p.evaluate(() =>
    [...document.querySelectorAll(".legend-row")].some((r) =>
      r.textContent.includes("Greenspace site"),
    ),
  );
  console.log("legend context swatch:", legendHasContext);

  await p.click('button[aria-label="Data and methodology"]');
  await p.waitForTimeout(400);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  console.log(
    "esc closes modal:",
    await p.evaluate(() => !document.querySelector(".modal-scrim")),
  );

  await p.fill('input[aria-label="Search councils and postcode geographies"]', "bel");
  await p.waitForTimeout(400);
  await p.keyboard.press("ArrowDown");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(2200);
  await p.screenshot({ path: "/tmp/qc-2-selected.png" });

  await p.click('nav.mode-nav button:has-text("PERCEPTION VS PROVISION")');
  await p.waitForTimeout(8000);
  await p.screenshot({ path: "/tmp/qc-3-pvp.png" });

  console.log("page errors:", errs.length ? errs : "none");
  await b.close();
})();
