/**
 * A static server for previewing a built site locally. Threaded by nature in
 * Node, and it resolves directory URLs to their index.html.
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? 4300);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.mp4': 'video/mp4',
  '.vtt': 'text/vtt',
  '.jpg': 'image/jpeg',
};

/**
 * Applies the _headers file the build writes for Cloudflare Pages, so a local
 * preview answers with the same Content-Security-Policy the real site does.
 * Without this the policy is only ever exercised in production, which is the
 * one place a mistake in it is expensive.
 */
async function loadHeaderRules() {
  const text = await readFile(path.join(root, '_headers'), 'utf8').catch(() => null);
  if (!text) return [];

  const rules = [];
  for (const block of text.split(/\n(?=\S)/)) {
    const lines = block.split('\n').filter((line) => line.trim() && !line.startsWith('#'));
    if (lines.length < 2 || /^\s/.test(lines[0])) continue;
    const pattern = new RegExp(
      `^${lines[0].trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`,
    );
    const headers = lines.slice(1).map((line) => {
      const at = line.indexOf(':');
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    });
    rules.push({ pattern, headers });
  }
  return rules;
}

const headerRules = await loadHeaderRules();

function headersFor(pathname) {
  const headers = {};
  for (const rule of headerRules) {
    if (rule.pattern.test(pathname)) for (const [name, value] of rule.headers) headers[name] = value;
  }
  return headers;
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let target = path.join(root, decodeURIComponent(url.pathname));

  try {
    const info = await stat(target).catch(() => null);
    if (!info || info.isDirectory()) target = path.join(target, 'index.html');
    await stat(target);
  } catch {
    // Cloudflare Pages answers an unknown path with the site's own 404.html;
    // the preview does the same so the page can actually be looked at.
    const custom = path.join(root, '404.html');
    if (await stat(custom).catch(() => null)) {
      response.writeHead(404, {
        'content-type': TYPES['.html'],
        ...headersFor(url.pathname),
      });
      createReadStream(custom).pipe(response);
      return;
    }
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'content-type': TYPES[path.extname(target)] ?? 'application/octet-stream',
    ...headersFor(url.pathname),
  });
  createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} on http://127.0.0.1:${port}`);
});
