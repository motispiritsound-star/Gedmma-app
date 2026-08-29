/**
 * Renders the Buurklus explainer to an MP4.
 *
 * The scene in scripts/explainer/ draws itself from one number — the time in
 * milliseconds — so this walks that number forward a frame at a time and takes
 * a picture of each. Nothing is captured in real time, which means a slow
 * machine produces the same file as a fast one and no frame is ever dropped.
 *
 * The picture is silent when it comes out of the browser. The soundtrack is
 * composed separately by scripts/explainer/music.py and muxed in here, together
 * with an English subtitle track that a viewer can switch on: the video itself
 * is Dutch, and a second cut of the whole thing just to translate nine lines of
 * text would be two files to keep in step for no reason.
 *
 * ffmpeg comes from the imageio-ffmpeg wheel rather than the system, because
 * the system package is not installable in every environment this runs in.
 *
 *   node scripts/make-explainer-video.mjs            # both formats
 *   node scripts/make-explainer-video.mjs square     # just one
 */
import { execFile } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
/**
 * The home page carries the square cut, so that one file — with its poster and
 * its subtitle track — is copied into the site as well. The vertical cut stays
 * in marketing/ only: nothing links to it, and seven megabytes shipped with
 * every deploy for a file no page references is waste.
 */
const SITE = path.join(ROOT, 'apps/web/public');
const ON_SITE = 'square';
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

/**
 * Turns the subtitle track off by default, by editing the MP4 directly.
 *
 * ffmpeg's `-disposition:s:0 none` is accepted and then ignored by the MP4
 * muxer, which writes every track header with flags 0x3 — enabled, and in the
 * presentation. A player reading that shows the captions straight away, which
 * is the opposite of the point: the picture is Dutch, and the English track is
 * there for whoever wants it.
 *
 * Clearing bit 0 leaves flags 0x2: the track is in the file and in the
 * presentation, but not enabled. That is exactly how an off-by-default track
 * is expressed in ISO/IEC 14496-12, and it is a two-byte change.
 */
function disableSubtitleByDefault(file) {
  const buffer = readFileSync(file);

  /** Walks the boxes at one level, calling back with each. */
  const walk = (start, end, visit) => {
    let at = start;
    while (at + 8 <= end) {
      const size = buffer.readUInt32BE(at);
      const type = buffer.toString('latin1', at + 4, at + 8);
      // size 1 means the real size is a 64-bit value that follows; size 0
      // means "to the end of the file".
      const length = size === 0 ? end - at : size === 1 ? Number(buffer.readBigUInt64BE(at + 8)) : size;
      if (length < 8) break;
      visit(type, at, at + length);
      at += length;
    }
  };

  let patched = 0;

  walk(0, buffer.length, (type, start, end) => {
    if (type !== 'moov') return;
    walk(start + 8, end, (boxType, trakStart, trakEnd) => {
      if (boxType !== 'trak') return;

      let flagsAt = -1;
      let handler = '';

      walk(trakStart + 8, trakEnd, (child, childStart, childEnd) => {
        if (child === 'tkhd') {
          // version(1) then flags(3), straight after the box header.
          flagsAt = childStart + 9;
        }
        if (child === 'mdia') {
          walk(childStart + 8, childEnd, (grandchild, hdlrStart) => {
            if (grandchild !== 'hdlr') return;
            // version(1) flags(3) pre_defined(4) handler_type(4)
            handler = buffer.toString('latin1', hdlrStart + 16, hdlrStart + 20);
          });
        }
      });

      if (flagsAt >= 0 && (handler === 'sbtl' || handler === 'text')) {
        const flags = (buffer[flagsAt] << 16) | (buffer[flagsAt + 1] << 8) | buffer[flagsAt + 2];
        const cleared = flags & ~0x1;
        buffer[flagsAt] = (cleared >> 16) & 0xff;
        buffer[flagsAt + 1] = (cleared >> 8) & 0xff;
        buffer[flagsAt + 2] = cleared & 0xff;
        patched += 1;
      }
    });
  });

  if (patched !== 1) {
    throw new Error(`Expected one subtitle track to switch off, found ${patched}`);
  }
  writeFileSync(file, buffer);
}

/** Refuses to ship a file that is not the length it should be. */
async function assertDuration(ffmpeg, file, expected) {
  // ffprobe is not in the imageio wheel, so the duration is read from what
  // ffmpeg prints when it opens the file.
  const { stderr } = await run(ffmpeg, ['-i', file, '-f', 'null', '-'], { encoding: 'utf8' }).catch(
    (error) => error,
  );
  const match = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(stderr ?? '');
  if (!match) throw new Error(`Could not read the duration of ${file}`);

  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  if (Math.abs(seconds - expected) > 0.15) {
    throw new Error(`${path.basename(file)} is ${seconds}s, expected ${expected}s`);
  }
}

/**
 * Copies the cut the website uses into apps/web/public, with a poster frame and
 * a WebVTT track beside it.
 *
 * The poster is taken from the moment the choice is made rather than from the
 * first frame: frame zero is an empty green field, and a play button floating
 * on nothing tells a visitor nothing about what they are about to watch.
 */
