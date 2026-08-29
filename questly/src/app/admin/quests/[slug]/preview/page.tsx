import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { getQuestBySlug } from "@/modules/quests";
import { entitlementsFor } from "@/modules/subscriptions";
import { NotFoundError } from "@/lib/errors";
import { QuestDetailView } from "@/components/quest-detail-view";
import { Badge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Voorbeeld", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Renders a quest exactly as a family would see it, drafts included. */
export default async function QuestPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale, t } = await getTranslator();

  let quest;
  try {
    quest = await getQuestBySlug({
      slug,
      locale,
      entitlements: entitlementsFor("FAMILY_PREMIUM"),
      includeUnpublished: true,
    });
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  return (
    <div className="q-container py-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href={`/admin/quests/${slug}`} className="q-btn q-btn--ghost px-3 py-1.5 text-sm">
          ← {t("admin.quest.edit")}
        </Link>
        <Badge tone="warning">{t("admin.quest.preview")}</Badge>
        <Badge>{t(`status.${quest.status}`)}</Badge>
      </div>
      <QuestDetailView quest={quest} t={t} />
    </div>
  );
}
