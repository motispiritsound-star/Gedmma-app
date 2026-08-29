import Link from 'next/link';
import { FORBIDDEN_CAPABILITIES, translate } from '@focusfamily/domain';
import { getSiteText } from '@/lib/i18n';
import { SourceLabel } from '@/components/SourceLabel';

export default async function HomePage() {
  const { s, locale } = await getSiteText();

  const principles = [
    { title: s('home.principle.1.title'), body: s('home.principle.1.body') },
    { title: s('home.principle.2.title'), body: s('home.principle.2.body') },
    { title: s('home.principle.3.title'), body: s('home.principle.3.body') },
    { title: s('home.principle.4.title'), body: s('home.principle.4.body') },
  ];

  return (
    <div className="stack-lg">
      <section className="stack">
        <h1>{s('home.hero.title')}</h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--ink-soft)' }}>{s('home.hero.body')}</p>
        <p style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Link className="btn" href="/signin">
            {s('home.cta.primary')}
          </Link>
          <Link className="btn btn--secondary" href="/privacy">
            {s('home.cta.secondary')}
          </Link>
        </p>
      </section>

      <section className="stack" aria-labelledby="principles">
        <h2 id="principles">{s('home.principles.title')}</h2>
        <div className="grid">
          {principles.map((principle) => (
            <article className="card" key={principle.title}>
              <h3>{principle.title}</h3>
              <p style={{ color: 'var(--ink-soft)', marginBottom: 0 }}>{principle.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="stack" aria-labelledby="labels">
        <h2 id="labels">
          {locale === 'nl' ? 'Elk getal zegt waar het vandaan komt' : 'Every figure says where it came from'}
        </h2>
        <div className="grid">
          {(['self_reported', 'app_observed', 'os_verified', 'simulated'] as const).map((kind) => (
            <div className="card card--quiet" key={kind}>
              <SourceLabel kind={kind} locale={locale} explain />
            </div>
          ))}
        </div>
      </section>

      <section className="stack" aria-labelledby="never">
        <h2 id="never">{s('home.never.title')}</h2>
        <p style={{ color: 'var(--ink-soft)' }}>
          {locale === 'nl'
            ? 'Deze lijst staat ook in de code en in de openbare /capabilities van onze API, zodat je ons niet op ons woord hoeft te geloven.'
            : 'This list also lives in the code and in our public API /capabilities endpoint, so you do not have to take our word for it.'}
        </p>
        <ul className="list-plain grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {FORBIDDEN_CAPABILITIES.map((capability) => (
            <li key={capability} className="card card--quiet" style={{ padding: '12px 16px' }}>
              <code style={{ fontSize: '0.85rem' }}>{capability}</code>
            </li>
          ))}
        </ul>
        <p className="notice">{translate(locale, 'authz.capability_not_offered')}</p>
      </section>
    </div>
  );
}
