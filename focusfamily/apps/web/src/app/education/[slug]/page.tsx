import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import type { LocalizedParagraphs, LocalizedText } from '@focusfamily/domain';

interface Article {
  id: string;
  slug: string;
  topic: string;
  title: LocalizedText;
  summary: LocalizedText;
  body: LocalizedParagraphs;
  readMinutes: number;
  sourceNote: LocalizedText;
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale } = await getSiteText();
  const result = await api.get<{ article: Article | null }>(`/education/${slug}`);
  const article = result.data?.article;
  if (!article) notFound();

  return (
    <article className="stack-lg" style={{ maxWidth: '68ch' }}>
      <div className="stack">
        <p className="card__label">{article.topic.replace('_', ' ')}</p>
        <h1>{article.title[locale]}</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--ink-soft)' }}>{article.summary[locale]}</p>
      </div>

      <div className="stack">
        {article.body[locale].map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <aside className="notice">
        <strong>{locale === 'nl' ? 'Waar dit op gebaseerd is' : 'What this is based on'}</strong>
        <p style={{ marginBottom: 0 }}>{article.sourceNote[locale]}</p>
      </aside>

      <p>
        <Link className="btn btn--secondary" href="/education">
          {locale === 'nl' ? 'Terug naar de bibliotheek' : 'Back to the library'}
        </Link>
      </p>
    </article>
  );
}
