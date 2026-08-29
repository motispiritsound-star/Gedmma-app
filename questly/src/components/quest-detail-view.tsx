import type { Translate } from "@/modules/i18n";
import type { QuestDetail } from "@/modules/quests/types";
import { Badge, Card } from "@/components/ui/primitives";
import { CATEGORY_EMOJI, QuestIllustration } from "@/components/ui/illustration";

const SAFETY_TONE = { INFO: "neutral", WARNING: "warning", CRITICAL: "danger" } as const;

export function QuestDetailView({
  quest,
  t,
  actions,
}: {
  quest: QuestDetail;
  t: Translate;
  actions?: React.ReactNode;
}) {
  return (
    <article className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <Card className="overflow-hidden">
          <div className="h-44 w-full bg-[var(--color-surface-sunk)] sm:h-56">
            <QuestIllustration slug={quest.slug} categorySlug={quest.category.slug} className="h-full w-full" />
          </div>
          <div className="p-5">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="brand">
                <span aria-hidden="true">{CATEGORY_EMOJI[quest.category.slug] ?? "🧭"}</span>
                {quest.category.name}
              </Badge>
              <Badge>{quest.ageBands.map((band) => t(`ageBand.${band}`)).join(" · ")}</Badge>
              <Badge>{t("quest.minutes", { count: quest.durationMinutes })}</Badge>
              <Badge>{t(`difficulty.${quest.difficulty}`)}</Badge>
              <Badge>{t(`setting.${quest.setting}`)}</Badge>
              <Badge>{t(`weather.${quest.weather}`)}</Badge>
              <Badge>{t("quest.participantsRange", { min: quest.minParticipants, max: quest.maxParticipants })}</Badge>
              {quest.isPremium ? <Badge tone="accent">{t("quest.premium")}</Badge> : <Badge tone="success">{t("quest.free")}</Badge>}
            </div>

            <h1 className="text-3xl">{quest.title}</h1>
            <p className="mt-2 text-lg text-[var(--color-ink-soft)]">{quest.summary}</p>

            <h2 className="mt-6 text-xl">{t("quest.story")}</h2>
            <p className="mt-2 whitespace-pre-line">{quest.story}</p>

            <h2 className="mt-6 text-xl">{t("quest.objective")}</h2>
            <p className="mt-2">{quest.educationalObjective}</p>

            <h2 className="mt-6 text-xl">{t("quest.expectedResult")}</h2>
            <p className="mt-2">{quest.expectedResult}</p>
          </div>
        </Card>

        <Card className="mt-5 p-5">
          <h2 className="text-xl">{t("quest.steps")}</h2>
          <ol className="mt-3 space-y-4">
            {quest.steps.map((step) => (
              <li key={step.id} className="rounded-xl bg-[var(--color-surface-sunk)] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="q-badge q-badge--brand">{step.position}</span>
                  <h3 className="text-lg">{step.title}</h3>
                  {step.durationMinutes ? <Badge>{t("quest.minutes", { count: step.durationMinutes })}</Badge> : null}
                  {step.requiresParent ? <Badge tone="warning">{t("quest.adultSupervision")}</Badge> : null}
                </div>
                <p className="mt-2 whitespace-pre-line">{step.body}</p>
                {step.tip ? (
                  <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
                    <span aria-hidden="true">💡 </span>
                    {step.tip}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </Card>

        <Card className="mt-5 p-5">
          <h2 className="text-xl">{t("quest.reflection")}</h2>
          <ul className="mt-3 space-y-2">
            {quest.reflectionQuestions.map((question) => (
              <li key={question.id} className="flex gap-2">
                <span aria-hidden="true">❔</span>
                <span>{question.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <aside className="space-y-5">
        {actions ? <Card className="p-5">{actions}</Card> : null}

        <Card className="p-5">
          <h2 className="text-lg">{t("quest.preparation")}</h2>
          <ul className="mt-2 space-y-1.5">
            {quest.preparation.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true">☐</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg">{t("quest.materials")}</h2>
          <ul className="mt-2 space-y-1.5">
            {quest.materials.length === 0 ? <li>{t("common.none")}</li> : null}
            {quest.materials.map((material) => (
              <li key={material.slug} className="flex flex-wrap items-center gap-2">
                <span>{material.name}</span>
                {material.quantity ? <span className="text-sm text-[var(--color-ink-soft)]">({material.quantity})</span> : null}
                {material.optional ? <Badge>{t("common.optional")}</Badge> : null}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg">{t("quest.safety")}</h2>
          {quest.requiresAdultSupervision ? (
            <p className="mt-2">
              <Badge tone="warning">{t("quest.adultSupervision")}</Badge>
            </p>
          ) : null}
          <ul className="mt-2 space-y-2">
            {quest.safetyInstructions.map((instruction) => (
              <li key={instruction.id} className="flex flex-col gap-1">
                <Badge tone={SAFETY_TONE[instruction.severity]}>{t(`safety.${instruction.severity}`)}</Badge>
                <span>{instruction.text}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg">{t("quest.skills")}</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {quest.skills.map((skill) => (
              <li key={skill.slug}>
                <Badge tone="brand">{skill.name}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </aside>
    </article>
  );
}
