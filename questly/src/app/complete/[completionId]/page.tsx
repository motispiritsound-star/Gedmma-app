import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { getSessionUser } from "@/modules/auth/session";
import { getCompletion } from "@/modules/progress";
import { listChildren } from "@/modules/children";
import { getFamily } from "@/modules/families";
import { getEntitlements } from "@/modules/subscriptions";
import { grantUrls } from "@/modules/media";
import { pickText } from "@/modules/i18n";
import { NotFoundError } from "@/lib/errors";
import { decideCompletionAction } from "@/server-actions/quests";
import { CompletionForm } from "@/components/forms/completion-form";
import { Badge, Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Afronden", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CompletionPage({
  params,
  searchParams,
}: {
  params: Promise<{ completionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { completionId } = await params;
  const query = await searchParams;
  const user = await getSessionUser();
  if (!user?.familyId) redirect("/signin");

  const { locale, t } = await getTranslator();

  let completion;
  try {
    completion = await getCompletion(user.familyId, completionId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [children, family, entitlements] = await Promise.all([
    listChildren(user.familyId),
    getFamily(user.familyId),
    getEntitlements(user.familyId),
  ]);

  const translation =
    completion.quest.translations.find((row) => row.locale === (locale === "en" ? "EN" : "NL")) ??
    completion.quest.translations[0];
  const defaultMinutes = Number(typeof query.minutes === "string" ? query.minutes : 0) || completion.minutesSpent || 30;
  const images = grantUrls(completion.evidence, user.familyId);

  return (
    <div className="q-container max-w-3xl py-8">
      <Link href="/home" className="q-btn q-btn--ghost mb-4 px-3 py-1.5 text-sm">
        ← {t("nav.home")}
      </Link>

      <h1 className="text-3xl">{t("completion.title")}</h1>
      <p className="mt-1 text-lg text-[var(--color-ink-soft)]">{translation?.title}</p>

      {completion.status === "IN_PROGRESS" || completion.status === "REJECTED" ? (
        <Card className="mt-6 p-6">
          {completion.status === "REJECTED" ? (
            <p className="mb-4">
              <Badge tone="warning">{t("completion.rejected")}</Badge>
              {completion.rejectionReason ? <span className="ml-2">{completion.rejectionReason}</span> : null}
            </p>
          ) : null}
          <CompletionForm
            locale={locale}
            completionId={completion.id}
            childProfiles={children.map((child) => ({ id: child.id, nickname: child.nickname }))}
            reflectionQuestions={completion.quest.reflectionQuestions.map((question) => ({
              id: question.id,
              text: pickText(locale, question.textNl, question.textEn),
            }))}
            requiresApproval={family.requireParentApproval}
            defaultMinutes={defaultMinutes}
          />
        </Card>
      ) : null}

      {completion.status === "AWAITING_APPROVAL" ? (
        <Card className="mt-6 p-6">
          <p className="mb-4" role="status">
            <Badge tone="warning">{t("completion.awaitingApproval")}</Badge>
          </p>
          <dl className="mb-5 space-y-2">
            <div className="flex gap-2">
              <dt className="font-semibold">{t("completion.minutes")}</dt>
              <dd>{t("quest.minutes", { count: completion.minutesSpent })}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-semibold">{t("completion.participants")}</dt>
              <dd>{completion.participants.map((p) => p.childProfile.nickname).join(", ") || t("common.none")}</dd>
            </div>
          </dl>

          {completion.reflections.length > 0 ? (
            <ul className="mb-5 space-y-3">
              {completion.reflections.map((reflection) => (
                <li key={reflection.id}>
                  <p className="font-semibold">{reflection.prompt}</p>
                  <p className="text-[var(--color-ink-soft)]">{reflection.answer}</p>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <form action={decideCompletionAction}>
              <input type="hidden" name="completionId" value={completion.id} />
              <input type="hidden" name="decision" value="approve" />
              <button type="submit" className="q-btn q-btn--primary">
                {t("completion.approve")}
              </button>
            </form>
            <form action={decideCompletionAction}>
              <input type="hidden" name="completionId" value={completion.id} />
              <input type="hidden" name="decision" value="reject" />
              <button type="submit" className="q-btn q-btn--secondary">
                {t("completion.reject")}
              </button>
            </form>
          </div>
        </Card>
      ) : null}

      {completion.status === "APPROVED" ? (
        <Card className="mt-6 p-6">
          <p className="text-3xl" aria-hidden="true">
            🎉
          </p>
          <h2 className="mt-2 text-2xl">{t("completion.thanks")}</h2>
          <p className="mt-1">
            <Badge tone="success">{t("completion.approved")}</Badge>
          </p>

          {completion.awardedBadges.length > 0 ? (
            <>
              <h3 className="mt-6 text-lg">{t("completion.badgesEarned")}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {completion.awardedBadges.map((awarded) => (
                  <li key={awarded.id}>
                    <Badge tone="brand">{pickText(locale, awarded.badge.nameNl, awarded.badge.nameEn)}</Badge>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {images.length > 0 ? (
            <>
              <h3 className="mt-6 text-lg">{t("dashboard.memories")}</h3>
              <ul className="mt-2 flex flex-wrap gap-3">
                {images.map((image) => (
                  <li key={image.id}>
                    <Image
                      src={image.url}
                      alt=""
                      width={160}
                      height={160}
                      unoptimized
                      className="h-40 w-40 rounded-xl border border-[var(--color-line)] object-cover"
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard" className="q-btn q-btn--primary">
              {t("dashboard.title")}
            </Link>
            {entitlements.certificates ? (
              <Link href={`/complete/${completion.id}/certificate`} className="q-btn q-btn--secondary">
                {t("completion.certificate")}
              </Link>
            ) : null}
            <Link href="/quests" className="q-btn q-btn--ghost">
              {t("quests.title")}
            </Link>
          </div>
        </Card>
      ) : null}

    </div>
  );
}
