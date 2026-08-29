import { revalidatePath } from 'next/cache';
import { goalKinds, translate } from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { may, requireFamilyMe } from '@/lib/session';

interface GoalsResponse {
  goals: Array<{
    goal: { id: string; kind: string; title: string; target: number };
    progress: {
      achieved: number;
      remaining: number;
      reached: boolean;
      contributorIds: string[];
      adultsTookPart: boolean;
    };
    celebration: { titleKey: string; bodyKey: string; visibility: string } | null;
  }>;
  momentum: { currentWeek: number; bestWeek: number; lostAnything: boolean };
  achievements: Array<{ id: string; kind: string; titleKey: string; bodyKey: string; earnedAt: string }>;
}

export default async function GoalsPage() {
  const { locale } = await getSiteText();
  const me = await requireFamilyMe();
  const result = await api.get<GoalsResponse>('/goals');
  const data = result.data;
  const nl = locale === 'nl';

  async function contribute(formData: FormData): Promise<void> {
    'use server';
    await api.post(`/goals/${String(formData.get('goalId'))}/contributions`, { amount: 1 });
    revalidatePath('/app/goals');
  }

  async function createGoal(formData: FormData): Promise<void> {
    'use server';
    const members = await api.get<{ members: Array<{ userId: string }> }>('/family');
    await api.post('/goals', {
      kind: String(formData.get('kind') ?? 'device_free_dinners'),
      title: String(formData.get('title') ?? ''),
      target: Number(formData.get('target') ?? 3),
      periodDays: 7,
      participantIds: (members.data?.members ?? []).map((member) => member.userId),
    });
    revalidatePath('/app/goals');
  }

  return (
    <div className="stack-lg" style={{ maxWidth: '48rem' }}>
      <section className="stack">
        <h1>{nl ? 'Doelen die van het gezin zijn' : 'Goals that belong to the family'}</h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          {nl
            ? 'Een doel is nooit van één kind. Iedereen telt mee, en er is niets dat je kwijt kunt raken.'
            : 'A goal never belongs to one child. Everyone counts, and there is nothing you can lose.'}
        </p>
      </section>

      {(data?.goals ?? []).map(({ goal, progress, celebration }) => (
        <section className="card stack" key={goal.id}>
          <h2 style={{ fontSize: '1.2rem' }}>{goal.title}</h2>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 0 }}>
            {progress.achieved} / {goal.target}
          </p>
          <progress
            value={progress.achieved}
            max={goal.target}
            style={{ width: '100%', height: '14px' }}
          >
            {progress.achieved} / {goal.target}
          </progress>
          <p style={{ color: 'var(--ink-soft)' }}>
            {progress.adultsTookPart
              ? nl
                ? 'De volwassenen deden mee.'
                : 'The grown-ups took part.'
              : nl
                ? 'Nog geen volwassene die meedeed.'
                : 'No grown-up has joined in yet.'}
          </p>

          {celebration ? (
            <div className="notice notice--good">
              <strong>{translate(locale, celebration.titleKey)}</strong>
              <p style={{ marginBottom: 0 }}>{translate(locale, celebration.bodyKey)}</p>
              <p style={{ marginBottom: 0, fontSize: '0.85rem' }}>
                {translate(locale, 'celebration.private_note')}
              </p>
            </div>
          ) : null}

          {may(me, 'goal.contribute') ? (
            <form action={contribute}>
              <input type="hidden" name="goalId" value={goal.id} />
              <button className="btn btn--secondary" type="submit">
                {nl ? 'Wij hebben er een gehaald' : 'We managed one'}
              </button>
            </form>
          ) : null}
        </section>
      ))}

      <section className="card card--quiet stack">
        <h2 style={{ fontSize: '1.1rem' }}>{nl ? 'Hoe het loopt' : 'How it is going'}</h2>
        <p style={{ marginBottom: 0 }}>
          {nl
            ? `Deze week: ${data?.momentum.currentWeek ?? 0}. Jullie beste week tot nu toe: ${data?.momentum.bestWeek ?? 0}.`
            : `This week: ${data?.momentum.currentWeek ?? 0}. Your best week so far: ${data?.momentum.bestWeek ?? 0}.`}
        </p>
        <p style={{ marginBottom: 0, color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
          {nl
            ? 'Een rustige week haalt niets weg. Je beste week blijft staan.'
            : 'A quiet week takes nothing away. Your best week stays where it is.'}
        </p>
      </section>

      {may(me, 'goal.create') ? (
        <section className="stack">
          <h2>{nl ? 'Een nieuw doel' : 'A new goal'}</h2>
          <form action={createGoal} className="card stack">
            <div className="field">
              <label htmlFor="title">{nl ? 'Wat willen jullie samen?' : 'What do you want together?'}</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                minLength={3}
                defaultValue={nl ? 'Drie maaltijden zonder apparaten' : 'Three device-free dinners'}
              />
            </div>
            <div className="field">
              <label htmlFor="kind">{nl ? 'Soort' : 'Kind'}</label>
              <select id="kind" name="kind" defaultValue="device_free_dinners">
                {goalKinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {translate(locale, `goal.kind.${kind}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="target">{nl ? 'Hoe vaak per week' : 'How often per week'}</label>
              <input id="target" name="target" type="number" min={1} max={20} defaultValue={3} />
            </div>
            <button className="btn" type="submit">
              {nl ? 'Doel maken' : 'Create goal'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="stack">
        <h2>{nl ? 'Kaarten die jullie hebben verzameld' : 'Cards you have collected'}</h2>
        <p style={{ color: 'var(--ink-soft)' }}>{translate(locale, 'celebration.private_note')}</p>
        <ul className="list-plain grid">
          {(data?.achievements ?? []).map((achievement) => (
            <li key={achievement.id} className="card card--quiet">
              <p className="card__label">
                {new Date(achievement.earnedAt).toLocaleDateString(
                  locale === 'nl' ? 'nl-NL' : 'en-GB',
                )}
              </p>
              <strong>{translate(locale, achievement.titleKey)}</strong>
              <p style={{ marginBottom: 0, color: 'var(--ink-soft)' }}>
                {translate(locale, achievement.bodyKey)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
