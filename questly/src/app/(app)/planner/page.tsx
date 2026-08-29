import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { getEntitlements } from "@/modules/subscriptions";
import { listPlanned } from "@/modules/progress";
import { listChildren } from "@/modules/children";
import { listQuests } from "@/modules/quests";
import { unplanQuestAction } from "@/server-actions/quests";
import { PlanQuestForm } from "@/components/forms/plan-quest-form";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Weekplanner" };
export const dynamic = "force-dynamic";

/** Monday of the ISO week containing `date`, in UTC. */
function startOfWeek(date: Date): Date {
  const day = date.getUTCDay() || 7;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - day + 1));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireFamily();
  const { locale, t } = await getTranslator();

  const entitlements = await getEntitlements(user.familyId);
  const offset = Number(typeof params.week === "string" ? params.week : 0) || 0;
  const weekStart = addDays(startOfWeek(new Date()), offset * 7);
  const weekEnd = addDays(weekStart, 6);

  const [planned, children, library] = await Promise.all([
    listPlanned({ familyId: user.familyId, from: weekStart, to: weekEnd }),
    listChildren(user.familyId),
    listQuests({ filters: {}, locale, entitlements, take: 12 }),
  ]);

  const dayFormatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <div className="q-container py-8">
      <SectionHeading
        level={1}
        title={t("planner.title")}
        description={t("planner.week", { date: isoDate(weekStart) })}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/planner?week=${offset - 1}`} className="q-btn q-btn--secondary px-4 py-1.5 text-sm">
              ← {t("planner.previous")}
            </Link>
            <Link href="/planner" className="q-btn q-btn--ghost px-4 py-1.5 text-sm">
              {t("planner.today")}
            </Link>
            <Link href={`/planner?week=${offset + 1}`} className="q-btn q-btn--secondary px-4 py-1.5 text-sm">
              {t("planner.next")} →
            </Link>
          </div>
        }
      />

      {!entitlements.weeklyPlanner ? (
        <EmptyState
          title={t("planner.premiumOnly")}
          action={
            <Link href="/settings/subscription" className="q-btn q-btn--primary">
              {t("subscription.upgrade")}
            </Link>
          }
        />
      ) : (
        <>
          <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {days.map((day) => {
              const entries = planned.filter((entry) => isoDate(entry.scheduledFor) === isoDate(day));
              return (
                <Card as="li" key={isoDate(day)} className="p-4">
                  <h2 className="text-base font-semibold capitalize">
                    <time dateTime={isoDate(day)}>{dayFormatter.format(day)}</time>
                  </h2>
                  {entries.length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{t("planner.empty")}</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {entries.map((entry) => {
                        const translation =
                          entry.quest.translations.find((row) => row.locale === (locale === "en" ? "EN" : "NL")) ??
                          entry.quest.translations[0];
                        return (
                          <li key={entry.id} className="rounded-xl bg-[var(--color-surface-sunk)] p-3">
                            <Link href={`/quests/${entry.quest.slug}`} className="font-semibold underline underline-offset-2">
                              {translation?.title}
                            </Link>
                            <p className="mt-1 flex flex-wrap gap-1">
                              {entry.children.map((link) => (
                                <Badge key={link.childProfileId}>{link.childProfile.nickname}</Badge>
                              ))}
                            </p>
                            <form action={unplanQuestAction} className="mt-2">
                              <input type="hidden" name="plannedQuestId" value={entry.id} />
                              <button type="submit" className="q-btn q-btn--ghost px-3 py-1 text-sm">
                                {t("planner.remove")}
                              </button>
                            </form>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              );
            })}
          </ol>

          <section className="mt-8" aria-labelledby="plan-heading">
            <h2 id="plan-heading" className="mb-3 text-xl">
              {t("planner.add")}
            </h2>
            <div className="grid gap-4 lg:grid-cols-3">
              {library.items.slice(0, 6).map((quest) => (
                <Card key={quest.id} className="p-4">
                  <p className="font-semibold">{quest.title}</p>
                  <p className="mb-3 text-sm text-[var(--color-ink-soft)]">
                    {quest.category.name} · {t("quest.minutes", { count: quest.durationMinutes })}
                  </p>
                  <PlanQuestForm
                    locale={locale}
                    questSlug={quest.slug}
                    childProfiles={children.map((child) => ({ id: child.id, nickname: child.nickname }))}
                    enabled
                    defaultDate={isoDate(weekStart)}
                  />
                </Card>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
