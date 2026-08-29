import { redirect } from 'next/navigation';
import { BASELINE_DAYS, translate } from '@focusfamily/domain';
import { api } from '@/lib/api';
import { getSiteText } from '@/lib/i18n';
import { requireMe } from '@/lib/session';

export default async function OnboardingPage() {
  const { locale } = await getSiteText();
  const me = await requireMe();
  if (me.membership) redirect('/app');
  const nl = locale === 'nl';

  async function createFamily(formData: FormData): Promise<void> {
    'use server';
    const result = await api.post('/families', {
      name: String(formData.get('name') ?? ''),
      displayName: String(formData.get('displayName') ?? ''),
      timeZone: 'Europe/Amsterdam',
      locale: 'nl',
      startBaseline: formData.get('startBaseline') === 'on',
    });
    if (result.ok) redirect('/app');
  }

  return (
    <div className="stack-lg" style={{ maxWidth: '40rem' }}>
      <section className="stack">
        <h1>{nl ? 'Een gezin aanmaken' : 'Create a family'}</h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          {nl
            ? 'Je maakt eerst het gezin aan. Daarna nodig je de andere volwassene uit en koppel je de kinderen, samen met hen.'
            : 'You create the family first. Then you invite the other grown-up and link the children, together with them.'}
        </p>
      </section>

      <form action={createFamily} className="card stack">
        <div className="field">
          <label htmlFor="name">{nl ? 'Naam van het gezin' : 'Family name'}</label>
          <input id="name" name="name" type="text" required minLength={1} />
        </div>
        <div className="field">
          <label htmlFor="displayName">{nl ? 'Hoe noemen ze jou?' : 'What do they call you?'}</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            defaultValue={me.user.displayName}
          />
        </div>
        <div className="choice">
          <input type="checkbox" id="startBaseline" name="startBaseline" defaultChecked />
          <label htmlFor="startBaseline">
            {nl
              ? `Begin met een rustige week van ${BASELINE_DAYS} dagen`
              : `Start with a quiet week of ${BASELINE_DAYS} days`}
          </label>
        </div>
        <p className="notice">{translate(locale, 'baseline.active')}</p>
        <button className="btn" type="submit">
          {nl ? 'Gezin aanmaken' : 'Create family'}
        </button>
      </form>
    </div>
  );
}
