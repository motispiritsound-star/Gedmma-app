import Link from "next/link";
import { getTranslator } from "@/modules/i18n/server";
import { getSessionUser } from "@/modules/auth/session";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getTranslator();
  const user = await getSessionUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="q-container flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/" className="font-display text-xl font-bold text-[var(--color-brand-ink)]">
            <span aria-hidden="true">🧭 </span>
            {t("brand.name")}
          </Link>
          <nav aria-label={t("nav.mainLabel")} className="flex flex-wrap items-center gap-1">
            <Link href="/how-it-works" className="q-btn q-btn--ghost px-3 py-1.5 text-sm">
              {t("nav.howItWorks")}
            </Link>
            <Link href="/pricing" className="q-btn q-btn--ghost px-3 py-1.5 text-sm">
              {t("nav.pricing")}
            </Link>
            <Link href="/privacy" className="q-btn q-btn--ghost px-3 py-1.5 text-sm">
              {t("nav.privacy")}
            </Link>
            <LocaleSwitcher locale={locale} t={t} />
            {user ? (
              <Link href="/home" className="q-btn q-btn--primary px-4 py-1.5 text-sm">
                {t("nav.home")}
              </Link>
            ) : (
              <>
                <Link href="/signin" className="q-btn q-btn--secondary px-4 py-1.5 text-sm">
                  {t("nav.signIn")}
                </Link>
                <Link href="/register" className="q-btn q-btn--primary px-4 py-1.5 text-sm">
                  {t("nav.register")}
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-[var(--color-line)] bg-[var(--color-surface)] py-8">
        <div className="q-container flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--color-ink-soft)]">
          <p>© {new Date().getFullYear()} Questly</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-4">
            <Link href="/privacy" className="underline underline-offset-2">
              {t("nav.privacy")}
            </Link>
            <Link href="/pricing" className="underline underline-offset-2">
              {t("nav.pricing")}
            </Link>
            <Link href="/how-it-works" className="underline underline-offset-2">
              {t("nav.howItWorks")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
