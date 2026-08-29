import Link from 'next/link';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import type { LocalizedText } from '@focusfamily/domain';

interface ArticleSummary {
  id: string;
  slug: string;
  topic: string;
  title: LocalizedText;
  summary: LocalizedText;
  readMinutes: number;
  audience: string;
}

export default async function EducationPage() {
  const { locale } = await getSiteText();
  const result = await api.get<{ articles: ArticleSummary[] }>('/education');
  const articles = result.data?.articles ?? [];

  return (
    <div className="stack-lg" style={{ maxWidth: '78ch' }}>
      <section className="stack">
        <h1>{locale === 'nl' ? 'Bibliotheek voor ouders' : 'Library for parents'}</h1>
        <p>
          {locale === 'nl'
            ? 'Korte stukken over sociale media, gamen, slaap en gesprekken die verder komen. Bij elk stuk staat waar de uitleg vandaan komt. Dit is geen medisch advies.'
            : 'Short pieces about social media, gaming, sleep and conversations that get further. Each one says where the guidance comes from. This is not medical advice.'}
        </p>
      </section>

      {articles.length === 0 ? (
        <p className="notice notice--warm">
          {locale === 'nl'
            ? 'De bibliotheek is nu niet bereikbaar. Probeer het later opnieuw.'
            : 'The library is not reachable right now. Please try again later.'}
        </p>
      ) : (
        <ul className="list-plain grid">
          {articles.map((article) => (
            <li key={article.id} className="card stack">
              <p className="card__label">{article.topic.replace('_', ' ')}</p>
              <h2 style={{ fontSize: '1.15rem' }}>
                <Link href={`/education/${article.slug}`}>{article.title[locale]}</Link>
              </h2>
              <p style={{ color: 'var(--ink-soft)' }}>{article.summary[locale]}</p>
              <p className="badge badge--quiet">
                {article.readMinutes} {locale === 'nl' ? 'min lezen' : 'min read'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
