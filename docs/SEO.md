# Being found

Honest version first: this is a new domain with no history, and the search
results for "klusser zoeken" belong to platforms that have been earning them
since the 2000s. Nothing in this file changes that within months. What it does
is make sure that when the site earns a place, nothing technical is standing in
the way — and that the effort goes where it actually moves.

## What the site already does

Measured on the built site, home page, phone viewport:

| | |
| --- | --- |
| Requests to render the page | 5 |
| Weight before compression | 164 kB |
| First contentful paint | 0.17 s |
| Cumulative layout shift | 0 |

No framework, no tracking, no third-party fonts, no cookie banner to push the
content down. The film is `preload="none"`, so its 3.2 MB is downloaded only by
someone who presses play.

Also in place, and worth not breaking:

- One canonical URL per page, and `hreflang` linking the Dutch and English
  versions to each other with `x-default` on the Dutch.
- `Organization` and `FAQPage` structured data, which is what can put the
  questions from the home page straight into a result.
- A sitemap listing all 14 pages, named in `robots.txt`.
- Preview deployments closed off three ways over, so they never compete with
  the real site.
- `www` redirected to the bare domain, so one hostname holds the ranking.

## The first hour after launch

1. **Google Search Console** — add `buurklus.nl` as a *domain* property, which
   verifies with a TXT record you add in Cloudflare's DNS. Submit
   `https://buurklus.nl/sitemap.xml`.
2. **Bing Webmaster Tools** — same thing. Bing feeds DuckDuckGo and Ecosia, and
   it is far easier to rank on.
3. Request indexing for the two home pages by hand. The rest follows the
   sitemap.

Then leave it alone for a fortnight. Search Console shows nothing useful before
then, and re-submitting does not speed it up.

## What actually moves the ranking

In the order that pays:

**Pages that answer a real question.** Somebody types "wat kost een schilder per
uur" far more often than they type a brand name. A page that answers it with
actual numbers, updated, with a route into the sign-up, is the kind of page that
earns a link and holds a position. Ten of those beat a hundred thin ones.

**Not a page per municipality.** The obvious move — generate
`/klusser/amsterdam`, `/klusser/utrecht`, four hundred more — is the fastest way
to get the whole site classified as thin content, because the pages differ only
in a place name. A city page earns its place when it has something only that
city has: real tradespeople, real jobs, real prices. Which means those pages
come *after* there is supply, not before.

**Being mentioned.** Links from places that would write about a new Dutch
marketplace anyway: local news, a municipality's business page, a trade
association, the Facebook group for your first town. One of those is worth more
than any number of directory submissions, and directory submissions are what
the agencies that cold-mail you are selling.

**People searching for the name.** Every social post, flyer and word of mouth
that makes somebody type "buurklus" into Google is a signal no competitor can
copy. This is the one lever a new marketplace actually has, and it is the reason
the film and the social cards exist.

## What to leave alone

Buying links, spun city pages, keyword-stuffed footers, and anyone promising
page one in three months. Google's spam policies name most of these explicitly,
and a manual action on a young domain is expensive to undo.

## Adding content later

The site is generated from `apps/web/src/content.ts` by
`apps/web/src/build.ts` — new pages are new entries there, and the sitemap,
the `hreflang` links and the language switcher pick them up automatically.
Every page has to exist in both Dutch and English or the `hreflang` pair breaks;
the tests check that.

## Measuring

Search Console, once a month, three numbers: impressions (is Google showing the
site at all), average position for the queries that matter, and click-through
rate (is the title tag doing its job). Ignore the rest.

Rankings for a query nobody types are a vanity metric. Sign-ups per week are
the number this is all for.
