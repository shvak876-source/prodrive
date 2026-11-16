// Renders stills of the 3D car through the /__render route (dev server must be running).
// Usage: node scripts/render-stills.mjs <shots.json> [outDir]
// shots.json: [{ "name": "hero-carmine", "w": 1600, "h": 1000, "query": "cam=5,1.6,5&paint=carmine" }, ...]
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
const { chromium } = createRequire(import.meta.url)(process.env.PW ?? "playwright");

const shots = JSON.parse(readFileSync(process.argv[2], "utf8"));
const out = resolve(process.argv[3] ?? "public/img");
mkdirSync(out, { recursive: true });
const base = process.env.DEV_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const s of shots) {
  if (process.env.SKIP_EXISTING && existsSync(`${out}/${s.name}.png`)) continue;
  const t0 = Date.now();
  const page = await browser.newPage({ viewport: { width: s.w ?? 1600, height: s.h ?? 1000 } });
  page.on("pageerror", (e) => console.log("pageerror", s.name, e.message));
  await page.goto(`${base}/__render?${s.query}`);
  await page.waitForSelector('#render[data-ready="1"]', { timeout: 120000 });
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => window.__info);
  await page.screenshot({ path: `${out}/${s.name}.png`, omitBackground: s.query.includes("alpha=1"), timeout: 120000 });
  console.log("rendered", s.name, `${((Date.now() - t0) / 1000).toFixed(0)}s`, JSON.stringify(info));
  await page.close();
}
await browser.close();
