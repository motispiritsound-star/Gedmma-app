import { revalidatePath } from 'next/cache';
import {
  AGREEMENT_TEMPLATES,
  translate,
  type AgeBand,
  type AgreementRule,
} from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { may, requireFamilyMe } from '@/lib/session';

interface AgreementsResponse {
  agreements: Array<{
    id: string;
    title: string;
    status: string;
    rules: AgreementRule[];
    issues: Array<{ code: string; messageKey: string; context?: string }>;
    bindsMe: number;
  }>;
  appliesToMe: AgreementRule[];
}

const audienceLabel: Record<string, { nl: string; en: string }> = {
  everyone: { nl: 'Iedereen', en: 'Everyone' },
  adults: { nl: 'Volwassenen', en: 'Grown-ups' },
  children: { nl: 'Kinderen', en: 'Children' },
  member: { nl: 'Eén persoon', en: 'One person' },
};

export default async function AgreementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { locale } = await getSiteText();
  const me = await requireFamilyMe();
  const params = await searchParams;
  const result = await api.get<AgreementsResponse>('/agreements');
  const agreements = result.data?.agreements ?? [];
  const mine = result.data?.appliesToMe ?? [];
  const nl = locale === 'nl';

  async function activate(formData: FormData): Promise<void> {
    'use server';
    const id = String(formData.get('id'));
    const response = await api.post(`/agreements/${id}/activate`);
    revalidatePath('/app/agreements');
    if (!response.ok) {
      const details = response.error?.details as { issues?: string[] } | undefined;
      throw new Error(details?.issues?.join(', ') ?? response.error?.messageKey ?? 'error');
    }
  }

  async function propose(formData: FormData): Promise<void> {
    'use server';
    const id = String(formData.get('agreementId'));
    const text = String(formData.get('text') ?? '');
    await api.post(`/agreements/${id}/proposals`, { ruleId: null, text });
    revalidatePath('/app/agreements');
  }

  return (
    <div className="stack-lg">
      <section className="stack">
        <h1>{nl ? 'Onze afspraken' : 'Our agreements'}</h1>
        <p className="notice notice--good">
          {translate(locale, 'agreement.issue.adults_not_included')}
        </p>
        {params.error ? (
          <p className="notice notice--warm" role="alert">
            {translate(locale, params.error)}
          </p>
        ) : null}
      </section>

      <section className="stack" aria-labelledby="mine">
        <h2 id="mine">{nl ? 'Wat voor mij geldt' : 'What applies to me'}</h2>
        {mine.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>
            {nl ? 'Er geldt nu niets voor jou.' : 'Nothing applies to you right now.'}
          </p>
        ) : (
          <ul className="list-plain stack">
            {mine.map((rule) => (
              <li key={rule.id} className="card">
                <p style={{ marginBottom: '6px', fontWeight: 600 }}>{rule.text}</p>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', marginBottom: 0 }}>
                  {rule.startsAt && rule.endsAt ? `${rule.startsAt}–${rule.endsAt} · ` : ''}
                  {audienceLabel[rule.audience]?.[locale] ?? rule.audience}
                  {rule.repairText ? ` · ${rule.repairText}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {agreements.map((agreement) => (
        <section className="stack" key={agreement.id} aria-labelledby={`agr-${agreement.id}`}>
          <h2 id={`agr-${agreement.id}`}>
            {agreement.title}{' '}
            <span className={agreement.status === 'active' ? 'badge' : 'badge badge--quiet'}>
              {agreement.status}
            </span>
          </h2>

          {agreement.issues.length > 0 ? (
            <ul className="notice notice--warm list-plain" role="alert">
              {agreement.issues.map((issue) => (
                <li key={`${issue.code}-${issue.context ?? ''}`}>
                  {translate(locale, issue.messageKey)}
                  {issue.context ? ` (${issue.context})` : ''}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="table-scroll">
            <table>
              <caption className="visually-hidden">{agreement.title}</caption>
              <thead>
                <tr>
                  <th scope="col">{nl ? 'Moment' : 'Moment'}</th>
                  <th scope="col">{nl ? 'Afspraak' : 'Agreement'}</th>
                  <th scope="col">{nl ? 'Voor wie' : 'Who'}</th>
                  <th scope="col">{nl ? 'Als het niet lukt' : 'If it does not work out'}</th>
                </tr>
              </thead>
              <tbody>
                {agreement.rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      {rule.context}
                      {rule.startsAt ? (
                        <div style={{ color: 'var(--ink-faint)', fontSize: '0.85rem' }}>
                          {rule.startsAt}–{rule.endsAt}
                        </div>
                      ) : null}
                    </td>
                    <td>{rule.text}</td>
                    <td>
                      {audienceLabel[rule.audience]?.[locale] ?? rule.audience}
                      {rule.ageBands.length > 0 ? (
                        <div style={{ color: 'var(--ink-faint)', fontSize: '0.85rem' }}>
                          {rule.ageBands.map((band: AgeBand) => translate(locale, `agreement.variation.${band.replace('-', '_')}`)).join(', ')}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ color: 'var(--ink-soft)' }}>{rule.repairText ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {agreement.status !== 'active' && may(me, 'agreement.activate') ? (
              <form action={activate}>
                <input type="hidden" name="id" value={agreement.id} />
                <button className="btn" type="submit" disabled={agreement.issues.length > 0}>
                  {nl ? 'Laten ingaan' : 'Bring into force'}
                </button>
              </form>
            ) : null}
          </div>

          <details className="card card--quiet">
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
              {nl ? 'Een wijziging voorstellen' : 'Propose a change'}
            </summary>
            <form action={propose} style={{ marginTop: '16px' }}>
              <input type="hidden" name="agreementId" value={agreement.id} />
              <div className="field">
                <label htmlFor={`proposal-${agreement.id}`}>
                  {nl ? 'Wat zou je willen veranderen?' : 'What would you like to change?'}
                </label>
                <span className="field__hint">
                  {nl
                    ? 'Iedereen in het gezin mag dit doen, ook de kinderen.'
                    : 'Anyone in the family may do this, children included.'}
                </span>
                <textarea id={`proposal-${agreement.id}`} name="text" required minLength={3} />
              </div>
              <button className="btn btn--secondary" type="submit">
                {nl ? 'Voorstellen' : 'Propose'}
              </button>
            </form>
          </details>
        </section>
      ))}

      {may(me, 'agreement.create') ? (
        <section className="stack">
          <h2>{nl ? 'Een nieuwe afspraak maken' : 'Build a new agreement'}</h2>
          <p style={{ color: 'var(--ink-soft)' }}>
            {nl
              ? 'Kies de momenten die bij jullie spelen. Elk voorstel geldt standaard voor iedereen; je past de woorden zelf aan.'
              : 'Pick the moments that matter in your house. Every suggestion applies to everyone by default; you write the words yourselves.'}
          </p>
          <AgreementBuilder locale={locale} />
        </section>
      ) : null}
    </div>
  );
}

function AgreementBuilder({ locale }: { locale: 'nl' | 'en' }) {
  const nl = locale === 'nl';

  async function create(formData: FormData): Promise<void> {
    'use server';
    const title = String(formData.get('title') ?? '');
    const rules = AGREEMENT_TEMPLATES.flatMap((template) => {
      const text = String(formData.get(`text-${template.context}`) ?? '').trim();
      if (!formData.get(`use-${template.context}`) || text.length < 3) return [];
      return [
        {
          context: template.context,
          kind: template.kind,
          audience: String(formData.get(`audience-${template.context}`) ?? 'everyone'),
          memberId: null,
          ageBands: [],
          startsAt: template.startsAt ?? null,
          endsAt: template.endsAt ?? null,
          weekdays: template.weekdays ?? [],
          text,
          repairText: String(formData.get(`repair-${template.context}`) ?? '') || null,
        },
      ];
    });
    if (rules.length === 0) return;
    await api.post('/agreements', { title, rules });
    revalidatePath('/app/agreements');
  }

  return (
    <form action={create} className="card stack">
      <div className="field">
        <label htmlFor="title">{nl ? 'Titel' : 'Title'}</label>
        <input id="title" name="title" type="text" required minLength={3} defaultValue={nl ? 'Onze afspraken' : 'Our agreement'} />
      </div>

      {AGREEMENT_TEMPLATES.map((template) => (
        <fieldset key={template.context}>
          <legend>{template.context}</legend>
          <div className="choice">
            <input
              type="checkbox"
              id={`use-${template.context}`}
              name={`use-${template.context}`}
              defaultChecked={template.context === 'meals'}
            />
            <label htmlFor={`use-${template.context}`}>
              {nl ? 'Deze afspraak meenemen' : 'Include this agreement'}
            </label>
          </div>
          <div className="field">
            <label htmlFor={`text-${template.context}`}>
              {nl ? 'In jullie eigen woorden' : 'In your own words'}
            </label>
            <textarea
              id={`text-${template.context}`}
              name={`text-${template.context}`}
              defaultValue={translate(locale, template.textKey)}
            />
          </div>
          <div className="field">
            <label htmlFor={`repair-${template.context}`}>
              {nl ? 'Als het niet lukt' : 'If it does not work out'}
            </label>
            <input
              type="text"
              id={`repair-${template.context}`}
              name={`repair-${template.context}`}
              defaultValue={translate(locale, template.repairKey)}
            />
          </div>
          <div className="field">
            <label htmlFor={`audience-${template.context}`}>{nl ? 'Voor wie' : 'Who for'}</label>
            <select id={`audience-${template.context}`} name={`audience-${template.context}`} defaultValue="everyone">
              <option value="everyone">{nl ? 'Iedereen' : 'Everyone'}</option>
              <option value="adults">{nl ? 'Volwassenen' : 'Grown-ups'}</option>
              <option value="children">{nl ? 'Kinderen' : 'Children'}</option>
            </select>
          </div>
        </fieldset>
      ))}

      <button className="btn" type="submit">
        {nl ? 'Concept opslaan' : 'Save draft'}
      </button>
    </form>
  );
}
