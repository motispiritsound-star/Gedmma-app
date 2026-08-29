import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { listCategories, listMaterials, listSkills } from "@/modules/quests/service";
import { SectionHeading } from "@/components/ui/primitives";
import { EMPTY_STEP, QuestEditor, type QuestDraft } from "../quest-editor";

export const metadata: Metadata = { title: "Nieuwe quest", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewQuestPage() {
  const { locale, t } = await getTranslator();
  const [categories, skills, materials] = await Promise.all([
    listCategories(locale),
    listSkills(locale),
    listMaterials(locale),
  ]);

  const draft: QuestDraft = {
    slug: "",
    categorySlug: categories[0]?.slug ?? "nature",
    ageBands: ["AGE_9_11"],
    seasons: ["SPRING", "SUMMER", "AUTUMN", "WINTER"],
    durationMinutes: 60,
    difficulty: "EASY",
    setting: "BOTH",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 4,
    isPremium: false,
    requiresAdultSupervision: false,
    safetyLevel: "INFO",
    imageKey: "default",
    skillSlugs: [],
    materialSlugs: [],
    nl: { title: "", summary: "", story: "", objective: "", result: "", preparation: "", audio: "" },
    en: { title: "", summary: "", story: "", objective: "", result: "", preparation: "", audio: "" },
    steps: [{ ...EMPTY_STEP }],
    safety: [{ severity: "INFO", textNl: "", textEn: "" }],
    reflections: [{ textNl: "", textEn: "" }],
  };

  return (
    <div className="q-container max-w-4xl py-8">
      <Link href="/admin/quests" className="q-btn q-btn--ghost mb-4 px-3 py-1.5 text-sm">
        ← {t("admin.quests")}
      </Link>
      <SectionHeading level={1} title={t("admin.quest.new")} description="Nieuwe quests starten altijd als concept." />
      <QuestEditor locale={locale} mode="create" draft={draft} categories={categories} skills={skills} materials={materials} />
    </div>
  );
}
