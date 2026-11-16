// Renders the hero story into numbered frames through /__shoot (dev server must be running).
// Usage: W=1600 H=900 DPR=1.5 N=72 node scripts/shoot-frames.mjs <outDir> [paint]
import { createRequire } from "node:module";
import { mkdirSync, existsSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)(process.env.PW ?? "playwright");
const out = process.argv[2];
const paint = process.argv[3] ?? "carmine";
const W = +(process.env.W ?? 1600), H = +(process.env.H ?? 900), N = +(process.env.N ?? 72), DPR = process.env.DPR ?? "1.5";
const only = process.env.ONLY ? process.env.ONLY.split(",").map(Number) : null;
const base = process.env.DEV_URL ?? "http://127.0.0.1:5173";
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
page.on("pageerror", (e) => console.log("pageerror", e.message));
for (let i = 0; i < N; i++) {
  if (only && !only.includes(i)) continue;
  const file = `${out}/${String(i + 1).padStart(4, "0")}.png`;
  if (process.env.SKIP_EXISTING && existsSync(file)) continue;
  const t0 = Date.now();
  const p = N === 1 ? 0 : i / (N - 1);
  await page.goto(`${base}/__shoot?p=${p}&paint=${paint}&dpr=${DPR}&fov=${process.env.FOV ?? 32}`);
  await page.waitForSelector('#shoot[data-ready="1"]', { timeout: 300000 });
  await page.screenshot({ path: file, timeout: 300000 });
  console.log("frame", i + 1, "/", N, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
