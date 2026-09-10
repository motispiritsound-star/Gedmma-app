import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Walks the built site and follows every link on it.
 *
 * This exists because twelve pages shipped with a call-to-action pointing at
 * "#pricing" — a section that lives on two of them. The button did nothing,
 * on every legal page, both sign-up pages and the contact page, and no test
 * noticed because each page rendered perfectly well on its own. A link is only
 * wrong in relation to the page it points at, so it takes the whole site to
 * see it.
 */
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

interface Page {
  url: string;
  html: string;
  ids: Set<string>;
}

const pages = new Map<string, Page>();

async function collect(dir: string): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collect(full);
    } else if (entry.name.endsWith('.html')) {
      const html = await readFile(full, 'utf8');
      const url = `/${path.relative(DIST, full).split(path.sep).join('/')}`.replace(
        /index\.html$/,
        '',
      );
      pages.set(url, {
        url,
        html,
        ids: new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]!)),
      });
    }
  }
}

beforeAll(async () => {
  await collect(DIST);
});

describe('every link on the built site', () => {
  it('has pages to walk in the first place', () => {
    // A silent zero here would make every assertion below pass vacuously.
    expect(pages.size).toBeGreaterThanOrEqual(16);
  });

  it('points at a page that exists', () => {
    const broken: string[] = [];
    for (const page of pages.values()) {
      for (const [, href] of page.html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
        if (/^(https?:|mailto:|tel:|#)/.test(href!)) continue;
        const target = href!.split('#')[0]!;
        if (!pages.has(target)) broken.push(`${page.url} → ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('points at an anchor that exists on that page', () => {
    const broken: string[] = [];
    for (const page of pages.values()) {
      for (const [, href] of page.html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
        if (/^(https?:|mailto:|tel:)/.test(href!)) continue;
        const [rawPath, hash] = href!.split('#');
        if (!hash) continue;
        const target = rawPath === '' ? page.url : rawPath!;
        const destination = pages.get(target);
        if (!destination) continue; // reported by the test above
        if (!destination.ids.has(hash)) broken.push(`${page.url} → ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('gives every page a way to the sign-up form and to contact', () => {
    for (const page of pages.values()) {
      if (page.url === '/' || page.html.includes('name="robots" content="noindex"')) continue;
      const links = [...page.html.matchAll(/<a[^>]+href="([^"]+)"/g)].map((m) => m[1]!);
      const locale = page.url.startsWith('/en') ? 'en' : 'nl';
      const join = locale === 'en' ? '/en/join/' : '/nl/aanmelden/';
      const contact = `/${locale}/contact/`;
      expect(links, `${page.url} → sign-up`).toContain(join);
      expect(links, `${page.url} → contact`).toContain(contact);
    }
  });
});
