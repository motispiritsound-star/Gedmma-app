import { Card, EmptyState, Field, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requireFamilyPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { addChildAction, removeChildAction } from '../../../server/actions/account.ts';

export default async function ChildrenPage() {
  const actor = await requireFamilyPage('/account/children');
  const { locale, t } = await requestTranslator();
  const children = await prisma.childProfile.findMany({
    where: { familyId: actor.familyId },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <>
      <PageHeading
        title={t('account.children')}
        description={
          locale === 'nl'
            ? 'Een kindprofiel is een voorkeur, geen account. Er is geen inlog, geen e-mailadres en geen profiel dat iemand anders kan zien.'
            : 'A child profile is a preference, not an account. There is no login, no email address and no profile anyone else can see.'
        }
      />

      {children.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <ul className="mb-8 grid gap-3 sm:grid-cols-2">
          {children.map((child) => {
            const accessibility = (child.accessibility ?? {}) as {
              narrationSpeed?: string;
              extraPauseSeconds?: number;
            };
            return (
              <Card key={child.id} as="li">
                <h2 className="font-bold">{child.displayName}</h2>
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {new Date().getFullYear() - child.birthYear} {locale === 'nl' ? 'jaar' : 'years'} ·{' '}
                  {child.ageBand.replace('AGE_', '').replace('_', '–')}
                </p>
                {child.interests.length > 0 ? (
                  <p className="mt-1 text-sm">{child.interests.join(', ')}</p>
                ) : null}
                <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
                  {t('child.slowNarration')}:{' '}
                  {accessibility.narrationSpeed === 'slow' ? t('common.yes') : t('common.no')} ·{' '}
                  {t('child.extraPause')}: {accessibility.extraPauseSeconds ?? 0}
                </p>
                <form action={removeChildAction} className="mt-3">
                  <input type="hidden" name="childId" value={child.id} />
                  <button type="submit" className="text-sm underline">
                    {locale === 'nl' ? 'Verwijderen' : 'Remove'}
                  </button>
                </form>
              </Card>
            );
          })}
        </ul>
      )}

      <Card>
        <h2 className="mb-4 font-bold">{t('child.add')}</h2>
        <form action={addChildAction}>
          <Field label={t('child.name')} name="displayName">
            <input id="displayName" name="displayName" required maxLength={60} className="wb-input" />
          </Field>
          <Field label={t('child.birthYear')} name="birthYear">
            <input
              id="birthYear"
              name="birthYear"
              type="number"
              required
              min={new Date().getFullYear() - 14}
              max={new Date().getFullYear()}
              className="wb-input"
            />
          </Field>
          <Field
            label={t('child.interests')}
            name="interests"
            hint={locale === 'nl' ? 'Gescheiden door komma’s.' : 'Comma separated.'}
          >
            <input id="interests" name="interests" className="wb-input" aria-describedby="interests-hint" />
          </Field>
          <Field label={t('child.slowNarration')} name="narrationSpeed">
            <select id="narrationSpeed" name="narrationSpeed" className="wb-input">
              <option value="normal">{t('common.no')}</option>
              <option value="slow">{t('common.yes')}</option>
            </select>
          </Field>
          <Field label={t('child.extraPause')} name="extraPauseSeconds">
            <input
              id="extraPauseSeconds"
              name="extraPauseSeconds"
              type="number"
              min={0}
              max={15}
              defaultValue={0}
              className="wb-input"
            />
          </Field>
          <button type="submit" className="wb-button wb-button-primary">
            {t('common.save')}
          </button>
        </form>
      </Card>
    </>
  );
}
