/**
 * Theme validation.
 *
 * A Shopify theme cannot be integration-tested without a store, and no store is
 * reachable from this environment. That is not a reason to ship untested code —
 * it is a reason to test what does not need a store. These checks catch the
 * class of defect that is otherwise only discovered after a deploy: malformed
 * section schemas, translation keys that resolve to nothing, images without alt
 * text, and a JavaScript bundle that has quietly outgrown its budget.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const THEME = join(dirname(fileURLToPath(import.meta.url)), '..', 'theme');

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const themeFiles = walk(THEME);
const liquidFiles = themeFiles.filter((f) => extname(f) === '.liquid');
const jsonFiles = themeFiles.filter((f) => extname(f) === '.json');
const read = (f) => readFileSync(f, 'utf8');
const rel = (f) => f.slice(THEME.length + 1);

test('the theme has the directories Shopify requires', () => {
  for (const dir of ['layout', 'sections', 'snippets', 'templates', 'config', 'locales', 'assets']) {
    assert.ok(
      themeFiles.some((f) => rel(f).startsWith(dir + '/')),
      `missing ${dir}/`,
    );
  }
  assert.ok(themeFiles.some((f) => rel(f) === 'layout/theme.liquid'), 'missing layout/theme.liquid');
});

test('every JSON file parses', () => {
  for (const file of jsonFiles) {
    assert.doesNotThrow(() => JSON.parse(read(file)), `invalid JSON: ${rel(file)}`);
  }
});

test('every {% schema %} block is valid JSON and names its section', () => {
  for (const file of liquidFiles) {
    const match = read(file).match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
    if (!match) continue;

    let schema;
    assert.doesNotThrow(() => {
      schema = JSON.parse(match[1]);
    }, `invalid schema JSON in ${rel(file)}`);

    assert.ok(schema.name, `schema in ${rel(file)} has no name`);

    // A setting without an id cannot be read back in Liquid.
    for (const setting of schema.settings ?? []) {
      if (setting.type === 'header' || setting.type === 'paragraph') continue;
      assert.ok(setting.id, `setting without id in ${rel(file)}: ${JSON.stringify(setting)}`);
      assert.ok(setting.label, `setting without label in ${rel(file)}: ${setting.id}`);
    }
    for (const block of schema.blocks ?? []) {
      assert.ok(block.type, `block without type in ${rel(file)}`);
      for (const setting of block.settings ?? []) {
        if (setting.type === 'header' || setting.type === 'paragraph') continue;
        assert.ok(setting.id, `block setting without id in ${rel(file)}`);
      }
    }
  }
});

test('every section referenced by a template exists', () => {
  const sectionNames = new Set(
    themeFiles
      .filter((f) => rel(f).startsWith('sections/') && extname(f) === '.liquid')
      .map((f) => rel(f).replace('sections/', '').replace('.liquid', '')),
  );

  for (const file of jsonFiles.filter((f) => rel(f).startsWith('templates/') || rel(f).startsWith('sections/'))) {
    const data = JSON.parse(read(file));
    for (const section of Object.values(data.sections ?? {})) {
      assert.ok(sectionNames.has(section.type), `${rel(file)} references missing section "${section.type}"`);
    }
    // Every key in `order` must exist in `sections`, or the template renders nothing.
    for (const key of data.order ?? []) {
      assert.ok(data.sections?.[key], `${rel(file)} orders "${key}" which is not defined`);
    }
  }
});

test('every block listed in block_order is defined', () => {
  for (const file of jsonFiles.filter((f) => rel(f).startsWith('templates/'))) {
    const data = JSON.parse(read(file));
    for (const [name, section] of Object.entries(data.sections ?? {})) {
      for (const key of section.block_order ?? []) {
        assert.ok(section.blocks?.[key], `${rel(file)} section "${name}" orders undefined block "${key}"`);
      }
    }
  }
});

/* --- Localisation --------------------------------------------------------- */

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

const enPath = join(THEME, 'locales', 'en.default.json');
const enKeys = new Set(flatten(JSON.parse(read(enPath))));

