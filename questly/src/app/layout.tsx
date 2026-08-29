import type { Metadata, Viewport } from "next";
import { getLocale } from "@/modules/i18n/server";
import { createTranslator } from "@/modules/i18n";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Questly", template: "%s · Questly" },
  description:
    "Questly geeft gezinnen persoonlijke offline avonturen: kies een quest, leg het scherm weg en beleef iets in de echte wereld.",
  applicationName: "Questly",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Questly", statusBarStyle: "default" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#14574a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = createTranslator(locale);

  return (
    <html lang={locale}>
      <body>
        <a className="q-skip-link" href="#main">
          {t("nav.skipToContent")}
        </a>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
