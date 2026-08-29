import Link from "next/link";
import { getTranslator } from "@/modules/i18n/server";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getTranslator();

  return (
    <div className="flex min-h-dvh flex-col bg-[linear-gradient(170deg,var(--color-brand-soft)_0%,var(--color-canvas)_45%)]">
      <header className="q-container flex items-center justify-between gap-3 py-4">
        <Link href="/" className="font-display text-xl font-bold text-[var(--color-brand-ink)]">
          <span aria-hidden="true">🧭 </span>
          {t("brand.name")}
        </Link>
        <LocaleSwitcher locale={locale} t={t} />
      </header>
      <main id="main" className="q-container flex flex-1 items-start justify-center py-6 sm:py-12">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
}
