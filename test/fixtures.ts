import { createServer, type Server } from 'node:http';

const BAD = `<html>
<head><meta name="generator" content="WordPress 4.9.8"></head>
<body bgcolor="#ffffff">
<center><font size="5">Loodgietersbedrijf De Kraan</font></center>
<table width="980"><tr><td><table><tr><td>
<img src="/logo.gif">
<p>Bel ons.</p>
<script src="/js/jquery-1.7.2.min.js"></script>
<img src="http://example.com/foto.jpg">
<p>&copy; 2011 De Kraan</p>
</td></tr></table></td></tr></table>
</body></html>`;

const GOOD = `<!doctype html><html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Loodgieter in Utrecht — 24/7 spoedservice | Van Dijk</title>
<meta name="description" content="Loodgieter Van Dijk helpt in Utrecht en omgeving bij lekkages, verstoppingen en cv-storingen. Binnen een uur ter plaatse, vaste prijzen vooraf.">
<link rel="canonical" href="https://goed.test/">
<link rel="icon" href="/favicon.ico">
<meta property="og:title" content="Loodgieter Van Dijk">
<style>@media (max-width: 600px){ .grid { display:block; } }</style>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"Van Dijk","telephone":"030-1234567"}</script>
</head>
<body>
<h1>Loodgieter in Utrecht</h1>
<p>${'Wij verhelpen lekkages, verstoppingen en cv-storingen in heel Utrecht. '.repeat(12)}</p>
<img src="/team.webp" alt="Ons team" width="800" height="600" loading="lazy">
<img src="/bus.webp" alt="Servicebus" width="800" height="600" loading="lazy">
<form action="/offerte"><input name="naam"><button>Offerte aanvragen</button></form>
<a href="tel:0301234567">030-1234567</a> <a href="mailto:info@goed.test">info@goed.test</a>
<a href="https://www.linkedin.com/company/vandijk">LinkedIn</a>
<a href="/privacy">Privacyverklaring</a>
<p>&copy; ${new Date().getFullYear()} Van Dijk</p>
</body></html>`;

export function startFixtureServer(port = 0): Promise<{ server: Server; port: number }> {
  const server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0]!;
    if (path === '/robots.txt') {
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('User-agent: *\nDisallow: /geheim/\n');
      return;
    }
    if (path === '/sitemap.xml') { res.writeHead(404); res.end(); return; }
    if (path === '/slecht') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-powered-by': 'PHP/5.6.40', server: 'Apache/2.2.15' });
      res.end(BAD);
      return;
    }
    if (path === '/goed') {
      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'content-encoding': 'identity',
        'cache-control': 'public, max-age=3600',
        'strict-transport-security': 'max-age=31536000',
      });
      res.end(GOOD);
      return;
    }
    if (path === '/kapot') { res.writeHead(500); res.end('boem'); return; }
    res.writeHead(404); res.end('niet gevonden');
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: typeof address === 'object' && address ? address.port : port });
    });
  });
}
