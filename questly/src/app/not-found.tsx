import Link from "next/link";
import { getTranslator } from "@/modules/i18n/server";

export default async function NotFound() {
  const { t } = await getTranslator();
  return (
    <main id="main" className="q-container flex min-h-[60dvh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-5xl" aria-hidden="true">
        🧭
      </p>
      <h1 className="text-3xl">{t("common.notFound")}</h1>
      <p className="text-[var(--color-ink-soft)]">{t("common.notFoundHint")}</p>
      <Link href="/" className="q-btn q-btn--primary">
        {t("nav.home")}
      </Link>
    </main>
  );
}
