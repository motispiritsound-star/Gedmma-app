import Link from 'next/link';
import { Card, PageHeading } from '../components/ui.tsx';
import { catalogue } from '../server/catalogue.ts';
import { formatCents } from '../lib/money.ts';
import { requestTranslator } from '../lib/ui/locale.ts';

export default async function HomePage() {
  const { locale, t } = await requestTranslator();
  const boxes = await catalogue(locale);
  const featured = boxes.slice(0, 3);

  const copy =
    locale === 'nl'
      ? {
          lead: 'Elke maand een doos met materialen, proefkaarten en een verhaal. Je kind activeert hem met een code en luistert — zonder scherm.',
          how: 'Hoe het werkt',
          steps: [
            ['De doos komt binnen', 'Materialen, proefkaarten en een thema-verhaal.'],
            ['Code invoeren', 'Eén korte code op het deksel koppelt de doos aan jullie gezin.'],
            ['Luisteren en doen', 'Het maatje leest voor, stelt vragen en wacht tot je kind klaar is.'],
            ['Jij ziet wat er gedaan is', 'Geen cijfers, geen beoordelingen — alleen wat er gebeurd is.'],
          ],
          promiseTitle: 'Wat wij níét doen',
          promises: [
            'Geen advertenties en geen profielen.',
            'Geen vrije chat met een AI: elk antwoord is vooraf geschreven en door een mens goedgekeurd.',
            'Geen opnames van de stem van je kind, tenzij jij dat expliciet aanzet.',
          ],
          browse: 'Bekijk alle dozen',
        }
      : {
          lead: 'A box of materials, experiment cards and a story every month. Your child activates it with a code and listens — no screen required.',
          how: 'How it works',
          steps: [
            ['The box arrives', 'Materials, experiment cards and a themed story.'],
            ['Enter the code', 'One short code inside the lid ties the box to your family.'],
            ['Listen and do', 'The companion reads along, asks questions and waits for your child.'],
            ['You see what happened', 'No grades, no assessments — just what was actually done.'],
          ],
          promiseTitle: 'What we do not do',
          promises: [
            'No advertising and no profiles.',
            'No open-ended AI chat: every reply is written in advance and approved by a person.',
            'No recordings of your child’s voice, unless you explicitly turn that on.',
          ],
          browse: 'Browse all boxes',
        };

  return (
    <>
      <section className="mb-12">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-brand)]">
          {t('app.tagline')}
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          {locale === 'nl'
            ? 'Ontdekken met je handen, begeleid door je oren.'
            : 'Discover with your hands, guided by your ears.'}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--color-ink-soft)]">{copy.lead}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/boxes" className="wb-button wb-button-primary">
            {copy.browse}
          </Link>
          <Link href="/signup" className="wb-button wb-button-secondary">
            {t('nav.signup')}
          </Link>
        </div>
      </section>

      <section className="mb-12" aria-labelledby="how">
        <h2 id="how" className="mb-4 text-xl font-bold">
          {copy.how}
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.steps.map(([title, body], index) => (
            <Card key={title} as="li">
              <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-sm font-bold text-[var(--color-brand-strong)]">
                {index + 1}
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{body}</p>
            </Card>
          ))}
        </ol>
      </section>

      {featured.length > 0 ? (
        <section className="mb-12" aria-labelledby="featured">
          <PageHeading title={t('catalogue.title')} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((box) => (
              <Card key={box.id} as="li">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
                  {box.themeName}
                </p>
                <h3 className="mt-1 text-lg font-bold">
                  <Link href={`/boxes/${box.slug}`} className="hover:underline">
                    {box.name}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{box.tagline}</p>
                <p className="mt-3 text-sm">
                  {t('catalogue.ages', { min: box.ageMin, max: box.ageMax })} ·{' '}
                  {formatCents(box.priceCents, 'EUR', locale === 'nl' ? 'nl-NL' : 'en-IE')}
                </p>
              </Card>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="promise" className="wb-card p-6">
        <h2 id="promise" className="mb-3 text-xl font-bold">
          {copy.promiseTitle}
        </h2>
        <ul className="space-y-2 text-[var(--color-ink-soft)]">
          {copy.promises.map((promise) => (
            <li key={promise} className="flex gap-2">
              <span aria-hidden="true">—</span>
              <span>{promise}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
