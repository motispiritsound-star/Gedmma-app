import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { subscriptionOverview } from "@/modules/admin";
import { Badge, Card, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Abonnementen", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage() {
  const { t } = await getTranslator();
  const { byPlan, recent } = await subscriptionOverview();

  return (
    <div className="q-container py-8">
      <SectionHeading level={1} title={t("admin.subscriptions")} />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {byPlan.map((row) => (
          <Card as="li" key={`${row.plan}-${row.status}`} className="p-4">
            <p className="text-sm text-[var(--color-ink-soft)]">
              {t(`subscription.plan.${row.plan}`)} · {row.status}
            </p>
            <p className="font-display text-3xl text-[var(--color-brand-ink)]">{row._count._all}</p>
          </Card>
        ))}
      </ul>

      <Card className="mt-8 overflow-x-auto p-0">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <caption className="q-visually-hidden">{t("admin.subscriptions")}</caption>
          <thead>
            <tr className="border-b-2 border-[var(--color-line-strong)]">
              <th scope="col" className="p-3">{t("admin.families")}</th>
              <th scope="col" className="p-3">{t("subscription.current")}</th>
              <th scope="col" className="p-3">Status</th>
              <th scope="col" className="p-3">Provider</th>
              <th scope="col" className="p-3">Periode tot</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((row) => (
              <tr key={row.id} className="border-b border-[var(--color-line)]">
                <td className="p-3 font-semibold">{row.family.name}</td>
                <td className="p-3">
                  <Badge tone={row.plan === "FAMILY_PREMIUM" ? "brand" : "neutral"}>
                    {t(`subscription.plan.${row.plan}`)}
                  </Badge>
                </td>
                <td className="p-3">{row.status}</td>
                <td className="p-3">{row.provider}</td>
                <td className="p-3">
                  {row.currentPeriodEnd ? (
                    <time dateTime={row.currentPeriodEnd.toISOString()}>
                      {row.currentPeriodEnd.toISOString().slice(0, 10)}
                    </time>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
