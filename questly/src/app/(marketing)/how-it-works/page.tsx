import Link from "next/link";
import type { Metadata } from "next";
import { getTranslator } from "@/modules/i18n/server";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Hoe het werkt" };

const STEPS = [1, 2, 3, 4, 5, 6] as const;

export default async function HowItWorksPage() {
  const { t } = await getTranslator();

  return (
    <div className="q-container max-w-3xl py-12">
      <h1 className="text-3xl sm:text-4xl">{t("marketing.howItWorks.title")}</h1>
      <p className="mt-3 text-lg text-[var(--color-ink-soft)]">{t("marketing.principle")}</p>

      <ol className="mt-8 space-y-4">
        {STEPS.map((step) => (
          <li key={step}>
            <Card className="p-5">
              <div className="flex gap-4">
                <span className="q-badge q-badge--brand h-8 shrink-0">{step}</span>
                <div>
                  <h2 className="text-lg">{t(`step.${step}.title` as "step.1.title")}</h2>
                  <p className="mt-1 text-[var(--color-ink-soft)]">{t(`step.${step}.body` as "step.1.body")}</p>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="mt-8 p-5">
        <h2 className="text-lg">{t("marketing.honest.title")}</h2>
        <p className="mt-2 text-[var(--color-ink-soft)]">{t("marketing.honest.body")}</p>
      </Card>

      <Link href="/register" className="q-btn q-btn--primary mt-8">
        {t("marketing.hero.cta")}
      </Link>
    </div>
  );
}
