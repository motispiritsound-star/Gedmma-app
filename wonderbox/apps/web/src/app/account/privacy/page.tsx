import { Badge, Card, Notice, PageHeading } from '../../../components/ui.tsx';
import { requireFamilyPage } from '../../../lib/auth/guard.ts';
import { env } from '../../../lib/env.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { consentState, POLICY_VERSION } from '../../../server/privacy.ts';
import {
  deleteDataAction,
  exportDataAction,
  setConsentAction,
} from '../../../server/actions/account.ts';

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const actor = await requireFamilyPage('/account/privacy');
  const { locale, t } = await requestTranslator();
  const consents = await consentState(actor.familyId);

  const speech = consents.find((consent) => consent.type === 'SPEECH_TO_TEXT');
  const marketing = consents.find((consent) => consent.type === 'MARKETING_EMAIL');
  const dates = new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', { dateStyle: 'long' });

  return (
    <>
      <PageHeading title={t('account.privacy')} />
      {error === 'confirm' ? (
        <Notice tone="warn">
          {locale === 'nl' ? 'Typ DELETE om te bevestigen.' : 'Type DELETE to confirm.'}
        </Notice>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-bold">{t('privacy.consent')}</h2>
          <p className="mb-4 text-sm text-[var(--color-ink-soft)]">
            {locale === 'nl'
              ? `Huidige versie van het beleid: ${POLICY_VERSION}.`
              : `Current policy version: ${POLICY_VERSION}.`}
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {locale === 'nl' ? 'Spraakherkenning' : 'Speech to text'}
                </h3>
                <Badge tone={speech?.granted ? 'caution' : 'ok'}>
                  {speech?.granted ? (locale === 'nl' ? 'Aan' : 'On') : locale === 'nl' ? 'Uit' : 'Off'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                {locale === 'nl'
                  ? 'Standaard uit. Als je dit aanzet, mag het maatje korte antwoorden herkennen. De opname wordt direct na het herkennen weggegooid en verlaat nooit de server.'
                  : 'Off by default. Turning this on lets the companion recognise short answers. The recording is discarded immediately after recognition and never leaves the server.'}
              </p>
              {!env.SPEECH_TO_TEXT_ENABLED ? (
                <p className="mt-1 text-xs font-semibold text-[var(--color-ink-soft)]">
                  {locale === 'nl'
                    ? 'Deze installatie heeft spraakherkenning helemaal uitgeschakeld (SPEECH_TO_TEXT_ENABLED=false).'
                    : 'This installation has speech to text disabled entirely (SPEECH_TO_TEXT_ENABLED=false).'}
                </p>
              ) : null}
              <form action={setConsentAction} className="mt-2">
                <input type="hidden" name="type" value="SPEECH_TO_TEXT" />
                <input type="hidden" name="granted" value={String(!speech?.granted)} />
                <button type="submit" className="wb-button wb-button-secondary">
                  {speech?.granted
                    ? locale === 'nl'
                      ? 'Uitzetten'
                      : 'Turn off'
                    : locale === 'nl'
                      ? 'Aanzetten'
                      : 'Turn on'}
                </button>
              </form>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {locale === 'nl' ? 'E-mails over nieuwe dozen' : 'Emails about new boxes'}
                </h3>
                <Badge tone={marketing?.granted ? 'neutral' : 'muted'}>
                  {marketing?.granted
                    ? locale === 'nl'
                      ? 'Aan'
                      : 'On'
                    : locale === 'nl'
                      ? 'Uit'
                      : 'Off'}
                </Badge>
              </div>
              <form action={setConsentAction} className="mt-2">
                <input type="hidden" name="type" value="MARKETING_EMAIL" />
                <input type="hidden" name="granted" value={String(!marketing?.granted)} />
                <button type="submit" className="wb-button wb-button-secondary">
                  {marketing?.granted
                    ? locale === 'nl'
                      ? 'Uitzetten'
                      : 'Turn off'
                    : locale === 'nl'
                      ? 'Aanzetten'
                      : 'Turn on'}
                </button>
              </form>
            </div>
          </div>

          {consents.length > 0 ? (
            <ul className="mt-6 space-y-1 border-t border-[var(--color-line)] pt-3 text-xs text-[var(--color-ink-soft)]">
              {consents.map((consent) => (
                <li key={consent.id}>
                  {consent.type} — {consent.granted ? t('common.yes') : t('common.no')} ·{' '}
                  {dates.format(consent.grantedAt)} · v{consent.policyVersion}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 font-bold">{t('privacy.export')}</h2>
            <p className="mb-3 text-sm text-[var(--color-ink-soft)]">
              {locale === 'nl'
                ? 'Alles wat we over jullie bewaren, als één JSON-bestand.'
                : 'Everything we hold about you, as a single JSON file.'}
            </p>
            <form action={exportDataAction}>
              <button type="submit" className="wb-button wb-button-secondary">
                {t('privacy.export')}
              </button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-2 font-bold">{t('privacy.delete')}</h2>
            <Notice tone="warn">{t('privacy.deleteWarning')}</Notice>
            <form action={deleteDataAction}>
              <label htmlFor="confirm" className="wb-label">
                {locale === 'nl' ? 'Typ DELETE om te bevestigen' : 'Type DELETE to confirm'}
              </label>
              <input id="confirm" name="confirm" className="wb-input mb-3" autoComplete="off" />
              <button type="submit" className="wb-button wb-button-secondary">
                {t('privacy.delete')}
              </button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
