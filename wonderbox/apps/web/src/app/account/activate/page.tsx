import { Card, Field, Notice, PageHeading } from '../../../components/ui.tsx';
import { requireFamilyPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { activateBoxAction } from '../../../server/actions/account.ts';

const ERRORS = {
  invalidCode: 'activate.invalid',
  alreadyActivated: 'activate.used',
  notOwned: 'activate.notOwned',
  revoked: 'activate.invalid',
  rateLimited: 'activate.rateLimited',
} as const;

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: keyof typeof ERRORS }>;
}) {
  await requireFamilyPage('/account/activate');
  const { error } = await searchParams;
  const { locale, t } = await requestTranslator();

  return (
    <div className="max-w-lg">
      <PageHeading title={t('activate.title')} description={t('activate.help')} />
      {error ? <Notice tone="warn">{t(ERRORS[error] ?? 'activate.invalid')}</Notice> : null}
      <Card>
        <form action={activateBoxAction}>
          <Field
            label={t('activate.title')}
            name="code"
            hint={locale === 'nl' ? 'Bijvoorbeeld WB-3F7K-22AA-M9X1' : 'For example WB-3F7K-22AA-M9X1'}
          >
            <input
              id="code"
              name="code"
              required
              className="wb-input font-mono text-lg tracking-widest uppercase"
              placeholder="WB-____-____-____"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="code-hint"
            />
          </Field>
          <button type="submit" className="wb-button wb-button-primary w-full">
            {t('activate.submit')}
          </button>
        </form>
      </Card>
      <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
        {locale === 'nl'
          ? 'Later komt er een NFC-tag in het deksel; dan is een tik met de doos genoeg. De code blijft er altijd bij staan.'
          : 'Later there will be an NFC tag in the lid, so a tap of the box is enough. The printed code always stays as a fallback.'}
      </p>
    </div>
  );
}
