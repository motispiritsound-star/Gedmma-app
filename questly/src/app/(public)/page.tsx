import { ButtonLink } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CategoryIcon, IconShield } from '@/components/ui/Icons'
import { getTranslations } from '@/modules/localisation/server'
import { listCategories } from '@/modules/quests/queries'
import { prisma } from '@/lib/db'

export default async function LandingPage() {
  const { locale, d } = await getTranslations()
  const [categories, questCount] = await Promise.all([
    listCategories(locale),
    prisma.quest.count({ where: { status: 'PUBLISHED' } }),
  ])

  const steps = [
    { title: d.landing.step1Title, body: d.landing.step1Body },
    { title: d.landing.step2Title, body: d.landing.step2Body },
    { title: d.landing.step3Title, body: d.landing.step3Body },
    { title: d.landing.step4Title, body: d.landing.step4Body },
  ]

  return (
    <>
      <section className="q-topo border-b border-line">
        <div className="q-container grid gap-10 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
          <div>
            <Badge tone="ember">{d.common.tagline}</Badge>
            <h1 className="mt-5 text-[clamp(2.1rem,5vw,3.4rem)] leading-[1.08] font-semibold tracking-tight">
              {d.landing.heroTitle}
            </h1>
            <p className="q-prose mt-5 text-lg text-ink-soft">{d.landing.heroBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register" size="lg">
                {d.landing.heroPrimary}
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="lg" variant="secondary">
                {d.landing.heroSecondary}
              </ButtonLink>
            </div>
            <p className="mt-5 text-sm text-ink-muted">
              {questCount > 0
                ? locale === 'nl'
                  ? `${questCount} avonturen klaar om te doen · geen advertenties · geen openbare kindprofielen`
                  : `${questCount} adventures ready to go · no advertising · no public child profiles`
                : null}
            </p>
          </div>

          <div className="q-card bg-paper-raised p-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-ember-600">
                <IconShield size={22} />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{d.landing.honestTitle}</h2>
                <p className="mt-2 text-sm text-ink-soft">{d.landing.honestBody}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="q-container py-16" aria-labelledby="pillars">
        <h2 id="pillars" className="text-2xl font-semibold">
          {d.landing.pillarsTitle}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li key={category.slug} className="q-card flex gap-4 p-5">
              <span className="mt-0.5 text-moss-600">
                <CategoryIcon icon={category.icon} size={24} />
              </span>
              <div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{category.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-paper-sunken py-16" aria-labelledby="steps">
        <div className="q-container">
          <h2 id="steps" className="text-2xl font-semibold">
            {d.landing.stepsTitle}
          </h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="q-card p-5">
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-moss-600 font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="q-container py-16">
        <div className="q-card q-topo flex flex-col items-start gap-4 p-8 sm:p-12">
          <h2 className="text-2xl font-semibold">{d.landing.ctaTitle}</h2>
          <p className="q-prose text-ink-soft">{d.landing.ctaBody}</p>
          <ButtonLink href="/register" size="lg">
            {d.landing.heroPrimary}
          </ButtonLink>
        </div>
      </section>
    </>
  )
}
