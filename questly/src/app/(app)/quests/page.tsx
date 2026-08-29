import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { getEntitlements } from "@/modules/subscriptions";
import { listCategories, listMaterials, listQuests, listSkills, parseQuestFilters } from "@/modules/quests";
import { listFavouriteSlugs } from "@/modules/progress";
import { toggleFavouriteAction } from "@/server-actions/quests";
import { QuestCard } from "@/components/quest-card";
import { EmptyState, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Questbibliotheek" };
export const dynamic = "force-dynamic";

export default async function QuestLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireFamily();
  const { locale, t } = await getTranslator();

  const filters = parseQuestFilters(params);
  const entitlements = await getEntitlements(user.familyId);

  const [{ items, total }, categories, skills, materials, favourites] = await Promise.all([
    listQuests({ filters, locale, entitlements, take: 120 }),
    listCategories(locale),
    listSkills(locale),
    listMaterials(locale),
    listFavouriteSlugs(user.familyId),
  ]);

  const favouriteSet = new Set(favourites);
  const query = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) =>
      typeof value === "string" && value ? ([[key, value]] as [string, string][]) : [],
    ),
  ).toString();
  const returnTo = query ? `/quests?${query}` : "/quests";

  const { QuestFiltersPanel } = await import("./filters");

  return (
    <div className="q-container py-8">
      <SectionHeading level={1} title={t("quests.title")} description={t("quests.results", { count: total })} />

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <QuestFiltersPanel t={t} filters={filters} categories={categories} skills={skills} materials={materials} />

        <div>
          {items.length === 0 ? (
            <EmptyState title={t("quests.empty")} description={t("quests.emptyHint")} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((quest) => (
                <li key={quest.id} className="relative">
                  <QuestCard
                    quest={quest}
                    t={t}
                    footer={
                      <form action={toggleFavouriteAction} className="relative z-10">
                        <input type="hidden" name="questSlug" value={quest.slug} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button type="submit" className="q-btn q-btn--ghost px-3 py-1 text-sm">
                          <span aria-hidden="true">{favouriteSet.has(quest.slug) ? "★" : "☆"}</span>
                          {favouriteSet.has(quest.slug) ? t("quest.unfavourite") : t("quest.favourite")}
                        </button>
                      </form>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
