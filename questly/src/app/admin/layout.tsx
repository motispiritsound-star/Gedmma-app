import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/modules/auth/session";
import { getTranslator } from "@/modules/i18n/server";
import { signOutAction } from "@/server-actions/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  // Administration is role-gated in one place; every admin server action
  // re-checks the role as well, so a stale page cannot be used to act.
  if (!isAdmin(user.role)) redirect("/home");

  const { t } = await getTranslator();

  const links = [
    { href: "/admin", label: t("admin.title") },
    { href: "/admin/quests", label: t("admin.quests") },
    { href: "/admin/families", label: t("admin.families") },
    { href: "/admin/subscriptions", label: t("admin.subscriptions") },
    { href: "/admin/audit", label: t("admin.audit") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b-2 border-[var(--color-brand)] bg-[var(--color-brand-soft)]">
        <div className="q-container flex flex-wrap items-center justify-between gap-3 py-3">
          <Link href="/admin" className="font-display text-lg font-bold text-[var(--color-brand-ink)]">
            <span aria-hidden="true">🛠 </span>
            Questly {t("admin.title")}
          </Link>
          <nav aria-label={t("admin.title")} className="flex flex-wrap items-center gap-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="q-btn q-btn--ghost px-3 py-1.5 text-sm">
                {link.label}
              </Link>
            ))}
            <Link href="/home" className="q-btn q-btn--secondary px-3 py-1.5 text-sm">
              {t("nav.home")}
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="q-btn q-btn--ghost px-3 py-1.5 text-sm">
                {t("nav.signOut")}
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main id="main" className="flex-1 pb-16">
        {children}
      </main>
    </div>
  );
}
