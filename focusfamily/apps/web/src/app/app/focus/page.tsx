import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { translate } from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { may, requireFamilyMe } from '@/lib/session';
import { SourceLabel } from '@/components/SourceLabel';

interface SchedulesResponse {
  schedules: Array<{
    id: string;
    title: string;
    kind: string;
    startsAt: string;
    durationMinutes: number;
    weekdays: number[];
    participantIds: string[];
    enabled: boolean;
    nextOccurrence: string | null;
    includesMe: boolean;
  }>;
}

interface SessionsResponse {
  sessions: Array<{
    id: string;
    plannedMinutes: number;
    createdAt: string;
    participantIds: string[];
    progress: { status: string; focusedMinutes: number; pauseCount: number; reasons: string[] };
    completed: boolean;
  }>;
}

const dayNames = {
  nl: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

export default async function FocusPage() {
  const { locale } = await getSiteText();
  const me = await requireFamilyMe();
  const [schedulesResult, sessionsResult, familyResult] = await Promise.all([
    api.get<SchedulesResponse>('/focus/schedules'),
    api.get<SessionsResponse>('/focus/sessions'),
    api.get<{ members: Array<{ userId: string; displayName: string; role: string }> }>('/family'),
  ]);
  const schedules = schedulesResult.data?.schedules ?? [];
  const sessions = sessionsResult.data?.sessions ?? [];
  const members = familyResult.data?.members ?? [];
  const nl = locale === 'nl';

  async function createSchedule(formData: FormData): Promise<void> {
    'use server';
    const weekdays = formData
      .getAll('weekdays')
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value));
    await api.post('/focus/schedules', {
      kind: String(formData.get('kind') ?? 'custom'),
      title: String(formData.get('title') ?? ''),
      startsAt: String(formData.get('startsAt') ?? '18:00'),
      durationMinutes: Number(formData.get('durationMinutes') ?? 30),
      weekdays: weekdays.length > 0 ? weekdays : [1, 2, 3, 4, 5],
      participantIds: formData.getAll('participants').map(String),
      agreementId: null,
    });
    revalidatePath('/app/focus');
  }

  return (
    <div className="stack-lg">
      <section className="stack">
        <h1>{nl ? 'Focusmomenten' : 'Focus moments'}</h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          {nl
            ? 'Een focusmoment is een afspraak, geen blokkade. Je start hem zelf, je mag pauzeren, en je zegt zelf waarom.'
            : 'A focus moment is an agreement, not a lock. You start it yourself, you may pause, and you say why yourself.'}
        </p>
        <p className="notice">{translate(locale, 'focus.offline_note')}</p>
      </section>

      <section className="stack">
        <h2>{nl ? 'In de agenda' : 'In the calendar'}</h2>
        <ul className="list-plain grid">
          {schedules.map((schedule) => (
            <li key={schedule.id} className="card stack">
              <h3>{schedule.title}</h3>
              <p style={{ color: 'var(--ink-soft)', marginBottom: 0 }}>
                {schedule.startsAt} · {schedule.durationMinutes}{' '}
                {nl ? 'minuten' : 'minutes'}
                <br />
                {schedule.weekdays.map((day) => dayNames[locale][day]).join(', ')}
              </p>
              <p style={{ marginBottom: 0 }}>
                {schedule.participantIds
                  .map((id) => members.find((member) => member.userId === id)?.displayName ?? id)
                  .join(', ')}
              </p>
              {schedule.participantIds.some(
                (id) => members.find((member) => member.userId === id)?.role === 'guardian',
              ) ? (
                <p className="badge">{nl ? 'Volwassenen doen mee' : 'Grown-ups take part'}</p>
              ) : (
                <p className="badge badge--quiet">
                  {nl ? 'Nog geen volwassene' : 'No grown-up yet'}
                </p>
              )}
              <p style={{ marginBottom: 0 }}>
                <Link className="btn" href={`/app/focus/${schedule.id}`}>
                  {translate(locale, 'focus.start')}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      </section>

      {may(me, 'focus.schedule.create') ? (
        <section className="stack">
          <h2>{nl ? 'Een moment plannen' : 'Plan a moment'}</h2>
          <form action={createSchedule} className="card stack">
            <div className="field">
              <label htmlFor="title">{nl ? 'Naam' : 'Name'}</label>
              <input id="title" name="title" type="text" required minLength={2} />
            </div>
            <div className="field">
              <label htmlFor="kind">{nl ? 'Soort' : 'Kind'}</label>
              <select id="kind" name="kind" defaultValue="dinner">
                <option value="dinner">{translate(locale, 'focus.title.dinner')}</option>
                <option value="homework">{translate(locale, 'focus.title.homework')}</option>
                <option value="bedtime">{translate(locale, 'focus.title.bedtime')}</option>
                <option value="family_time">{translate(locale, 'focus.title.family_time')}</option>
                <option value="custom">{translate(locale, 'focus.title.custom')}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="startsAt">{nl ? 'Begint om' : 'Starts at'}</label>
              <input id="startsAt" name="startsAt" type="time" defaultValue="18:00" required />
            </div>
            <div className="field">
              <label htmlFor="durationMinutes">{nl ? 'Duur in minuten' : 'Length in minutes'}</label>
              <input
                id="durationMinutes"
                name="durationMinutes"
                type="number"
                min={5}
                max={240}
                defaultValue={45}
                required
              />
            </div>
            <fieldset>
              <legend>{nl ? 'Op welke dagen' : 'On which days'}</legend>
              {dayNames[locale].map((day, index) => (
                <div className="choice" key={day}>
                  <input
                    type="checkbox"
                    id={`day-${index}`}
                    name="weekdays"
                    value={index}
                    defaultChecked={index >= 1 && index <= 5}
                  />
                  <label htmlFor={`day-${index}`}>{day}</label>
                </div>
              ))}
            </fieldset>
            <fieldset>
              <legend>{nl ? 'Wie doen er mee' : 'Who takes part'}</legend>
              <p className="field__hint">
                {nl
                  ? 'Kies ook minstens één volwassene. Dat is waar dit product om draait.'
                  : 'Pick at least one grown-up as well. That is what this product is about.'}
              </p>
              {members.map((member) => (
                <div className="choice" key={member.userId}>
                  <input
                    type="checkbox"
                    id={`participant-${member.userId}`}
                    name="participants"
                    value={member.userId}
                    defaultChecked
                  />
                  <label htmlFor={`participant-${member.userId}`}>
                    {member.displayName}{' '}
                    {member.role === 'guardian' ? (
                      <span className="badge badge--quiet">
                        {nl ? 'volwassene' : 'grown-up'}
                      </span>
                    ) : null}
                  </label>
                </div>
              ))}
            </fieldset>
            <button className="btn" type="submit">
              {nl ? 'In de agenda zetten' : 'Add to the calendar'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="stack">
        <h2>{nl ? 'Eerdere momenten' : 'Earlier moments'}</h2>
        <p>
          <SourceLabel kind="app_observed" locale={locale} explain />
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">{nl ? 'Wanneer' : 'When'}</th>
                <th scope="col">{nl ? 'Gepland' : 'Planned'}</th>
                <th scope="col">{nl ? 'Gefocust' : 'Focused'}</th>
                <th scope="col">{nl ? 'Pauzes' : 'Pauses'}</th>
                <th scope="col">{nl ? 'Afgemaakt' : 'Finished'}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 12).map((session) => (
                <tr key={session.id}>
                  <td>
                    {new Date(session.createdAt).toLocaleDateString(
                      locale === 'nl' ? 'nl-NL' : 'en-GB',
                      { day: 'numeric', month: 'short' },
                    )}
                  </td>
                  <td>{session.plannedMinutes}</td>
                  <td>{session.progress.focusedMinutes}</td>
                  <td>
                    {session.progress.pauseCount}
                    {session.progress.reasons.length > 0 ? (
                      <div style={{ color: 'var(--ink-faint)', fontSize: '0.85rem' }}>
                        {session.progress.reasons
                          .map((reason) => translate(locale, `focus.pause.${reason}`))
                          .join(', ')}
                      </div>
                    ) : null}
                  </td>
                  <td>{session.completed ? (nl ? 'Ja' : 'Yes') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