async function publishToSite(ffmpeg, file, srtPath) {
  const dir = path.join(SITE, 'video');
  await mkdir(dir, { recursive: true });

  await copyFile(file, path.join(dir, 'buurklus.mp4'));
  await copyFile(srtPath.replace(/\.srt$/, '.vtt'), path.join(dir, 'buurklus-en.vtt'));

  await run(ffmpeg, [
    '-y',
    '-ss', '16.4',
    '-i', file,
    '-frames:v', '1',
    '-q:v', '4',
    path.join(dir, 'buurklus-poster.jpg'),
  ]);

  const poster = (await readFile(path.join(dir, 'buurklus-poster.jpg'))).length;
  console.log(`  apps/web/public/video/  mp4, poster (${(poster / 1024).toFixed(0)} kB) and vtt`);
}

/** Seconds as SRT wants them: 00:00:03,250 */
function srtTime(seconds) {
  const ms = Math.round(seconds * 1000);
  const h = String(Math.floor(ms / 3_600_000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3_600_000) / 60_000)).padStart(2, '0');
  const s = String(Math.floor((ms % 60_000) / 1000)).padStart(2, '0');
  return `${h}:${m}:${s},${String(ms % 1000).padStart(3, '0')}`;
}

/**
 * Writes the subtitle track twice: SRT for the platforms that take an upload
 * alongside the video, and WebVTT for the `<track>` element on the website.
 * They differ in the separator between the timestamps and almost nothing else,
 * which is exactly why they are generated from one list rather than kept as two
 * files somebody has to remember to edit together.
 */
async function writeSubtitles(cues, dir) {
  await mkdir(dir, { recursive: true });

  const srt = cues
    .map(
      (cue, index) =>
        `${index + 1}\n${srtTime(cue.from)} --> ${srtTime(cue.to)}\n${cue.text}\n`,
    )
    .join('\n');

  const vtt = `WEBVTT\n\n${cues
    .map(
      (cue) =>
        `${srtTime(cue.from).replace(',', '.')} --> ${srtTime(cue.to).replace(',', '.')}\n${cue.text}\n`,
    )
    .join('\n')}`;

  const srtPath = path.join(dir, 'buurklus-en.srt');
  const vttPath = path.join(dir, 'buurklus-en.vtt');
  await writeFile(srtPath, srt, 'utf8');
  await writeFile(vttPath, vtt, 'utf8');
  return { srtPath, vttPath };
}

/** Fails loudly if a cue would still be on screen when the next one starts. */
function checkCues(cues) {
  for (let i = 0; i < cues.length; i += 1) {
    const cue = cues[i];
    if (cue.to <= cue.from) throw new Error(`Subtitle ${i + 1} ends before it starts`);
    const next = cues[i + 1];
    if (next && cue.to > next.from) {
      throw new Error(`Subtitle ${i + 1} overlaps ${i + 2} (${cue.to}s > ${next.from}s)`);
    }
  }
}

async function ffmpegPath() {
  const { stdout } = await run('python3', [
    '-c',
    'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())',
  ]);
  return stdout.trim();
}

async function renderFormat(browser, name, format, sceneHtml, ffmpeg, audio, subtitles) {
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
    '-i', audio,
    '-i', subtitles,
    // yuv420p and even dimensions: without both, the file plays on a desktop
    // and shows a black rectangle in half the phone apps it is posted to.
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-preset', 'slow',
    '-crf', '20',
    // A keyframe every second, so scrubbing and autoplay start cleanly.
    '-g', String(FPS),
    '-c:a', 'aac',
    '-b:a', '160k',
    '-ar', '44100',
    // mov_text is the only subtitle format an MP4 carries, and the only one
    // a phone's player will offer as a toggle.
    '-c:s', 'mov_text',
    '-metadata:s:s:0', 'language=eng',
    '-metadata:s:s:0', 'title=English',
    // No -shortest here. It looks like insurance against a rounding
    // difference between the picture and the sound, but the subtitle stream
    // counts as a stream too: its last cue ends at 24.6 s, so -shortest cut
    // four tenths of a second off the end card. The picture and the audio are
    // both exactly 25 s by construction, and the check below proves it.
    '-movflags', '+faststart',
    file,
  ]);

  await rm(frames, { recursive: true, force: true });

  disableSubtitleByDefault(file);
  await assertDuration(ffmpeg, file, duration / 1000);

  if (name === ON_SITE) {
    await publishToSite(ffmpeg, file, subtitles);
  }

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

  const subtitleSource = JSON.parse(
    await readFile(path.join(SCENE, 'subtitles.en.json'), 'utf8'),
  );
  checkCues(subtitleSource.cues);
  const { srtPath, vttPath } = await writeSubtitles(subtitleSource.cues, path.join(ROOT, 'marketing/subtitles'));
  console.log(`  ${path.relative(ROOT, srtPath)} and .vtt  ${subtitleSource.cues.length} cues`);

  // Composed by scripts/explainer/music.py. Built here if it is missing, so
  // one command still produces a finished file from a fresh checkout.
  const audio = path.join(ROOT, 'marketing/audio/buurklus-theme.wav');
  try {
    await readFile(audio);
  } catch {
    console.log('  composing the soundtrack…');
    await run('python3', [path.join(SCENE, 'music.py'), audio]);
  }

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
      await renderFormat(browser, name, format, html, ffmpeg, audio, srtPath);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
