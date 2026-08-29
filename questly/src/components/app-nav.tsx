import Link from "next/link";
import type { SessionUser } from "@/modules/auth/session";
import { isAdmin } from "@/modules/auth/session";
import type { AppLocale, Translate } from "@/modules/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { signOutAction } from "@/server-actions/auth";

export function AppNav({ user, locale, t }: { user: SessionUser; locale: AppLocale; t: Translate }) {
  const links = [
    { href: "/home", label: t("nav.home") },
    { href: "/quests", label: t("nav.library") },
    { href: "/planner", label: t("nav.planner") },
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/children", label: t("nav.children") },
    { href: "/settings", label: t("nav.settings") },
  ];

  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="q-container flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href="/home" className="font-display text-xl font-bold text-[var(--color-brand-ink)]">
          <span aria-hidden="true">🧭 </span>
          {t("brand.name")}
        </Link>

        <nav aria-label={t("nav.mainLabel")} className="order-2 w-full overflow-x-auto sm:w-auto">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="q-btn q-btn--ghost whitespace-nowrap px-3 py-1.5 text-sm">
                  {link.label}
                </Link>
              </li>
            ))}
            {isAdmin(user.role) ? (
              <li>
                <Link href="/admin" className="q-btn q-btn--secondary whitespace-nowrap px-3 py-1.5 text-sm">
                  {t("nav.admin")}
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>

        <div className="order-3 flex items-center gap-2">
          <LocaleSwitcher locale={locale} t={t} />
          <form action={signOutAction}>
            <button type="submit" className="q-btn q-btn--ghost px-3 py-1.5 text-sm">
              {t("nav.signOut")}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
