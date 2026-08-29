import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { requireFamily } from "@/modules/auth";
import { getSubscription, planCopy, PUBLIC_PLANS } from "@/modules/subscriptions";
import { env } from "@/lib/env";
import { cancelSubscriptionAction, upgradeAction } from "@/server-actions/account";
import { Badge, Card, ErrorNote, SectionHeading, StatusNote } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Abonnement" };
export const dynamic = "force-dynamic";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireFamily();
  const { locale, t } = await getTranslator();

  const subscription = await getSubscription(user.familyId);
  const usingMock = env().PAYMENT_PROVIDER !== "stripe" || !env().STRIPE_SECRET_KEY;

  return (
    <div className="q-container max-w-4xl py-8">
      <Link href="/settings" className="q-btn q-btn--ghost mb-4 px-3 py-1.5 text-sm">
        ← {t("settings.title")}
      </Link>
      <SectionHeading level={1} title={t("subscription.title")} />

      {params.error === "1" ? <ErrorNote>{t("common.error")}</ErrorNote> : null}
      {params.upgraded === "1" ? <StatusNote>{t("settings.saved")}</StatusNote> : null}
      {params.downgraded === "1" ? <StatusNote>{t("settings.saved")}</StatusNote> : null}

      <Card className="mt-4 p-5">
        <h2 className="text-lg">{t("subscription.current")}</h2>
        <p className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{t(`subscription.plan.${subscription.plan}`)}</Badge>
          <Badge>{subscription.status}</Badge>
          <Badge>{subscription.provider}</Badge>
          {subscription.currentPeriodEnd ? (
            <Badge>
              <time dateTime={subscription.currentPeriodEnd.toISOString()}>
                {subscription.currentPeriodEnd.toISOString().slice(0, 10)}
              </time>
            </Badge>
          ) : null}
        </p>

        {usingMock ? (
          <p role="note" className="mt-4 rounded-xl border-l-4 border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-3 text-sm">
            {t("subscription.mockNotice")}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          {subscription.plan === "FREE" ? (
            <form action={upgradeAction}>
              <button type="submit" className="q-btn q-btn--accent">
                {t("subscription.upgrade")}
              </button>
            </form>
          ) : (
            <form action={cancelSubscriptionAction}>
              <button type="submit" className="q-btn q-btn--secondary">
                {t("subscription.downgrade")}
              </button>
            </form>
          )}
        </div>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {PUBLIC_PLANS.map((plan) => {
          const copy = planCopy(plan, locale);
          return (
            <Card key={plan} as="section" className={`p-5 ${plan === subscription.plan ? "border-2 border-[var(--color-brand)]" : ""}`}>
              <h2 className="text-lg">{copy.name}</h2>
              <p className="font-semibold text-[var(--color-brand-ink)]">{copy.price}</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {copy.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden="true" className="text-[var(--color-success)]">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
                {copy.caveats?.map((caveat) => (
                  <li key={caveat} className="flex gap-2 text-[var(--color-ink-soft)]">
                    <span aria-hidden="true">–</span>
                    <span>{caveat}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
