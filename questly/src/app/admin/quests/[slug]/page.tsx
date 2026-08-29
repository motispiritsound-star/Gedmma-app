import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { getAdminQuest, listQuestVersions } from "@/modules/admin";
import { listCategories, listMaterials, listSkills } from "@/modules/quests/service";
import { NotFoundError } from "@/lib/errors";
import { duplicateQuestAction, setQuestStatusAction } from "@/server-actions/admin";
import { Badge, Card, SectionHeading, StatusNote } from "@/components/ui/primitives";
import { QuestEditor, type QuestDraft } from "../quest-editor";

export const metadata: Metadata = { title: "Quest bewerken", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditQuestPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const { locale, t } = await getTranslator();

  let quest;
  try {
    quest = await getAdminQuest(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [categories, skills, materials, versions] = await Promise.all([
    listCategories(locale),
    listSkills(locale),
    listMaterials(locale),
    listQuestVersions(quest.id),
  ]);

  const nl = quest.translations.find((row) => row.locale === "NL");
  const en = quest.translations.find((row) => row.locale === "EN");

  const draft: QuestDraft = {
    id: quest.id,
    slug: quest.slug,
    categorySlug: quest.category.slug,
    ageBands: quest.ageBands,
    seasons: quest.seasons,
    durationMinutes: quest.durationMinutes,
    difficulty: quest.difficulty,
    setting: quest.setting,
    weather: quest.weather,
    minParticipants: quest.minParticipants,
    maxParticipants: quest.maxParticipants,
    isPremium: quest.isPremium,
    requiresAdultSupervision: quest.requiresAdultSupervision,
    safetyLevel: quest.safetyLevel,
    imageKey: quest.imageKey,
    skillSlugs: quest.skills.map((link) => skills.find((s) => s.id === link.skillId)?.slug ?? "").filter(Boolean),
    materialSlugs: quest.materials.map((link) => materials.find((m) => m.id === link.materialId)?.slug ?? "").filter(Boolean),
    nl: {
      title: nl?.title ?? "",
      summary: nl?.summary ?? "",
      story: nl?.story ?? "",
      objective: nl?.educationalObjective ?? "",
      result: nl?.expectedResult ?? "",
      preparation: (nl?.preparation ?? []).join("\n"),
      audio: nl?.audioScript ?? "",
    },
    en: {
      title: en?.title ?? "",
      summary: en?.summary ?? "",
      story: en?.story ?? "",
      objective: en?.educationalObjective ?? "",
      result: en?.expectedResult ?? "",
      preparation: (en?.preparation ?? []).join("\n"),
      audio: en?.audioScript ?? "",
    },
    steps: quest.steps.map((step) => {
      const stepNl = step.translations.find((row) => row.locale === "NL");
      const stepEn = step.translations.find((row) => row.locale === "EN");
      return {
        durationMinutes: step.durationMinutes ? String(step.durationMinutes) : "",
        requiresParent: step.requiresParent,
        nlTitle: stepNl?.title ?? "",
        nlBody: stepNl?.body ?? "",
        nlTip: stepNl?.tip ?? "",
        enTitle: stepEn?.title ?? "",
        enBody: stepEn?.body ?? "",
        enTip: stepEn?.tip ?? "",
      };
    }),
    safety: quest.safetyInstructions.map((entry) => ({
      severity: entry.severity,
      textNl: entry.textNl,
      textEn: entry.textEn,
    })),
    reflections: quest.reflectionQuestions.map((entry) => ({ textNl: entry.textNl, textEn: entry.textEn })),
  };

  return (
    <div className="q-container max-w-4xl py-8">
      <Link href="/admin/quests" className="q-btn q-btn--ghost mb-4 px-3 py-1.5 text-sm">
        ← {t("admin.quests")}
      </Link>

      <SectionHeading
        level={1}
        title={nl?.title ?? quest.slug}
        description={`${quest.slug} · v${quest.version}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/quests/${quest.slug}/preview`} className="q-btn q-btn--secondary px-4 py-1.5 text-sm">
              {t("admin.quest.preview")}
            </Link>
            <form action={setQuestStatusAction}>
              <input type="hidden" name="questId" value={quest.id} />
              <input type="hidden" name="status" value={quest.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
              <input type="hidden" name="returnTo" value={`/admin/quests/${quest.slug}`} />
              <button type="submit" className="q-btn q-btn--primary px-4 py-1.5 text-sm">
                {quest.status === "PUBLISHED" ? t("admin.quest.unpublish") : t("admin.quest.publish")}
              </button>
            </form>
            <form action={duplicateQuestAction}>
              <input type="hidden" name="slug" value={quest.slug} />
              <button type="submit" className="q-btn q-btn--ghost px-4 py-1.5 text-sm">
                {t("admin.quest.duplicate")}
              </button>
            </form>
          </div>
        }
      />

      <p className="mb-4">
        <Badge tone={quest.status === "PUBLISHED" ? "success" : "warning"}>{t(`status.${quest.status}`)}</Badge>
      </p>

      {query.saved === "1" ? <StatusNote>{t("settings.saved")}</StatusNote> : null}

      <QuestEditor locale={locale} mode="edit" draft={draft} categories={categories} skills={skills} materials={materials} />

      <Card as="section" className="mt-6 p-5">
        <h2 className="mb-3 text-xl">{t("admin.quest.versions")}</h2>
        <ul className="space-y-2">
          {versions.map((version) => (
            <li key={version.id} className="flex flex-wrap items-center gap-2 border-b border-[var(--color-line)] pb-2">
              <Badge tone="brand">v{version.version}</Badge>
              <time dateTime={version.createdAt.toISOString()} className="text-sm text-[var(--color-ink-soft)]">
                {version.createdAt.toISOString().slice(0, 16).replace("T", " ")}
              </time>
              <span className="text-sm">{version.changedBy?.displayName ?? "—"}</span>
              {version.changeNote ? <span className="text-sm text-[var(--color-ink-soft)]">{version.changeNote}</span> : null}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
