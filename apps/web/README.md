# Buurklus — website

The public site: a landing page for customers and a page for professionals, in
French, Arabic and English.

It is generated rather than hand-written. The trades, the cities and the
subscription prices come from `@buurklus/shared` — the same module the app and
the API read — so the website cannot quote a price the app does not charge or
advertise a trade nobody can pick.

```bash
npm run build --workspace @buurklus/web   # writes apps/web/dist
npm run serve --workspace @buurklus/web   # http://localhost:4300
```

Output is plain HTML and one stylesheet, with no client-side framework and no
build step beyond this one. It can be served from any static host or bucket.

## Layout

```
dist/
  index.html          language redirect
  fr/index.html       customers
  fr/pro/index.html   professionals
  ar/…                same, right-to-left
  en/…
  styles.css
  robots.txt
  sitemap.xml
```

Arabic uses `dir="rtl"` on the document, and the stylesheet is written with CSS
logical properties (`margin-inline-start`, `border-inline-end`) so a single
stylesheet serves both directions.
