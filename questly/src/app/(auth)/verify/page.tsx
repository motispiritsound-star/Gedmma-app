import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { getSessionUser } from "@/modules/auth/session";
import { resendVerificationAction, verifyEmailAction } from "@/server-actions/auth";
import { env } from "@/lib/env";
import { Card, ErrorNote } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "E-mail bevestigen" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { t } = await getTranslator();
  const user = await getSessionUser();
  const token = typeof params.token === "string" ? params.token : null;
  const hasError = params.error === "1";

  if (user?.emailVerified && !token) {
    return (
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl">{t("auth.verify.done")}</h1>
        <Link href="/onboarding" className="q-btn q-btn--primary mt-5">
          {t("common.next")}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="text-2xl">{t("auth.verify.title")}</h1>
      <p className="mt-2 text-[var(--color-ink-soft)]">
        {env().AUTH_SHOW_VERIFICATION_LINK ? t("auth.verify.body") : t("auth.verify.sent")}
      </p>
      {hasError ? <ErrorNote>{t("auth.verify.invalid")}</ErrorNote> : null}

      {token ? (
        <form action={verifyEmailAction} className="mt-5">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="q-btn q-btn--primary w-full">
            {t("auth.verify.title")}
          </button>
        </form>
      ) : (
        <>
          <p className="mt-4">{t("auth.verify.pending")}</p>
          <form action={resendVerificationAction} className="mt-4">
            <button type="submit" className="q-btn q-btn--secondary">
              {t("auth.verify.resend")}
            </button>
          </form>
        </>
      )}
    </Card>
  );
}
