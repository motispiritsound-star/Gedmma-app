import Link from "next/link";
import { getTranslator } from "@/modules/i18n/server";
import { listCategories } from "@/modules/quests/service";
import { CATEGORY_EMOJI } from "@/components/ui/illustration";
import { Card } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

const STEPS = [1, 2, 3, 4, 5, 6] as const;

export default async function LandingPage() {
  const { locale, t } = await getTranslator();
  const categories = await listCategories(locale);

  return (
    <>
      <section className="bg-[linear-gradient(160deg,var(--color-brand-soft)_0%,var(--color-canvas)_60%)] py-14 sm:py-20">
        <div className="q-container grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="q-badge q-badge--accent mb-4">{t("brand.tagline")}</p>
            <h1 className="text-[length:var(--text-hero)] leading-[1.08] tracking-tight">{t("marketing.hero.title")}</h1>
            <p className="mt-4 max-w-xl text-lg text-[var(--color-ink-soft)]">{t("marketing.hero.body")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register" className="q-btn q-btn--primary">
                {t("marketing.hero.cta")}
              </Link>
              <Link href="/how-it-works" className="q-btn q-btn--secondary">
                {t("marketing.hero.secondary")}
              </Link>
            </div>
            <p className="mt-6 max-w-xl border-l-4 border-[var(--color-accent)] pl-4 font-display text-lg text-[var(--color-brand-ink)]">
              {t("marketing.principle")}
            </p>
          </div>

          <Card className="p-6">
            <h2 className="text-xl">{t("marketing.pillars.title")}</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <li
                  key={category.slug}
                  className="flex items-center gap-2 rounded-xl bg-[var(--color-surface-sunk)] px-3 py-2.5"
                >
                  <span aria-hidden="true" className="text-lg">
                    {CATEGORY_EMOJI[category.slug] ?? "🧭"}
                  </span>
                  <span className="font-semibold text-[var(--color-brand-ink)]">{category.name}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-[var(--color-ink-soft)]">{t("marketing.pillars.body")}</p>
          </Card>
        </div>
      </section>

      <section className="q-container py-14">
        <h2 className="text-2xl sm:text-3xl">{t("marketing.howItWorks.title")}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step}>
              <Card className="h-full p-5">
                <span className="q-badge q-badge--brand mb-3">{step}</span>
                <h3 className="text-lg">{t(`step.${step}.title` as "step.1.title")}</h3>
                <p className="mt-1 text-[var(--color-ink-soft)]">{t(`step.${step}.body` as "step.1.body")}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)] py-12">
        <div className="q-container max-w-3xl">
          <h2 className="text-2xl">{t("marketing.honest.title")}</h2>
          <p className="mt-3 text-[var(--color-ink-soft)]">{t("marketing.honest.body")}</p>
        </div>
      </section>
    </>
  );
}
