import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { listAdminQuests } from "@/modules/admin";
import { toDbLocale } from "@/modules/i18n";
import { duplicateQuestAction, setQuestStatusAction } from "@/server-actions/admin";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Quests", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_TONE = { DRAFT: "warning", PUBLISHED: "success", ARCHIVED: "neutral" } as const;

export default async function AdminQuestListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { locale, t } = await getTranslator();

  const status =
    params.status === "DRAFT" || params.status === "PUBLISHED" || params.status === "ARCHIVED" ? params.status : undefined;
  const search = typeof params.search === "string" ? params.search : undefined;
  const quests = await listAdminQuests({ status, search });
  const dbLocale = toDbLocale(locale);

  return (
    <div className="q-container py-8">
      <SectionHeading
        level={1}
        title={t("admin.quests")}
        description={`${quests.length}`}
        action={
          <Link href="/admin/quests/new" className="q-btn q-btn--primary">
            {t("admin.quest.new")}
          </Link>
        }
      />

      <Card className="mb-5 p-4">
        <form method="get" action="/admin/quests" className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <label className="q-label" htmlFor="search">
              {t("common.search")}
            </label>
            <input id="search" name="search" type="search" defaultValue={search ?? ""} className="q-field" />
          </div>
          <div>
            <label className="q-label" htmlFor="status">
              Status
            </label>
            <select id="status" name="status" defaultValue={status ?? ""} className="q-field">
              <option value="">{t("common.all")}</option>
              <option value="DRAFT">{t("status.DRAFT")}</option>
              <option value="PUBLISHED">{t("status.PUBLISHED")}</option>
              <option value="ARCHIVED">{t("status.ARCHIVED")}</option>
            </select>
          </div>
          <button type="submit" className="q-btn q-btn--secondary">
            {t("quests.filter.apply")}
          </button>
        </form>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left">
          <caption className="q-visually-hidden">{t("admin.quests")}</caption>
          <thead>
            <tr className="border-b-2 border-[var(--color-line-strong)]">
              <th scope="col" className="py-2 pr-3">
                Titel
              </th>
              <th scope="col" className="py-2 pr-3">
                {t("quest.category")}
              </th>
              <th scope="col" className="py-2 pr-3">
                Status
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                v
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                {t("dashboard.completed")}
              </th>
              <th scope="col" className="py-2">
                <span className="q-visually-hidden">Acties</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {quests.map((quest) => {
              const title =
                quest.translations.find((row) => row.locale === dbLocale)?.title ??
                quest.translations[0]?.title ??
                quest.slug;
              return (
                <tr key={quest.id} className="border-b border-[var(--color-line)] align-top">
                  <td className="py-3 pr-3">
                    <Link href={`/admin/quests/${quest.slug}`} className="font-semibold underline underline-offset-2">
                      {title}
                    </Link>
                    <p className="text-sm text-[var(--color-ink-faint)]">{quest.slug}</p>
                  </td>
                  <td className="py-3 pr-3">{locale === "en" ? quest.category.nameEn : quest.category.nameNl}</td>
                  <td className="py-3 pr-3">
                    <Badge tone={STATUS_TONE[quest.status]}>{t(`status.${quest.status}`)}</Badge>
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums">{quest.version}</td>
                  <td className="py-3 pr-3 text-right tabular-nums">{quest._count.completions}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Link href={`/admin/quests/${quest.slug}/preview`} className="q-btn q-btn--ghost px-3 py-1 text-sm">
                        {t("admin.quest.preview")}
                      </Link>
                      <form action={setQuestStatusAction}>
                        <input type="hidden" name="questId" value={quest.id} />
                        <input type="hidden" name="status" value={quest.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                        <button type="submit" className="q-btn q-btn--secondary px-3 py-1 text-sm">
                          {quest.status === "PUBLISHED" ? t("admin.quest.unpublish") : t("admin.quest.publish")}
                        </button>
                      </form>
                      <form action={duplicateQuestAction}>
                        <input type="hidden" name="slug" value={quest.slug} />
                        <button type="submit" className="q-btn q-btn--ghost px-3 py-1 text-sm">
                          {t("admin.quest.duplicate")}
                        </button>
                      </form>
                      {quest.status !== "ARCHIVED" ? (
                        <form action={setQuestStatusAction}>
                          <input type="hidden" name="questId" value={quest.id} />
                          <input type="hidden" name="status" value="ARCHIVED" />
                          <button type="submit" className="q-btn q-btn--ghost px-3 py-1 text-sm">
                            {t("admin.quest.archive")}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
