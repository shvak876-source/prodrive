// Renders every catalog car from the 3D model into public/cars/<id>.png (transparent background).
// Needs the dev server running: npm run dev, then: node scripts/render-thumbs.mjs
import { createRequire } from "node:module";
import { readFileSync, mkdirSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)(process.env.PW ?? "playwright");
const src = readFileSync(new URL("../src/data/cars.ts", import.meta.url), "utf8");
const cars = [...src.matchAll(/id: "([^"]+)".*?body: "(\w+)".*?color: "(#[0-9a-f]{6})"/g)].map(([, id, body, color]) => ({ id, body, color }));
const only = process.argv.slice(2);
mkdirSync(new URL("../public/cars/", import.meta.url), { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 800, height: 500 }, deviceScaleFactor: 2 });
for (const c of cars.filter((c) => !only.length || only.includes(c.id))) {
  await page.goto(`http://127.0.0.1:5173/__render?type=${c.body}&color=${encodeURIComponent(c.color)}`);
  await page.waitForSelector('#render[data-ready="1"]', { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: new URL(`../public/cars/${c.id}.png`, import.meta.url).pathname, omitBackground: true, timeout: 120000 });
  console.log("rendered", c.id);
}
await browser.close();
