import { config } from '../config.ts';

export type DeepMetrics = {
  lcpMs: number | null;
  cls: number | null;
  domContentLoadedMs: number | null;
  loadMs: number | null;
  requestCount: number;
  transferBytes: number;
  consoleErrors: number;
  screenshotPath: string | null;
};

/**
 * Optionele diepe meting met een echte browser (Playwright). Levert de
 * gebruikerservaring-cijfers waar Google op stuurt: LCP en CLS.
 * Playwright is geen harde dependency — zonder installatie geeft dit `null` terug.
 */
export async function deepScan(
  url: string,
  opts: { screenshotDir?: string; mobile?: boolean } = {},
): Promise<DeepMetrics | null> {
  // Playwright is een optionele dependency; de specifier is bewust niet-letterlijk
  // zodat het project ook typechecked zonder dat playwright geïnstalleerd is.
  const specifier: string = 'playwright';
  let chromium: any;
  try {
    ({ chromium } = await import(specifier));
  } catch {
    return null; // Playwright niet geïnstalleerd: sla de diepe meting over.
  }

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({
      userAgent: config.userAgent,
      viewport: opts.mobile ? { width: 390, height: 844 } : { width: 1366, height: 768 },
      deviceScaleFactor: opts.mobile ? 3 : 1,
      isMobile: opts.mobile ?? false,
      hasTouch: opts.mobile ?? false,
    });
    const page = await context.newPage();

    let requestCount = 0;
    let transferBytes = 0;
    let consoleErrors = 0;
    page.on('request', () => { requestCount++; });
    page.on('response', async (response: any) => {
      const length = Number(response.headers()['content-length'] ?? 0);
      if (Number.isFinite(length)) transferBytes += length;
    });
    page.on('console', (message: any) => { if (message.type() === 'error') consoleErrors++; });

    await page.goto(url, { waitUntil: 'load', timeout: config.timeoutMs });
    await page.waitForTimeout(1500); // even wachten zodat LCP/CLS uitgerekend zijn

    const vitals = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as PerformanceEntry[];
      const layoutShifts = performance.getEntriesByType('layout-shift') as (PerformanceEntry & {
        value: number; hadRecentInput: boolean;
      })[];
      return {
        lcpMs: lcpEntries.length > 0 ? Math.round(lcpEntries[lcpEntries.length - 1]!.startTime) : null,
        cls: layoutShifts.length > 0
          ? Number(layoutShifts.filter((s) => !s.hadRecentInput).reduce((sum, s) => sum + s.value, 0).toFixed(3))
          : null,
        domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        loadMs: nav ? Math.round(nav.loadEventEnd) : null,
      };
    });

    let screenshotPath: string | null = null;
    if (opts.screenshotDir) {
      const { mkdir } = await import('node:fs/promises');
      const { join } = await import('node:path');
      await mkdir(opts.screenshotDir, { recursive: true });
      screenshotPath = join(opts.screenshotDir, `${new URL(url).hostname}.jpg`);
      await page.screenshot({ path: screenshotPath, quality: 70, type: 'jpeg', fullPage: false });
    }

    return { ...vitals, requestCount, transferBytes, consoleErrors, screenshotPath };
  } catch {
    return null;
  } finally {
    await browser.close().catch(() => {});
  }
}
