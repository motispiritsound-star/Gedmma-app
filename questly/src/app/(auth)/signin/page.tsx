import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { getSessionUser, isAdmin } from "@/modules/auth/session";
import { Card } from "@/components/ui/primitives";
import { SignInForm } from "./form";

export const metadata: Metadata = { title: "Inloggen" };

export default async function SignInPage() {
  // Only send a signed-in visitor away when there is somewhere to send them:
  // an account without a family would otherwise ping-pong with /home.
  const current = await getSessionUser();
  if (current?.familyId) redirect("/home");
  if (current && isAdmin(current.role)) redirect("/admin");
  const { locale, t } = await getTranslator();

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl">{t("auth.signIn.title")}</h1>
      <p className="mt-1 mb-5 text-[var(--color-ink-soft)]">{t("brand.tagline")}</p>
      <SignInForm locale={locale} />
      <p className="mt-5 text-sm text-[var(--color-ink-soft)]">
        {t("auth.signIn.noAccount")}{" "}
        <Link href="/register" className="font-semibold underline underline-offset-2">
          {t("nav.register")}
        </Link>
      </p>
    </Card>
  );
}
