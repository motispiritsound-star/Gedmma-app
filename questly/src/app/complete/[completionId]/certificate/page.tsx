import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { getSessionUser } from "@/modules/auth/session";
import { getCompletion } from "@/modules/progress";
import { getEntitlements } from "@/modules/subscriptions";
import { getFamily } from "@/modules/families";
import { pickText } from "@/modules/i18n";
import { NotFoundError } from "@/lib/errors";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Certificaat", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ completionId: string }> }) {
  const { completionId } = await params;
  const user = await getSessionUser();
  if (!user?.familyId) redirect("/signin");

  const entitlements = await getEntitlements(user.familyId);
  if (!entitlements.certificates) redirect("/settings/subscription");

  const { locale, t } = await getTranslator();

  let completion;
  try {
    completion = await getCompletion(user.familyId, completionId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
  if (completion.status !== "APPROVED") redirect(`/complete/${completionId}`);

  const family = await getFamily(user.familyId);
  const translation =
    completion.quest.translations.find((row) => row.locale === (locale === "en" ? "EN" : "NL")) ??
    completion.quest.translations[0];
  const names = completion.participants.map((p) => p.childProfile.nickname);
  const finished = completion.finishedAt ?? completion.approvedAt ?? completion.startedAt;

  return (
    <main id="main" className="q-container max-w-3xl py-10 print:py-0">
      <PrintButton label={t("completion.certificate")} />

      <section className="mt-6 rounded-[var(--radius-card)] border-4 border-[var(--color-brand)] bg-[var(--color-surface)] p-10 text-center print:border-2">
        <p className="font-display text-lg tracking-[0.3em] uppercase text-[var(--color-accent-strong)]">Questly</p>
        <h1 className="mt-6 text-4xl">{t("completion.certificate")}</h1>
        <p className="mt-8 text-lg text-[var(--color-ink-soft)]">{t("completion.participants")}</p>
        <p className="font-display text-3xl text-[var(--color-brand-ink)]">{names.join(" · ") || family.name}</p>

        <p className="mt-8 text-lg text-[var(--color-ink-soft)]">{t("quest.story")}</p>
        <p className="font-display text-2xl">{translation?.title}</p>

        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-[var(--color-ink-soft)]">{t("quest.category")}</dt>
            <dd className="font-semibold">{pickText(locale, completion.quest.category.nameNl, completion.quest.category.nameEn)}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--color-ink-soft)]">{t("quest.duration")}</dt>
            <dd className="font-semibold">{t("quest.minutes", { count: completion.minutesSpent })}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--color-ink-soft)]">{t("completion.approved")}</dt>
            <dd className="font-semibold">
              <time dateTime={finished.toISOString()}>{finished.toISOString().slice(0, 10)}</time>
            </dd>
          </div>
        </dl>

        <p className="mt-10 text-sm text-[var(--color-ink-soft)]">{family.name}</p>
      </section>
    </main>
  );
}
