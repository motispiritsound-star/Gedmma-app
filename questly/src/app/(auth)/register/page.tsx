import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { getSessionUser, isAdmin } from "@/modules/auth/session";
import { Card } from "@/components/ui/primitives";
import { RegisterForm } from "./form";

export const metadata: Metadata = { title: "Account maken" };

export default async function RegisterPage() {
  const current = await getSessionUser();
  if (current?.familyId) redirect("/home");
  if (current && isAdmin(current.role)) redirect("/admin");
  const { locale, t } = await getTranslator();

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl">{t("auth.register.title")}</h1>
      <p className="mt-1 mb-5 text-[var(--color-ink-soft)]">{t("marketing.principle")}</p>
      <RegisterForm locale={locale} />
      <p className="mt-5 text-sm text-[var(--color-ink-soft)]">
        {t("auth.register.haveAccount")}{" "}
        <Link href="/signin" className="font-semibold underline underline-offset-2">
          {t("nav.signIn")}
        </Link>
      </p>
    </Card>
  );
}
