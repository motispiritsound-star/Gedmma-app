import { redirect } from "next/navigation";
import { getSessionUser, isAdmin } from "@/modules/auth/session";
import { getTranslator } from "@/modules/i18n/server";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  // Administrator accounts have no family of their own. Sending them to
  // /signin here would bounce forever, because /signin sends a signed-in user
  // straight back; they belong in the admin area instead.
  if (!user.familyId) redirect(isAdmin(user.role) ? "/admin" : "/register");

  const { locale, t } = await getTranslator();

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav user={user} locale={locale} t={t} />
      <main id="main" className="flex-1 pb-16">
        {children}
      </main>
    </div>
  );
}
