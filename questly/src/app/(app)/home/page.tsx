import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { getFamily } from "@/modules/families";
import { getRecommendations, describeReason } from "@/modules/recommendations";
import { getEntitlements } from "@/modules/subscriptions";
import { prisma } from "@/lib/db";
import { QuestCard } from "@/components/quest-card";
import { Card, EmptyState, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Start" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireFamily();
  const { locale, t } = await getTranslator();

  const family = await getFamily(user.familyId);
  if (!family.onboardingCompletedAt) redirect("/onboarding");

  const [recommendations, entitlements, inProgress, planned] = await Promise.all([
    getRecommendations({ familyId: user.familyId, locale, limit: 6 }),
    getEntitlements(user.familyId),
    prisma.questCompletion.findMany({
      where: { familyId: user.familyId, status: "IN_PROGRESS" },
      orderBy: { startedAt: "desc" },
      take: 3,
      include: { quest: { include: { translations: true } } },
    }),
    prisma.plannedQuest.findMany({
      where: { familyId: user.familyId, completedAt: null },
      orderBy: { scheduledFor: "asc" },
      take: 3,
      include: { quest: { include: { translations: true } } },
    }),
  ]);

  const title = (translations: { locale: "NL" | "EN"; title: string }[]) =>
    translations.find((row) => row.locale === (locale === "en" ? "EN" : "NL"))?.title ?? translations[0]?.title ?? "";

  return (
    <div className="q-container py-8">
      <SectionHeading level={1} title={t("home.greeting", { name: user.displayName })} description={t("home.subtitle")} />

      {inProgress.length > 0 ? (
        <section className="mb-8" aria-labelledby="in-progress-heading">
          <h2 id="in-progress-heading" className="mb-3 text-xl">
            {t("home.continue")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((completion) => (
              <Card as="li" key={completion.id} className="flex items-center justify-between gap-3 p-4">
                <span className="font-semibold">{title(completion.quest.translations)}</span>
                <Link href={`/adventure/${completion.id}`} className="q-btn q-btn--primary whitespace-nowrap px-4 py-1.5 text-sm">
                  {t("quest.resume")}
                </Link>
              </Card>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="recommended-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="recommended-heading" className="text-xl">
            {t("home.recommended")}
          </h2>
          {!entitlements.personalisedRecommendations ? (
            <Link href="/settings/subscription" className="q-badge q-badge--accent">
              {t("subscription.upgrade")}
            </Link>
          ) : null}
        </div>

        {recommendations.length === 0 ? (
          <EmptyState
            title={t("home.emptyRecommendations")}
            action={
              <Link href="/children" className="q-btn q-btn--primary">
                {t("children.add")}
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((entry) => (
              <li key={entry.quest.id} className="relative">
                <QuestCard
                  quest={entry.quest}
                  t={t}
                  reasons={entry.reasons.map((reason) => describeReason(reason, t))}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {planned.length > 0 ? (
        <section className="mt-10" aria-labelledby="planned-heading">
          <h2 id="planned-heading" className="mb-3 text-xl">
            {t("home.planned")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {planned.map((entry) => (
              <Card as="li" key={entry.id} className="p-4">
                <p className="text-sm text-[var(--color-ink-soft)]">
                  <time dateTime={entry.scheduledFor.toISOString().slice(0, 10)}>
                    {entry.scheduledFor.toISOString().slice(0, 10)}
                  </time>
                </p>
                <Link href={`/quests/${entry.quest.slug}`} className="font-semibold underline underline-offset-2">
                  {title(entry.quest.translations)}
                </Link>
              </Card>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
