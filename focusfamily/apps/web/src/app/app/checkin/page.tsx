import { revalidatePath } from 'next/cache';
import { conflictLevels, moodLevels, translate } from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { requireFamilyMe } from '@/lib/session';
import { SourceLabel } from '@/components/SourceLabel';

interface MyCheckIns {
  checkIns: Array<{
    id: string;
    dayKey: string;
    sleepHours: number | null;
    mood: number;
    conflict: string;
    note: string | null;
    sharedWithFamily: boolean;
  }>;
  trend: {
    averageSleepHours: number | null;
    averageMood: number | null;
    conflictDays: number;
    responseCount: number;
  };
}

export default async function CheckInPage() {
  const { locale } = await getSiteText();
  await requireFamilyMe();
  const result = await api.get<MyCheckIns>('/checkins/me');
  const nl = locale === 'nl';

  async function submit(formData: FormData): Promise<void> {
    'use server';
    const note = String(formData.get('note') ?? '').trim();
    const sleep = String(formData.get('sleepHours') ?? '');
    await api.post('/checkins', {
      sleepHours: sleep === '' ? null : Number(sleep),
      bedtime: String(formData.get('bedtime') ?? '') || null,
      mood: Number(formData.get('mood') ?? 3),
      conflict: String(formData.get('conflict') ?? 'none'),
      note: note === '' ? null : note,
      sharedWithFamily: formData.get('shared') === 'on',
    });
    revalidatePath('/app/checkin');
  }

  return (
    <div className="stack-lg" style={{ maxWidth: '46rem' }}>
      <section className="stack">
        <h1>{translate(locale, 'checkin.title')}</h1>
        <p style={{ color: 'var(--ink-soft)' }}>{translate(locale, 'checkin.intro')}</p>
        <SourceLabel kind="self_reported" locale={locale} explain />
      </section>

      <form action={submit} className="card stack">
        <div className="field">
          <label htmlFor="sleepHours">{translate(locale, 'checkin.sleep')}</label>
          <span className="field__hint">
            {nl ? 'Een schatting is prima. Leeg laten mag ook.' : 'A rough guess is fine. Leaving it empty is fine too.'}
          </span>
          <input id="sleepHours" name="sleepHours" type="number" min={0} max={16} step={0.5} />
        </div>

        <div className="field">
          <label htmlFor="bedtime">{nl ? 'Hoe laat ging je slapen?' : 'What time did you go to sleep?'}</label>
          <input id="bedtime" name="bedtime" type="time" />
        </div>

        <fieldset>
          <legend>{translate(locale, 'checkin.mood')}</legend>
          {moodLevels.map((level) => (
            <div className="choice" key={level}>
              <input
                type="radio"
                id={`mood-${level}`}
                name="mood"
                value={level}
                defaultChecked={level === 3}
              />
              <label htmlFor={`mood-${level}`}>{translate(locale, `checkin.mood.${level}`)}</label>
            </div>
          ))}
        </fieldset>

        <fieldset>
          <legend>{translate(locale, 'checkin.conflict')}</legend>
          {conflictLevels.map((level) => (
            <div className="choice" key={level}>
              <input
                type="radio"
                id={`conflict-${level}`}
                name="conflict"
                value={level}
                defaultChecked={level === 'none'}
              />
              <label htmlFor={`conflict-${level}`}>
                {translate(locale, `checkin.conflict.${level}`)}
              </label>
            </div>
          ))}
        </fieldset>

        <div className="field">
          <label htmlFor="note">{nl ? 'Wil je er iets bij schrijven?' : 'Anything you want to add?'}</label>
          <span className="field__hint">{translate(locale, 'checkin.private_note')}</span>
          <textarea id="note" name="note" maxLength={500} />
        </div>

        <div className="choice">
          <input type="checkbox" id="shared" name="shared" />
          <label htmlFor="shared">{translate(locale, 'checkin.share')}</label>
        </div>

        <button className="btn" type="submit">
          {nl ? 'Opslaan' : 'Save'}
        </button>
      </form>

      <section className="stack">
        <h2>{nl ? 'Jouw laatste dagen' : 'Your recent days'}</h2>
        <div className="card">
          <div className="figure-row">
            <div>{nl ? 'Gemiddelde slaap' : 'Average sleep'}</div>
            <div className="figure-row__value">{result.data?.trend.averageSleepHours ?? '—'}</div>
          </div>
          <div className="figure-row">
            <div>{nl ? 'Gemiddeld gevoel' : 'Average feeling'}</div>
            <div className="figure-row__value">{result.data?.trend.averageMood ?? '—'}</div>
          </div>
          <div className="figure-row">
            <div>{nl ? 'Dagen met gedoe' : 'Days with friction'}</div>
            <div className="figure-row__value">{result.data?.trend.conflictDays ?? 0}</div>
          </div>
        </div>
        <p style={{ color: 'var(--ink-soft)' }}>
          {nl
            ? 'Alleen jij ziet dit. Een notitie deel je pas als je het vakje aanvinkt.'
            : 'Only you see this. A note is shared only if you tick the box.'}
        </p>
      </section>
    </div>
  );
}
