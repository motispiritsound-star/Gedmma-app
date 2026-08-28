/**
 * A static server for previewing a built site locally. Threaded by nature in
 * Node, and it resolves directory URLs to their index.html.
 */
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
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
};

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  let target = path.join(root, decodeURIComponent(url.pathname));

  try {
    const info = await stat(target).catch(() => null);
    if (!info || info.isDirectory()) target = path.join(target, 'index.html');
    await stat(target);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, { 'content-type': TYPES[path.extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`serving ${root} on http://127.0.0.1:${port}`);
});
