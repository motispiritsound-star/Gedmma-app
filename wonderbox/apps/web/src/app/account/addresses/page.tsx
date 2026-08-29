import { Badge, Card, Field, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requireFamilyPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { saveAddressAction, setDefaultAddressAction } from '../../../server/actions/account.ts';

export default async function AddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ needed?: string }>;
}) {
  const { needed } = await searchParams;
  const actor = await requireFamilyPage('/account/addresses');
  const { locale, t } = await requestTranslator();
  const addresses = await prisma.address.findMany({
    where: { familyId: actor.familyId },
    orderBy: [{ isDefaultShipping: 'desc' }, { createdAt: 'asc' }],
  });

  return (
    <>
      <PageHeading title={t('account.addresses')} />
      {needed ? (
        <Notice tone="warn">
          {locale === 'nl'
            ? 'Voeg eerst een bezorgadres toe — daarna kun je bestellen.'
            : 'Add a delivery address first — then you can order.'}
        </Notice>
      ) : null}

      <ul className="mb-8 grid gap-3 sm:grid-cols-2">
        {addresses.map((address) => (
          <Card key={address.id} as="li">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="muted">{address.label}</Badge>
              {address.isDefaultShipping ? (
                <Badge tone="ok">{locale === 'nl' ? 'Standaard' : 'Default'}</Badge>
              ) : null}
            </div>
            <address className="text-sm not-italic">
              {address.recipient}
              <br />
              {address.line1}
              {address.line2 ? (
                <>
                  <br />
                  {address.line2}
                </>
              ) : null}
              <br />
              {address.postalCode} {address.city}
              <br />
              {address.country}
            </address>
            {address.isDefaultShipping ? null : (
              <form action={setDefaultAddressAction} className="mt-3">
                <input type="hidden" name="addressId" value={address.id} />
                <button type="submit" className="text-sm underline">
                  {locale === 'nl' ? 'Maak standaard' : 'Make default'}
                </button>
              </form>
            )}
          </Card>
        ))}
      </ul>

      <Card>
        <h2 className="mb-4 font-bold">
          {locale === 'nl' ? 'Adres toevoegen' : 'Add an address'}
        </h2>
        <form action={saveAddressAction}>
          <Field label={locale === 'nl' ? 'Ter attentie van' : 'Recipient'} name="recipient">
            <input id="recipient" name="recipient" required className="wb-input" autoComplete="name" />
          </Field>
          <Field label={locale === 'nl' ? 'Straat en huisnummer' : 'Street and number'} name="line1">
            <input id="line1" name="line1" required className="wb-input" autoComplete="address-line1" />
          </Field>
          <Field label={locale === 'nl' ? 'Toevoeging' : 'Address line 2'} name="line2">
            <input id="line2" name="line2" className="wb-input" autoComplete="address-line2" />
          </Field>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field label={locale === 'nl' ? 'Postcode' : 'Postal code'} name="postalCode">
              <input
                id="postalCode"
                name="postalCode"
                required
                className="wb-input"
                autoComplete="postal-code"
              />
            </Field>
            <Field label={locale === 'nl' ? 'Plaats' : 'City'} name="city">
              <input id="city" name="city" required className="wb-input" autoComplete="address-level2" />
            </Field>
            <Field label={locale === 'nl' ? 'Land' : 'Country'} name="country">
              <select id="country" name="country" className="wb-input" defaultValue="NL">
                <option value="NL">Nederland</option>
                <option value="BE">België</option>
                <option value="DE">Deutschland</option>
              </select>
            </Field>
            <Field label={locale === 'nl' ? 'Telefoon' : 'Phone'} name="phone">
              <input id="phone" name="phone" className="wb-input" autoComplete="tel" />
            </Field>
          </div>
          <button type="submit" className="wb-button wb-button-primary">
            {t('common.save')}
          </button>
        </form>
      </Card>
    </>
  );
}
