#!/usr/bin/env node
/**
 * Transcodes the recorded WebM cuts to H.264 MP4.
 *
 * Playwright records WebM, which is fine on the web and awkward everywhere
 * else — editing suites and ad platforms want H.264. Both are kept: the WebM
 * is the master, the MP4 is what you hand to someone.
 *
 * Skips quietly when ffmpeg is not installed; the WebM files are still usable.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT = resolve(process.cwd(), 'marketing/video');

try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
} catch {
  console.log('ffmpeg niet gevonden — de WebM-bestanden zijn er wel. Sla omzetten over.');
  process.exit(0);
}

const sources = readdirSync(OUT).filter((file) => file.endsWith('.webm'));
for (const source of sources) {
  const target = source.replace(/\.webm$/, '.mp4');
  execFileSync(
    'ffmpeg',
    [
      '-v', 'error',
      '-i', resolve(OUT, source),
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '22',
      '-pix_fmt', 'yuv420p',
      '-vf', 'fps=25',
      '-movflags', '+faststart',
      resolve(OUT, target),
      '-y',
    ],
    { stdio: 'inherit' },
  );
  console.log(`  ✓ ${target}`);
}
