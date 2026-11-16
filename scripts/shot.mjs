// Dev helper: screenshot a URL at several scroll positions. Usage: node scripts/shot.mjs <path> <out-prefix> [w] [h] [scrolls...]
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.env.PW ?? "playwright");
const [, , path = "/", out = "shot", w = "1440", h = "900", ...scrolls] = process.argv;
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto("http://127.0.0.1:5173" + path, { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
const list = scrolls.length ? scrolls.map(Number) : [0];
for (const s of list) {
  await page.evaluate((y) => window.scrollTo(0, y), s);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${out}-${s}.png` });
}
console.log("errors:", errs.slice(0, 8));
await browser.close();
