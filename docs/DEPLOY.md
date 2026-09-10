# Going live

Three pieces, deployed separately. The website can go live on its own; the API
and the database are only needed before the sign-up form can actually store
anything.

| Piece | Where | Cost |
| --- | --- | --- |
| Website (`apps/web/dist`) | Cloudflare Pages | free |
| API (`apps/api`) | Fly.io, Amsterdam | a few euro a month |
| Database | Fly Postgres, Amsterdam | a few euro a month |

Amsterdam is not a preference. The database holds names, addresses and phone
numbers of people in the Netherlands; keeping it in the EU means the privacy
statement has no third-country transfer to justify.

## Before the first deploy

Fill in `OPERATOR` in `packages/shared/src/legal.ts`. Until it has a legal
name, a KvK number, an address and an e-mail address, every legal page prints a
box saying which of them are missing — deliberately, because a privacy
statement that does not name the controller does not meet Article 13, and
Article 3:15d of the Dutch Civil Code requires those details on a commercial
site. The box disappears on its own once the fields are filled.

`missingOperatorFields()` is what decides that, and a test asserts the box is
shown while anything is missing. Nothing else in the code needs changing.

## 1. The website on Cloudflare Pages

Create a Cloudflare account, then **Workers & Pages → Create → Pages → Connect
to Git**, and pick this repository.

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build --workspace @buurklus/shared && npm run build --workspace @buurklus/web` |
| Build output directory | `apps/web/dist` |
| Root directory | `/` |

The Node version comes from `.node-version` in the repository root, so there is
no environment variable to set. Leave `PUBLIC_SITE_URL` unset for production:
the build then uses `https://buurklus.nl`, which is what the canonical links,
the sitemap and the social cards are built from.

Every push to `main` rebuilds and republishes. Every push to another branch gets
a preview URL — and a preview build sets `robots: noindex`, an
`X-Robots-Tag` header and a `Disallow: /` robots.txt, so a preview can never
compete with the real site in the search results.

### What the build writes for Cloudflare

Two files are generated into `apps/web/dist` and read by Pages:

- `_headers` — the security headers and the cache lifetimes. The
  Content-Security-Policy lists a SHA-256 hash of every inline script on the
  site, which is why it is generated rather than written by hand: a policy
  maintained by hand goes stale the first line of copy that changes, and then
  silently blocks the sign-up form.
There is deliberately no `_redirects`. The one redirect this site wants is www
to the bare domain, and Workers allows only relative paths there — a relative
rule cannot tell www from the bare domain, and a full URL is rejected outright
(`Invalid _redirects configuration: Only relative URLs are allowed`), which
fails the deploy. Attach only `buurklus.nl` as a custom domain, or add a
**Rules → Redirect Rules** entry in the dashboard sending `www.buurklus.nl` to
it. Every page already carries a canonical link to the bare domain, which is
what tells Google which copy counts.

`node apps/web/dist` is served locally by `npm run dev --workspace
@buurklus/web`, which applies `_headers` too — so a policy mistake shows up on
your own machine rather than in production.

## 2. Pointing buurklus.nl at it

The domain is at MijnDomein. Cloudflare Pages needs the domain's DNS, which
means moving the nameservers:

1. In Cloudflare: **Add a site** → `buurklus.nl` → Free plan. Cloudflare scans
   the existing records and shows you two nameservers.
2. In MijnDomein: **Mijn domeinen → buurklus.nl → Nameservers**, replace theirs
   with the two Cloudflare gave you.
3. Wait. Usually under an hour, up to 24 for a `.nl`.
4. Back in Cloudflare Pages: **Custom domains → Set up a domain** → add both
   `buurklus.nl` and `www.buurklus.nl`. The certificate is issued
   automatically.

**Check the e-mail records before you switch.** If mail for the domain runs
through MijnDomein, copy the existing MX, SPF, DKIM and DMARC records into
Cloudflare's DNS first. Nameservers that move without them take the mail down
with them, and that failure is silent — messages simply bounce elsewhere.

