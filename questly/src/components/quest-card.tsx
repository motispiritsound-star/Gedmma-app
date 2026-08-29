import Link from "next/link";
import type { Translate } from "@/modules/i18n";
import type { QuestSummary } from "@/modules/quests/types";
import { Badge } from "@/components/ui/primitives";
import { CATEGORY_EMOJI, QuestIllustration } from "@/components/ui/illustration";

export function QuestCard({
  quest,
  t,
  reasons,
  footer,
}: {
  quest: QuestSummary;
  t: Translate;
  reasons?: string[];
  footer?: React.ReactNode;
}) {
  const ageLabel = quest.ageBands.map((band) => t(`ageBand.${band}`)).join(" · ");
  const requiredMaterials = quest.materials.filter((m) => !m.optional);

  return (
    <article className="q-card group flex h-full flex-col overflow-hidden transition-shadow focus-within:shadow-[var(--shadow-lift)] hover:shadow-[var(--shadow-lift)]">
      <div className="relative h-32 w-full overflow-hidden bg-[var(--color-surface-sunk)]">
        <QuestIllustration slug={quest.slug} categorySlug={quest.category.slug} className="h-full w-full" />
        <span className="absolute left-3 top-3 q-badge q-badge--brand bg-white/95">
          <span aria-hidden="true">{CATEGORY_EMOJI[quest.category.slug] ?? "🧭"}</span>
          {quest.category.name}
        </span>
        {quest.isPremium ? (
          <span className="absolute right-3 top-3 q-badge q-badge--accent bg-white/95">{t("quest.premium")}</span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-lg">
          <Link
            href={`/quests/${quest.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {quest.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm text-[var(--color-ink-soft)]">{quest.summary}</p>

        {/* A wrapping list of labelled facts. A fixed two-column grid clipped
            longer values such as "Waarschuwing" at narrow card widths. */}
        <dl className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {[
            { label: t("quest.ageBand"), value: ageLabel },
            { label: t("quest.duration"), value: t("quest.minutes", { count: quest.durationMinutes }) },
            { label: t("quest.difficulty"), value: t(`difficulty.${quest.difficulty}`) },
            { label: t("quest.setting"), value: t(`setting.${quest.setting}`) },
            {
              label: t("quest.participants"),
              value: t("quest.participantsRange", { min: quest.minParticipants, max: quest.maxParticipants }),
            },
            { label: t("quest.safety"), value: t(`safety.${quest.safetyLevel}`) },
          ].map((fact) => (
            <div key={fact.label} className="flex min-w-0 items-baseline gap-1">
              <dt className="shrink-0 text-[var(--color-ink-faint)]">{fact.label}:</dt>
              <dd className="font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>

        {quest.skills.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("quest.skills")}>
            {quest.skills.slice(0, 3).map((skill) => (
              <li key={skill.slug}>
                <Badge tone="brand">{skill.name}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-sm text-[var(--color-ink-soft)]">
          <span className="font-semibold">{t("quest.materials")}: </span>
          {requiredMaterials.length === 0
            ? t("common.none")
            : requiredMaterials.map((m) => m.name).slice(0, 4).join(", ")}
        </p>

        {reasons && reasons.length > 0 ? (
          <div className="rounded-xl bg-[var(--color-brand-soft)] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand-ink)]">{t("home.why")}</p>
            <ul className="mt-1 space-y-0.5 text-sm text-[var(--color-brand-ink)]">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          {!quest.accessible ? <Badge tone="accent">{t("quest.premiumLocked")}</Badge> : null}
          {quest.requiresAdultSupervision ? <Badge tone="warning">{t("quest.adultSupervision")}</Badge> : null}
          {footer}
        </div>
      </div>
    </article>
  );
}
