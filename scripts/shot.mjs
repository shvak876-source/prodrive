// Dev helper: screenshot a URL at several scroll positions (uses window.scrollTo + waits).
// Usage: node scripts/shot.mjs <path> <out-prefix> [w] [h] [scrolls...]
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.env.PW ?? "playwright");
const [, , path = "/", out = "shot", w = "1440", h = "900", ...scrolls] = process.argv;
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto((process.env.DEV_URL ?? "http://127.0.0.1:5173") + path, { waitUntil: "networkidle" });
await page.waitForTimeout(5000);
for (const s of scrolls.length ? scrolls.map(Number) : [0]) {
  await page.evaluate((y) => window.scrollTo(0, y), s);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}-${s}.png`, timeout: 180000 });
}
console.log("errors:", errs.slice(0, 8));
await browser.close();
