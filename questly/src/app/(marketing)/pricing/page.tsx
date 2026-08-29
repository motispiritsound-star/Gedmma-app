import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { PUBLIC_PLANS, planCopy } from "@/modules/subscriptions/plan-copy";
import { env } from "@/lib/env";
import { Badge, Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Prijzen" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const { locale, t } = await getTranslator();
  const usingMock = env().PAYMENT_PROVIDER !== "stripe" || !env().STRIPE_SECRET_KEY;

  return (
    <div className="q-container py-12">
      <h1 className="text-3xl sm:text-4xl">{t("nav.pricing")}</h1>
      <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)]">{t("marketing.hero.body")}</p>

      {usingMock ? (
        <p role="status" className="q-badge q-badge--warning mt-6 block w-fit px-4 py-2">
          {t("subscription.mockNotice")}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {PUBLIC_PLANS.map((plan) => {
          const copy = planCopy(plan, locale);
          const featured = plan === "FAMILY_PREMIUM";
          return (
            <Card
              key={plan}
              as="section"
              className={`flex flex-col p-6 ${featured ? "border-2 border-[var(--color-brand)]" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl">{copy.name}</h2>
                {featured ? <Badge tone="brand">★</Badge> : null}
              </div>
              <p className="mt-1 text-2xl font-semibold text-[var(--color-brand-ink)]">{copy.price}</p>
              <p className="mt-1 text-[var(--color-ink-soft)]">{copy.tagline}</p>

              <ul className="mt-4 space-y-1.5">
                {copy.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden="true" className="text-[var(--color-success)]">
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {copy.caveats ? (
                <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-ink-soft)]">
                  {copy.caveats.map((caveat) => (
                    <li key={caveat} className="flex gap-2">
                      <span aria-hidden="true">–</span>
                      <span>{caveat}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-auto pt-6">
                {plan === "SCHOOL" ? (
                  <span className="q-badge q-badge--neutral">{t("common.none")}</span>
                ) : (
                  <Link href="/register" className={`q-btn ${featured ? "q-btn--primary" : "q-btn--secondary"} w-full`}>
                    {t("marketing.hero.cta")}
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
