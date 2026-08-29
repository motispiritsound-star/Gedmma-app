import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { platformCounts, questStatistics } from "@/modules/admin";
import { Card, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Beheer", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { t } = await getTranslator();
  const [counts, stats] = await Promise.all([platformCounts(), questStatistics()]);

  const tiles = [
    { label: t("admin.families"), value: counts.families },
    { label: "Users", value: counts.users },
    { label: t("nav.children"), value: counts.children },
    { label: t("admin.quests"), value: `${counts.published} / ${counts.quests}` },
    { label: t("dashboard.completed"), value: counts.completions },
  ];

  return (
    <div className="q-container py-8">
      <SectionHeading level={1} title={t("admin.title")} description={t("admin.stats")} />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((tile) => (
          <Card as="li" key={tile.label} className="p-4">
            <p className="text-sm text-[var(--color-ink-soft)]">{tile.label}</p>
            <p className="font-display text-3xl text-[var(--color-brand-ink)]">{tile.value}</p>
          </Card>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card as="section" className="p-5">
          <h2 className="mb-3 text-xl">{t("admin.quests")}</h2>
          <table className="w-full text-left">
            <caption className="q-visually-hidden">{t("admin.stats")}</caption>
            <thead>
              <tr className="border-b border-[var(--color-line)]">
                <th scope="col" className="py-2">
                  Status
                </th>
                <th scope="col" className="py-2 text-right">
                  #
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.byStatus.map((row) => (
                <tr key={row.status} className="border-b border-[var(--color-line)]">
                  <td className="py-2">{t(`status.${row.status}`)}</td>
                  <td className="py-2 text-right tabular-nums">{row._count._all}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link href="/admin/quests" className="q-btn q-btn--primary mt-4">
            {t("admin.quests")}
          </Link>
        </Card>

        <Card as="section" className="p-5">
          <h2 className="mb-3 text-xl">{t("dashboard.completed")}</h2>
          {stats.topQuests.length === 0 ? (
            <p className="text-[var(--color-ink-soft)]">{t("dashboard.noData")}</p>
          ) : (
            <table className="w-full text-left">
              <caption className="q-visually-hidden">{t("dashboard.completed")}</caption>
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th scope="col" className="py-2">
                    Quest
                  </th>
                  <th scope="col" className="py-2 text-right">
                    #
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.topQuests.map((row) => (
                  <tr key={row.slug} className="border-b border-[var(--color-line)]">
                    <td className="py-2">{row.title || row.slug}</td>
                    <td className="py-2 text-right tabular-nums">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
