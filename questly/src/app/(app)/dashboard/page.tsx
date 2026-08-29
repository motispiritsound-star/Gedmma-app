import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { getDashboard } from "@/modules/progress";
import { getRecommendations, describeReason } from "@/modules/recommendations";
import { Avatar, CATEGORY_EMOJI } from "@/components/ui/illustration";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { QuestCard } from "@/components/quest-card";

export const metadata: Metadata = { title: "Gezinsoverzicht" };
export const dynamic = "force-dynamic";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card as="li" className="p-4">
      <p className="text-sm text-[var(--color-ink-soft)]">{label}</p>
      <p className="font-display text-3xl text-[var(--color-brand-ink)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{hint}</p> : null}
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireFamily();
  const { locale, t } = await getTranslator();

  const [data, recommendations] = await Promise.all([
    getDashboard({ familyId: user.familyId, locale }),
    getRecommendations({ familyId: user.familyId, locale, limit: 3 }),
  ]);

  const hours = Math.floor(data.offlineMinutes / 60);
  const minutes = data.offlineMinutes % 60;

  return (
    <div className="q-container py-8">
      <SectionHeading level={1} title={t("dashboard.title")} description={user.familyName ?? undefined} />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("dashboard.completed")} value={String(data.counts.completed)} />
        <Stat
          label={t("dashboard.offlineMinutes")}
          value={hours > 0 ? `${hours} u ${minutes} m` : `${minutes} m`}
          hint={t("dashboard.offlineMinutesHint")}
        />
        <Stat
          label={t("dashboard.categories")}
          value={`${data.counts.categoriesExplored} / ${data.counts.categoriesTotal}`}
        />
        <Stat label={t("dashboard.milestones")} value={String(data.counts.badges)} />
      </ul>

      {data.awaiting.length > 0 ? (
        <section className="mt-8" aria-labelledby="awaiting-heading">
          <h2 id="awaiting-heading" className="mb-3 text-xl">
            {t("dashboard.awaiting")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.awaiting.map((entry) => (
              <Card as="li" key={entry.id} className="flex items-center justify-between gap-3 p-4">
                <span className="font-semibold">{entry.title}</span>
                <Link href={`/complete/${entry.id}`} className="q-btn q-btn--primary whitespace-nowrap px-4 py-1.5 text-sm">
                  {t("completion.approve")}
                </Link>
              </Card>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="per-child-heading">
          <h2 id="per-child-heading" className="mb-3 text-xl">
            {t("dashboard.perChild")}
          </h2>
          {data.perChild.length === 0 ? (
            <EmptyState title={t("children.empty")} />
          ) : (
            <ul className="space-y-3">
              {data.perChild.map((child) => (
                <Card as="li" key={child.id} className="flex items-center gap-4 p-4">
                  <Avatar avatarKey={child.avatarKey} nickname={child.nickname} size={44} />
                  <div className="flex-1">
                    <p className="font-semibold">{child.nickname}</p>
                    <p className="text-sm text-[var(--color-ink-soft)]">{t(`ageBand.${child.ageBand}`)}</p>
                  </div>
                  <dl className="flex gap-4 text-sm">
                    <div className="text-center">
                      <dt className="text-[var(--color-ink-faint)]">{t("dashboard.completed")}</dt>
                      <dd className="font-display text-xl">{child.completed}</dd>
                    </div>
                    <div className="text-center">
                      <dt className="text-[var(--color-ink-faint)]">{t("dashboard.milestones")}</dt>
                      <dd className="font-display text-xl">{child.badges}</dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="mb-3 text-xl">
            {t("dashboard.categories")}
          </h2>
          <Card className="p-4">
            <ul className="space-y-2">
              {data.categoryProgress.map((category) => (
                <li key={category.slug} className="flex items-center gap-3">
                  <span aria-hidden="true">{CATEGORY_EMOJI[category.slug] ?? "🧭"}</span>
                  <span className="flex-1">{category.name}</span>
                  <span className="text-sm text-[var(--color-ink-soft)]">
                    {category.completed} {category.explored ? "✓" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      {data.badges.length > 0 ? (
        <section className="mt-8" aria-labelledby="badges-heading">
          <h2 id="badges-heading" className="mb-3 text-xl">
            {t("dashboard.milestones")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.badges.map((badge) => (
              <Card as="li" key={badge.id} className="p-4">
                <div className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-2xl">
                    🏅
                  </span>
                  <div>
                    <p className="font-semibold">{badge.name}</p>
                    <p className="text-sm text-[var(--color-ink-soft)]">{badge.description}</p>
                    {badge.childNickname ? <Badge>{badge.childNickname}</Badge> : null}
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="completed-heading">
          <h2 id="completed-heading" className="mb-3 text-xl">
            {t("dashboard.completed")}
          </h2>
          {data.completions.length === 0 ? (
            <EmptyState title={t("dashboard.noData")} />
          ) : (
            <ul className="space-y-2">
              {data.completions.map((entry) => (
                <Card as="li" key={entry.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <Link href={`/quests/${entry.slug}`} className="font-semibold underline underline-offset-2">
                      {entry.title}
                    </Link>
                    <p className="text-sm text-[var(--color-ink-soft)]">
                      {entry.categoryName} ·{" "}
                      {entry.finishedAt ? (
                        <time dateTime={entry.finishedAt.toISOString()}>{entry.finishedAt.toISOString().slice(0, 10)}</time>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {entry.participants.map((child) => (
                      <Badge key={child.id}>{child.nickname}</Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="favourites-heading">
          <h2 id="favourites-heading" className="mb-3 text-xl">
            {t("dashboard.favourites")}
          </h2>
          {data.favourites.length === 0 ? (
            <EmptyState title={t("dashboard.noData")} />
          ) : (
            <ul className="space-y-2">
              {data.favourites.map((entry) => (
                <Card as="li" key={entry.id} className="p-4">
                  <Link href={`/quests/${entry.slug}`} className="font-semibold underline underline-offset-2">
                    {entry.title}
                  </Link>
                  <p className="text-sm text-[var(--color-ink-soft)]">{entry.categoryName}</p>
                </Card>
              ))}
            </ul>
          )}
        </section>
      </div>

      {data.memories.length > 0 ? (
        <section className="mt-8" aria-labelledby="memories-heading">
          <h2 id="memories-heading" className="mb-1 text-xl">
            {t("dashboard.memories")}
          </h2>
          <p className="mb-3 text-sm text-[var(--color-ink-soft)]">{t("completion.noteHint")}</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.memories.map((memory) => (
              <Card as="li" key={memory.completionId} className="p-4">
                <p className="font-semibold">{memory.questTitle}</p>
                {memory.note ? <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{memory.note}</p> : null}
                {memory.images.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {memory.images.map((image) => (
                      <li key={image.id}>
                        <Image
                          src={image.url}
                          alt=""
                          width={96}
                          height={96}
                          unoptimized
                          className="h-24 w-24 rounded-lg border border-[var(--color-line)] object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ))}
          </ul>
        </section>
      ) : null}

      {recommendations.length > 0 ? (
        <section className="mt-10" aria-labelledby="next-heading">
          <h2 id="next-heading" className="mb-3 text-xl">
            {t("dashboard.recommended")}
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((entry) => (
              <li key={entry.quest.id} className="relative">
                <QuestCard quest={entry.quest} t={t} reasons={entry.reasons.map((reason) => describeReason(reason, t))} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