test('every translation key used in Liquid exists in the default locale', () => {
  const missing = [];

  for (const file of liquidFiles) {
    const body = read(file);
    // Match 'some.key' | t  — the standard Shopify translation filter.
    for (const [, key] of body.matchAll(/'([a-z0-9_]+(?:\.[a-z0-9_]+)+)'\s*\|\s*t\b/g)) {
      if (!enKeys.has(key)) missing.push(`${rel(file)}: ${key}`);
    }
  }

  assert.deepEqual(missing, [], `translation keys with no entry in en.default.json:\n${missing.join('\n')}`);
});

test('the Dutch locale covers every key in the default locale', () => {
  // NL is the launch market. A missing Dutch string is a customer-facing defect,
  // not a cosmetic one, so this is an assertion rather than a warning.
  const nlKeys = new Set(flatten(JSON.parse(read(join(THEME, 'locales', 'nl.json')))));
  const missing = [...enKeys].filter((k) => !nlKeys.has(k));
  assert.deepEqual(missing, [], `Dutch translations missing for: ${missing.join(', ')}`);
});

/* --- Performance and accessibility budgets -------------------------------- */

test('theme JavaScript stays within the 50 KB budget', () => {
  const js = themeFiles.filter((f) => extname(f) === '.js');
  const total = js.reduce((sum, f) => sum + statSync(f).size, 0);
  assert.ok(total < 50_000, `theme JS is ${(total / 1024).toFixed(1)} KB, budget is 50 KB`);
});

