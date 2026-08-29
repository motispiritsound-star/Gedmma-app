import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { getEntitlements } from "@/modules/subscriptions";
import { getQuestBySlug } from "@/modules/quests";
import { listChildren } from "@/modules/children";
import { listFavouriteSlugs } from "@/modules/progress";
import { NotFoundError } from "@/lib/errors";
import { startQuestAction, toggleFavouriteAction } from "@/server-actions/quests";
import { QuestDetailView } from "@/components/quest-detail-view";
import { PlanQuestForm } from "@/components/forms/plan-quest-form";
import { Badge } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " ") };
}

export default async function QuestDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireFamily();
  const { locale, t } = await getTranslator();
  const entitlements = await getEntitlements(user.familyId);

  let quest;
  try {
    quest = await getQuestBySlug({ slug, locale, entitlements });
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const [children, favourites] = await Promise.all([listChildren(user.familyId), listFavouriteSlugs(user.familyId)]);
  const isFavourite = favourites.includes(quest.slug);

  return (
    <div className="q-container py-8">
      <Link href="/quests" className="q-btn q-btn--ghost mb-4 px-3 py-1.5 text-sm">
        ← {t("quests.title")}
      </Link>

      <QuestDetailView
        quest={quest}
        t={t}
        actions={
          <div className="space-y-3">
            {quest.accessible ? (
              <form action={startQuestAction}>
                <input type="hidden" name="questSlug" value={quest.slug} />
                <button type="submit" className="q-btn q-btn--accent w-full">
                  {t("quest.start")}
                </button>
              </form>
            ) : (
              <div className="space-y-2">
                <Badge tone="accent">{t("quest.premiumLocked")}</Badge>
                <Link href="/settings/subscription" className="q-btn q-btn--primary w-full">
                  {t("quest.premiumLockedCta")}
                </Link>
              </div>
            )}

            <form action={toggleFavouriteAction}>
              <input type="hidden" name="questSlug" value={quest.slug} />
              <input type="hidden" name="returnTo" value={`/quests/${quest.slug}`} />
              <button type="submit" className="q-btn q-btn--secondary w-full">
                <span aria-hidden="true">{isFavourite ? "★" : "☆"}</span>
                {isFavourite ? t("quest.unfavourite") : t("quest.favourite")}
              </button>
            </form>

            <PlanQuestForm
              locale={locale}
              questSlug={quest.slug}
              childProfiles={children.map((child) => ({ id: child.id, nickname: child.nickname }))}
              enabled={entitlements.weeklyPlanner}
            />
          </div>
        }
      />
    </div>
  );
}
