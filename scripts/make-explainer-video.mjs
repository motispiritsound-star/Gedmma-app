/**
 * Renders the Buurklus explainer to an MP4.
 *
 * The scene in scripts/explainer/ draws itself from one number — the time in
 * milliseconds — so this walks that number forward a frame at a time and takes
 * a picture of each. Nothing is captured in real time, which means a slow
 * machine produces the same file as a fast one and no frame is ever dropped.
 *
 * ffmpeg comes from the imageio-ffmpeg wheel rather than the system, because
 * the system package is not installable in every environment this runs in.
 *
 *   node scripts/make-explainer-video.mjs            # both formats
 *   node scripts/make-explainer-video.mjs square     # just one
 */
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { createRequire } from 'node:module';

const run = promisify(execFile);
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SCENE = path.join(ROOT, 'scripts/explainer');
const OUT = path.join(ROOT, 'marketing/video');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const FPS = 30;

/**
 * The two cuts that cover social media. `unit` scales the whole composition:
 * the scene is one design expressed at two sizes, not two layouts.
 */
const FORMATS = {
  square: { width: 1080, height: 1080, unit: 1.2, label: '1:1 — feed' },
  vertical: { width: 1080, height: 1920, unit: 1.85, label: '9:16 — stories and reels' },
};

async function ffmpegPath() {
  const { stdout } = await run('python3', [
    '-c',
    'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())',
  ]);
  return stdout.trim();
}

async function renderFormat(browser, name, format, sceneHtml, ffmpeg) {
  const frames = await mkdtemp(path.join(tmpdir(), `buurklus-${name}-`));

  const context = await browser.newContext({
    viewport: { width: format.width, height: format.height },
    deviceScaleFactor: 1,
    // Any animation the scene did not ask for would smear across frames that
    // are captured out of real time.
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => {
    throw error;
  });

  await page.setContent(sceneHtml, { waitUntil: 'load' });
  await page.addStyleTag({ content: `:root { --u: ${format.unit}px; }` });
  await page.evaluate(() => window.scene.build('nl'));
  await page.evaluate(() => document.fonts.ready);

  const duration = await page.evaluate(() => window.scene.duration);
  const total = Math.round((duration / 1000) * FPS);

  for (let frame = 0; frame < total; frame += 1) {
    const t = (frame / FPS) * 1000;
    await page.evaluate((at) => window.scene.render(at), t);
    await page.screenshot({
      path: path.join(frames, `${String(frame).padStart(5, '0')}.png`),
      type: 'png',
    });
    if (frame % 60 === 0) {
      process.stdout.write(`\r  ${name}: frame ${frame}/${total}`);
    }
  }
  process.stdout.write(`\r  ${name}: ${total} frames rendered\n`);
  await context.close();

  await mkdir(OUT, { recursive: true });
  const file = path.join(OUT, `buurklus-${name}.mp4`);

  await run(ffmpeg, [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(frames, '%05d.png'),
    // yuv420p and even dimensions: without both, the file plays on a desktop
    // and shows a black rectangle in half the phone apps it is posted to.
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-preset', 'slow',
    '-crf', '20',
    // A keyframe every second, so scrubbing and autoplay start cleanly.
    '-g', String(FPS),
    '-movflags', '+faststart',
    file,
  ]);

  await rm(frames, { recursive: true, force: true });

  const bytes = (await readFile(file)).length;
  console.log(
    `  ${path.relative(ROOT, file)}  ${format.width}×${format.height}  ${(duration / 1000).toFixed(1)}s  ${(bytes / 1024 / 1024).toFixed(1)} MB  (${format.label})`,
  );
  return file;
}

async function main() {
  const wanted = process.argv.slice(2);
  const formats = Object.entries(FORMATS).filter(
    ([name]) => wanted.length === 0 || wanted.includes(name),
  );
  if (formats.length === 0) {
    throw new Error(`Unknown format. Choose from: ${Object.keys(FORMATS).join(', ')}`);
  }

  const ffmpeg = await ffmpegPath();

  // The scene is assembled into one self-contained document: the font inlined
  // as a data URI and the script inlined too, so nothing is fetched while the
  // frames are being drawn.
  const font = await readFile(path.join(ROOT, 'apps/web/public/fonts/inter-latin.woff2'));
  const script = await readFile(path.join(SCENE, 'scene.js'), 'utf8');
  let html = await readFile(path.join(SCENE, 'scene.html'), 'utf8');
  html = html
    .replace('__FONT__', `data:font/woff2;base64,${font.toString('base64')}`)
    .replace('<script src="scene.js"></script>', `<script>${script}</script>`);

  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const [name, format] of formats) {
      await renderFormat(browser, name, format, html, ffmpeg);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