test('the theme loads no third-party scripts or stylesheets', () => {
  // Tags and pixels belong in Customer Events, where consent gates them, not in
  // the theme where they are unconditional and untracked.
  for (const file of liquidFiles) {
    const body = read(file);
    for (const [, url] of body.matchAll(/<(?:script|link)[^>]+(?:src|href)=["'](https?:\/\/[^"']+)/g)) {
      assert.ok(
        url.startsWith('https://cdn.shopify.com'),
        `${rel(file)} loads a third-party asset: ${url}`,
      );
    }
  }
});

test('every img tag has an alt attribute', () => {
  const offenders = [];
  for (const file of liquidFiles) {
    for (const [tag] of read(file).matchAll(/<img\b[^>]*>/g)) {
      if (!/\balt\s*=/.test(tag)) offenders.push(`${rel(file)}: ${tag.slice(0, 80)}`);
    }
  }
  assert.deepEqual(offenders, [], `img tags without alt:\n${offenders.join('\n')}`);
});

test('focus outlines are never removed without a replacement', () => {
  const css = read(join(THEME, 'assets', 'theme.css'));
  for (const [rule] of css.matchAll(/outline:\s*(none|0)\s*;/g)) {
    void rule;
  }
  // The one permitted removal is :focus:not(:focus-visible), which keeps the
  // ring for keyboard users while hiding it for mouse users.
  const removals = [...css.matchAll(/([^{}]+)\{[^}]*outline:\s*(?:none|0)\s*;/g)].map((m) => m[1].trim());
  for (const selector of removals) {
    assert.ok(
      selector.includes(':focus:not(:focus-visible)'),
      `outline removed for "${selector}" without a focus-visible replacement`,
    );
  }
});

test('colours come from tokens rather than being hardcoded in section markup', () => {
  // Hardcoded colours break the merchant's palette control and dark-mode work.
  // The staff-only GPSR warning is exempt: it must be alarming regardless.
  const offenders = [];
  for (const file of liquidFiles) {
    const body = read(file);
    for (const [, style] of body.matchAll(/style="([^"]*)"/g)) {
      if (/#[0-9a-f]{3,6}/i.test(style) && !body.includes('Missing GPSR data')) {
        offenders.push(`${rel(file)}: ${style}`);
      }
    }
  }
  assert.deepEqual(offenders, [], `hardcoded colours:\n${offenders.join('\n')}`);
});

/* --- Compliance guardrails ------------------------------------------------ */

test('the theme never renders Shopify compare_at_price as a reference price', () => {
  // Under the Omnibus Directive a "was" price must be the lowest price applied
  // in the preceding 30 days. compare_at_price is free text and is not that
  // number, so displaying it directly risks an unlawful price claim.
  const offenders = [];
  for (const file of liquidFiles) {
    const body = read(file);
    if (/compare_at_price\s*\|\s*money/.test(body)) offenders.push(rel(file));
  }
  assert.deepEqual(
    offenders,
    [],
    `compare_at_price rendered as a price in: ${offenders.join(', ')} — use the pricing.lowest_price_30d metafield`,
  );
});

test('review structured data is only emitted behind a real rating count', () => {
  const sd = read(join(THEME, 'snippets', 'structured-data.liquid'));
  assert.ok(sd.includes('aggregateRating'), 'expected aggregateRating support to exist');
  assert.ok(
    /rating_count\s*>\s*0/.test(sd),
    'aggregateRating must be guarded by a non-zero review count',
  );
});

test('the product page carries the GPSR information block', () => {
  const pdp = read(join(THEME, 'sections', 'main-product.liquid'));
  assert.match(
    pdp,
    /render 'regulatory-information'/,
    'GPSR Art. 19 information must appear in the offer itself, not only in the footer',
  );
});

/* --- The GPSR purchase gate ----------------------------------------------- */

test('a product without GPSR data cannot be purchased', () => {
  const pdp = read(join(THEME, 'sections', 'main-product.liquid'));

  assert.match(pdp, /assign gpsr_ready = false/, 'the gate must default to closed');
  assert.match(
    pdp,
    /\{%\s*unless variant\.available and gpsr_ready\s*%\}disabled\{%\s*endunless\s*%\}/,
    'add-to-cart must be disabled when the gate is closed',
  );
});

test('the gate defaults to on in theme settings', () => {
  const schema = JSON.parse(read(join(THEME, 'config', 'settings_schema.json')));
  const setting = schema
    .flatMap((g) => g.settings ?? [])
    .find((s) => s.id === 'enforce_gpsr_gate');

  assert.ok(setting, 'enforce_gpsr_gate setting is missing');
  assert.equal(setting.default, true, 'the safe default is the one that refuses');
});

test('JavaScript cannot re-enable a gated buy button', () => {
  const js = read(join(THEME, 'assets', 'theme.js'));

  // Three separate paths could defeat the server-rendered gate.
  assert.match(js, /const gated = this\.dataset\.gpsrReady === 'false'/, 'variant change path');
  assert.match(
    js,
    /if \(this\.dataset\.gpsrReady === 'false'\) \{\s*event\.preventDefault\(\);\s*return;/,
    'submit path — requestSubmit() from the sticky bar bypasses a disabled button',
  );
  assert.match(
    js,
    /this\.submit\.disabled = this\.dataset\.gpsrReady === 'false';/,
    'the finally block must not re-enable a gated button',
  );
});

test('the missing-compliance notice is visible to customers, not only to staff', () => {
  const snippet = read(join(THEME, 'snippets', 'regulatory-information.liquid'));
  const elseBranch = snippet.slice(snippet.lastIndexOf('{%- else -%}'));

  // The earlier version wrapped the whole notice in a design-mode check, so a
  // live product with empty metafields rendered nothing at all.
  const customerNotice = elseBranch.indexOf("'product.regulatory.unavailable' | t");
  const staffCheck = elseBranch.indexOf('request.design_mode');

  assert.ok(customerNotice > -1, 'a customer-facing notice must exist');
  assert.ok(
    staffCheck === -1 || customerNotice < staffCheck,
    'the customer notice must render outside the design-mode check',
  );
});

test('a set can declare per-component manufacturers', () => {
  // A starter set is one Shopify product but several physical products, each
  // needing its own Article 19 data.
  const snippet = read(join(THEME, 'snippets', 'regulatory-information.liquid'));
  assert.match(snippet, /component_details/, 'multi-component sets must be representable');
});
