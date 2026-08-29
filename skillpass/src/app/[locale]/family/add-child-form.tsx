'use client';

import { useActionState } from 'react';
import { addChildAction, type ActionState } from '@/app/actions/guardian';
import { translator, type Locale } from '@/lib/i18n';

export function AddChildForm({
  locale,
  ageBands,
  interests,
}: {
  locale: Locale;
  ageBands: { value: string; label: string }[];
  interests: { slug: string; label: string }[];
}) {
  const t = translator(locale);
  const [state, action, pending] = useActionState<ActionState, FormData>(addChildAction, {});

  return (
    <form action={action} className="space-y-4" data-testid="add-child-form">
      {state.error ? (
        <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {locale === 'nl' ? 'Kindprofiel toegevoegd.' : 'Child profile added.'}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="nickname">
            {t('family.nickname')}
          </label>
          <input id="nickname" name="nickname" required maxLength={40} className="field" />
          <p className="hint">{t('family.nicknameHint')}</p>
        </div>

        <div>
          <label className="label" htmlFor="ageBand">
            {t('family.ageBand')}
          </label>
          <select id="ageBand" name="ageBand" required className="field" defaultValue="">
            <option value="" disabled>
              —
            </option>
            {ageBands.map((band) => (
              <option key={band.value} value={band.value}>
                {band.label}
              </option>
            ))}
          </select>
          <p className="hint">{t('family.ageBandHint')}</p>
        </div>

        <div>
          <label className="label" htmlFor="pronouns">
            {locale === 'nl' ? 'Voornaamwoorden' : 'Pronouns'} ({t('common.optional')})
          </label>
          <input id="pronouns" name="pronouns" maxLength={30} className="field" />
        </div>

        <div>
          <label className="label" htmlFor="accessibilityNeeds">
            {t('family.accessibility')} ({t('common.optional')})
          </label>
          <input id="accessibilityNeeds" name="accessibilityNeeds" maxLength={500} className="field" />
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="medicalNotes">
            {t('family.medical')} ({t('common.optional')})
          </label>
          <input id="medicalNotes" name="medicalNotes" maxLength={500} className="field" />
          <p className="hint">{t('family.medicalHint')}</p>
        </div>
      </div>

      <fieldset>
        <legend className="label">{t('family.languages')}</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="preferredLanguages" value="NL" defaultChecked /> Nederlands
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="preferredLanguages" value="EN" /> English
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">{t('family.interests')}</legend>
        <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded border border-slate-200 p-3 text-sm sm:grid-cols-3">
          {interests.map((interest) => (
            <label key={interest.slug} className="flex items-center gap-2">
              <input type="checkbox" name="interests" value={interest.slug} />
              {interest.label}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? t('common.loading') : t('family.addChild')}
      </button>
    </form>
  );
}
