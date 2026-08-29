import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { isLocale, translator, type Locale } from '@/lib/i18n';
import { viewerContext } from '@/lib/auth/context';
import { SiteFooter, SiteHeader } from '@/components/nav';

export function generateStaticParams() {
  return [{ locale: 'nl' }, { locale: 'en' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const typedLocale: Locale = locale;
  const t = translator(typedLocale);

  const { user, unreadNotifications } = await viewerContext();
  const headerList = await headers();
  const currentPath = headerList.get('x-invoke-path') ?? `/${locale}`;

  return (
    <html lang={typedLocale}>
      <body className="min-h-screen">
        <a href="#main" className="skip-link">
          {t('nav.skipToContent')}
        </a>
        <SiteHeader locale={typedLocale} user={user} unread={unreadNotifications} currentPath={currentPath} />
        <main id="main" className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <SiteFooter locale={typedLocale} />
      </body>
    </html>
  );
}
