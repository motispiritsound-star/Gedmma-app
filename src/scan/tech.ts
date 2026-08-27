export type TechFinding = {
  name: string;
  version: string | null;
  /** Ruwe indicatie hoe verouderd dit is; hoger = erger. 0 = prima. */
  staleness: number;
  note?: string;
};

type Detector = {
  name: string;
  test: RegExp;
  version?: RegExp;
  /** Bepaalt de staleness op basis van de gevonden versie. */
  rate?: (version: string | null) => { staleness: number; note?: string };
};

const major = (version: string | null): number => Number((version ?? '').split('.')[0] ?? 0);

const DETECTORS: Detector[] = [
  {
    name: 'WordPress',
    test: /wp-content\/|wp-includes\/|<meta[^>]+name=["']generator["'][^>]+WordPress/i,
    version: /WordPress\s+([\d.]+)/i,
    rate: (version) => {
      const [maj, min] = (version ?? '').split('.').map(Number);
      if (!maj) return { staleness: 0 };
      // WordPress 6.x is actueel; 5.x en lager is jaren oud en een beveiligingsrisico.
      if (maj < 5) return { staleness: 3, note: `WordPress ${version} is sterk verouderd` };
      if (maj === 5) return { staleness: 2, note: `WordPress ${version} wordt niet meer actief onderhouden` };
      if (maj === 6 && (min ?? 0) < 4) return { staleness: 1, note: `WordPress ${version} mist recente updates` };
      return { staleness: 0 };
    },
  },
  { name: 'Joomla', test: /\/media\/system\/js\/|content=["']Joomla/i, version: /Joomla!?\s*([\d.]+)/i,
    rate: (v) => (major(v) > 0 && major(v) < 4 ? { staleness: 3, note: `Joomla ${v} krijgt geen beveiligingsupdates meer` } : { staleness: 0 }) },
  { name: 'Drupal', test: /Drupal\.settings|\/sites\/default\/files\//i, version: /Drupal\s*([\d.]+)/i,
    rate: (v) => (major(v) > 0 && major(v) < 9 ? { staleness: 3, note: `Drupal ${v} is end-of-life` } : { staleness: 0 }) },
  { name: 'TYPO3', test: /typo3temp|typo3conf/i, version: /TYPO3\s*([\d.]+)/i, rate: () => ({ staleness: 1 }) },
  { name: 'Wix', test: /static\.wixstatic\.com|wix\.com\/website/i, rate: () => ({ staleness: 1, note: 'Wix-website: beperkte snelheid en SEO-controle' }) },
  { name: 'Squarespace', test: /squarespace\.com|static1\.squarespace/i, rate: () => ({ staleness: 0 }) },
  { name: 'Jimdo', test: /jimdo|jimstatic\.com/i, rate: () => ({ staleness: 1, note: 'Jimdo-sitebuilder' }) },
  { name: 'Weebly', test: /weebly\.com|editmysite\.com/i, rate: () => ({ staleness: 2, note: 'Weebly wordt nauwelijks nog doorontwikkeld' }) },
  { name: 'Shopify', test: /cdn\.shopify\.com|Shopify\.theme/i, rate: () => ({ staleness: 0 }) },
  { name: 'Webflow', test: /assets\.website-files\.com|webflow\.js/i, rate: () => ({ staleness: 0 }) },
  { name: 'Magento', test: /\/static\/version\d+\/frontend\/|Magento_/i, version: /Magento\/([\d.]+)/i, rate: (v) => (major(v) === 1 ? { staleness: 3, note: 'Magento 1 is end-of-life' } : { staleness: 0 }) },
  { name: 'React', test: /__NEXT_DATA__|react(?:-dom)?[.@-][\d.]*(?:min\.)?js|data-reactroot/i, rate: () => ({ staleness: 0 }) },
  { name: 'Vue', test: /vue(?:@|\.runtime|\.min)?[\d.]*\.js|data-v-[0-9a-f]{8}/i, rate: () => ({ staleness: 0 }) },
  { name: 'Angular', test: /ng-version=|angular(?:\.min)?\.js/i, rate: () => ({ staleness: 0 }) },
  {
    name: 'jQuery',
    test: /jquery/i,
    version: /jquery[/-]?v?([\d]+\.[\d]+(?:\.[\d]+)?)(?:\.min)?\.js|jQuery\s+v?([\d.]+)/i,
    rate: (version) => {
      const maj = major(version);
      if (maj === 1) return { staleness: 3, note: `jQuery ${version} bevat bekende XSS-kwetsbaarheden` };
      if (maj === 2) return { staleness: 3, note: `jQuery ${version} is verouderd en onveilig` };
      if (maj === 3) return { staleness: 0 };
      return { staleness: 0 };
    },
  },
  { name: 'Bootstrap', test: /bootstrap(?:\.bundle)?(?:\.min)?\.(?:js|css)/i, version: /bootstrap[/-]v?([\d.]+)/i,
    rate: (v) => (major(v) > 0 && major(v) < 4 ? { staleness: 2, note: `Bootstrap ${v} is niet responsive-first` } : { staleness: 0 }) },
  { name: 'Flash', test: /\.swf\b|application\/x-shockwave-flash/i, rate: () => ({ staleness: 4, note: 'Flash werkt sinds 2021 in geen enkele browser meer' }) },
  { name: 'Silverlight', test: /application\/x-silverlight/i, rate: () => ({ staleness: 4, note: 'Silverlight is uitgefaseerd' }) },
  { name: 'Universal Analytics', test: /UA-\d{4,}-\d+|google-analytics\.com\/analytics\.js/i, rate: () => ({ staleness: 2, note: 'Universal Analytics is per juli 2023 gestopt met meten' }) },
  { name: 'Google Analytics 4', test: /gtag\/js\?id=G-|googletagmanager\.com\/gtm\.js/i, rate: () => ({ staleness: 0 }) },
  { name: 'FrontPage', test: /content=["']Microsoft FrontPage|_vti_bin/i, rate: () => ({ staleness: 4, note: 'Gebouwd met Microsoft FrontPage (jaren 90/00)' }) },
  { name: 'Dreamweaver', test: /content=["']Adobe Dreamweaver|MM_swapImage/i, rate: () => ({ staleness: 3, note: 'Gebouwd met Dreamweaver-templates' }) },
];

const PHP_HEADER = /PHP\/([\d.]+)/i;

/** Detecteert CMS, frameworks en verouderde technologie in HTML + response-headers. */
export function detectTech(html: string, headers: Record<string, string>): TechFinding[] {
  const haystack = html.slice(0, 400_000);
  const findings: TechFinding[] = [];

  for (const detector of DETECTORS) {
    if (!detector.test.test(haystack)) continue;
    const match = detector.version ? detector.version.exec(haystack) : null;
    const version = match ? (match[1] ?? match[2] ?? null) : null;
    const rated = detector.rate?.(version) ?? { staleness: 0 };
    findings.push({ name: detector.name, version, staleness: rated.staleness, note: rated.note });
  }

  const poweredBy = headers['x-powered-by'] ?? '';
  const server = headers['server'] ?? '';
  const phpMatch = PHP_HEADER.exec(`${poweredBy} ${server}`);
  if (phpMatch) {
    const version = phpMatch[1]!;
    const [maj, min] = version.split('.').map(Number);
    // PHP 7.4 en lager krijgt geen beveiligingsupdates meer.
    const stale = (maj ?? 0) < 8 ? 3 : (maj === 8 && (min ?? 0) < 1 ? 1 : 0);
    findings.push({
      name: 'PHP',
      version,
      staleness: stale,
      note: stale >= 3 ? `PHP ${version} krijgt geen beveiligingsupdates meer` : undefined,
    });
  }

  if (/Apache\/2\.[0-2]\b|nginx\/1\.[0-9]\b/i.test(server)) {
    findings.push({ name: 'Webserver', version: server, staleness: 1, note: `Verouderde webserverversie (${server})` });
  }

  return findings;
}

/** Herkent de generator-meta, ook als er geen detector op matcht. */
export function readGenerator(html: string): string | null {
  const match = /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i.exec(html);
  return match?.[1]?.trim() ?? null;
}
