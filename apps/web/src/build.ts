import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SUPPORTED_LOCALES } from '@buurklus/shared';
import {
  renderHome,
  renderPro,
  renderRobots,
  renderRootRedirect,
  renderSitemap,
  renderStyles,
} from './render.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', 'dist');
const PUBLIC = path.resolve(here, '..', 'public');

/**
 * Copies public/ verbatim into the build. The self-hosted fonts live there:
 * if this step is skipped the pages fall back to a system face rather than
 * quietly reaching out to Google, which is the failure mode we want.
 */
async function copyPublic() {
  await cp(PUBLIC, OUT, { recursive: true });

  const copied: { relative: string; bytes: number }[] = [];
  const walk = async (dir: string) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else copied.push({ relative: path.relative(PUBLIC, full), bytes: (await stat(full)).size });
    }
  };
  await walk(PUBLIC);
  return copied;
}

async function write(relative: string, contents: string) {
  const target = path.join(OUT, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, 'utf8');
  return { relative, bytes: Buffer.byteLength(contents) };
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const written = [
    ...(await copyPublic()),
    await write('index.html', renderRootRedirect()),
    await write('styles.css', renderStyles()),
    await write('robots.txt', renderRobots()),
    await write('sitemap.xml', renderSitemap()),
  ];

  for (const locale of SUPPORTED_LOCALES) {
    written.push(await write(`${locale}/index.html`, renderHome(locale)));
    written.push(await write(`${locale}/pro/index.html`, renderPro(locale)));
  }

  const total = written.reduce((sum, file) => sum + file.bytes, 0);
  for (const file of written) {
    console.log(`  ${file.relative.padEnd(22)} ${(file.bytes / 1024).toFixed(1)} kB`);
  }
  console.log(`\n${written.length} files, ${(total / 1024).toFixed(1)} kB total → apps/web/dist`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
