'use client';

import { useActionState } from 'react';
import { providerOnboardingAction } from '@/app/actions/provider';
import type { ActionState } from '@/app/actions/guardian';
import { translator, type Locale } from '@/lib/i18n';

export function OnboardingForm({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const [state, action, pending] = useActionState<ActionState, FormData>(providerOnboardingAction, {});
  const nl = locale === 'nl';

  return (
    <form action={action} className="space-y-4" data-testid="provider-onboarding-form">
      <input type="hidden" name="locale" value={locale} />

      {state.error ? (
        <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="legalName">{nl ? 'Statutaire naam' : 'Legal name'}</label>
          <input id="legalName" name="legalName" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="displayName">{nl ? 'Naam op het platform' : 'Public name'}</label>
          <input id="displayName" name="displayName" required className="field" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">{nl ? 'Wat bied je aan?' : 'What do you offer?'}</label>
          <textarea id="description" name="description" rows={3} required minLength={40} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="chamberOfCommerceNo">{nl ? 'KVK-nummer' : 'Chamber of commerce number'}</label>
          <input id="chamberOfCommerceNo" name="chamberOfCommerceNo" inputMode="numeric" pattern="\d{8}" className="field" />
          <p className="hint">{nl ? '8 cijfers. Wordt handmatig gecontroleerd.' : '8 digits. Checked manually.'}</p>
        </div>
        <div>
          <label className="label" htmlFor="vatNumber">{nl ? 'Btw-nummer' : 'VAT number'} ({t('common.optional')})</label>
          <input id="vatNumber" name="vatNumber" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="contactPersonName">{nl ? 'Contactpersoon' : 'Contact person'}</label>
          <input id="contactPersonName" name="contactPersonName" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="contactEmail">{t('auth.email')}</label>
          <input id="contactEmail" name="contactEmail" type="email" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="contactPhone">{nl ? 'Telefoon' : 'Phone'} ({t('common.optional')})</label>
          <input id="contactPhone" name="contactPhone" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="websiteUrl">Website ({t('common.optional')})</label>
          <input id="websiteUrl" name="websiteUrl" type="url" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="liabilityInsurer">{nl ? 'Aansprakelijkheidsverzekeraar' : 'Liability insurer'}</label>
          <input id="liabilityInsurer" name="liabilityInsurer" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="liabilityPolicyNo">{nl ? 'Polisnummer' : 'Policy number'}</label>
          <input id="liabilityPolicyNo" name="liabilityPolicyNo" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="insuranceExpiresAt">{nl ? 'Polis geldig tot' : 'Policy valid until'}</label>
          <input id="insuranceExpiresAt" name="insuranceExpiresAt" type="date" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="safeguardingPolicyUrl">{nl ? 'Veiligheidsbeleid (URL)' : 'Safeguarding policy (URL)'}</label>
          <input id="safeguardingPolicyUrl" name="safeguardingPolicyUrl" type="url" className="field" />
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="vogDeclared" className="mt-1" />
        <span>
          {nl
            ? 'Ik verklaar dat iedereen die bij ons met kinderen werkt een geldige VOG heeft en dat wij het vierogenprincipe hanteren.'
            : 'I declare that everyone working with children at our organisation holds a valid certificate of conduct (VOG) and that we apply the two-adult rule.'}
        </span>
      </label>

      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? t('common.loading') : nl ? 'Aanmelding versturen' : 'Submit application'}
      </button>
    </form>
  );
}