Keeping DNS at MijnDomein is possible for `www` with a CNAME, but not for the
bare domain: a CNAME on the apex is not valid DNS, and MijnDomein's panel has
no ALIAS record to work around it. Moving the nameservers is the route that
works for both.

## 3. Checking it landed

```sh
curl -sI https://buurklus.nl/nl/ | grep -i "content-security-policy\|strict-transport"
curl -s  https://buurklus.nl/robots.txt          # must Allow, and name the sitemap
curl -s  https://buurklus.nl/sitemap.xml | head  # 14 URLs, both languages
```

Then open the site in a browser with the console visible. A blocked script or
stylesheet shows up there as a Content-Security-Policy error and nowhere else.

## 3b. Counting visitors

Cloudflare's own numbers need no setup at all. In the dashboard, the worker
(**Compute (Workers) → buurklus-site → Metrics**) counts requests it served,
and the domain (**buurklus.nl → Analytics & Logs**) counts requests and
estimates unique visitors from what passes through the proxy. Both are traffic
seen at the edge: bots included, and a page read from a browser's cache not
counted at all.

For visits rather than requests — which pages, where people came from, how many
came back — switch on **Web Analytics**:

1. Cloudflare dashboard → **Analytics & Logs → Web Analytics** → *Add a site*,
   hostname `buurklus.nl`. Choose the manual/JS-snippet option; copy the token
   out of the snippet it shows (the long hex string after `"token":`).
2. **Compute (Workers) → buurklus-site → Settings → Variables and Secrets**,
   add `CF_ANALYTICS_TOKEN` with that value, for Production.
3. Redeploy (any push does it, or *Deployments → Retry*).

Both halves are generated from that one variable: the beacon in every page's
`<head>` and the two hosts it needs in the Content-Security-Policy. Setting one
without the other is the failure that looks like success — the browser blocks
the script silently and the dashboard reports nobody visiting. With no variable
set, no beacon is written and the policy stays closed, which is what a fork or a
preview build should do.

Check it landed:

```sh
curl -s  https://buurklus.nl/nl/ | grep -o 'cloudflareinsights[^"]*'
curl -sI https://buurklus.nl/nl/ | grep -io 'connect-src[^;]*'
```

It sets no cookie, stores no identifier and follows nobody between sites, so it
needs no consent banner and the cookie statement stays true as written. Anything
that does track — Google Analytics, an advertising pixel — is a different
decision with a different privacy statement, and the policy would have to be
opened for it by hand.

Google's own numbers are separate and worth having: **Search Console** shows
what people searched for before they clicked, which analytics cannot see. See
docs/SEO.md.

## 4. The API on Fly.io

Only needed when the sign-up form should store sign-ups. Until then the form
says, in as many words, that nothing was sent and nothing was saved.

```sh
fly launch --no-deploy --copy-config          # reads fly.toml
fly postgres create --region ams --name buurklus-db
fly postgres attach buurklus-db               # sets DATABASE_URL

fly secrets set \
  JWT_ACCESS_SECRET="$(openssl rand -base64 48)" \
  JWT_REFRESH_SECRET="$(openssl rand -base64 48)"

fly deploy
fly certs add api.buurklus.nl                 # then add the CNAME it prints
```

The container runs `prisma migrate deploy` on boot, so the schema comes up with
the deploy. `migrate deploy` only applies migrations that already exist — it
never invents one and never drops a column.

`CORS_ORIGINS` is set in `fly.toml` to the two site hostnames. The server
refuses to start in production with the development default of `*`, which would
let any page on the internet call the API from a reader's browser.

Two things are still stubs and will need real accounts before they do anything:
`SMS_PROVIDER` is `log` (the login code is written to the server log instead of
being sent), and no mail provider is wired in at all, so a sign-up gets no
confirmation. Both are noted in `docs/PRIVACY.md`.

## 5. Rolling back

Cloudflare Pages keeps every deployment: **Deployments → … → Rollback**. Fly
keeps releases: `fly releases` then `fly deploy --image <previous>`. Neither
needs the repository to change.
