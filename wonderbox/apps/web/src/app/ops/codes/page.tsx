import { Badge, Card, DataTable, Field, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { mintCodesAction } from '../../../server/actions/ops.ts';

export default async function CodesPage({
  searchParams,
}: {
  searchParams: Promise<{ minted?: string }>;
}) {
  await requirePermissionPage('activation.mint', '/ops/codes');
  const { minted } = await searchParams;
  const { locale, t } = await requestTranslator();

  const products = await prisma.boxProduct.findMany({
    where: { status: 'ACTIVE' },
    include: { translations: true },
    orderBy: { curriculumIndex: 'asc' },
  });

  const counts = await prisma.activationCode.groupBy({
    by: ['boxProductId', 'state'],
    _count: { _all: true },
  });

  return (
    <>
      <PageHeading
        title={t('ops.codes')}
        description={
          locale === 'nl'
            ? 'Alleen een gepeperde hash van de code wordt opgeslagen. De platte tekst gaat één keer naar de drukker en is daarna nergens meer terug te halen — ook niet door ons.'
            : 'Only a peppered hash of the code is stored. The plaintext goes to the printer once and is unrecoverable afterwards — including by us.'
        }
      />
      {minted ? (
        <Notice tone="ok">
          {locale === 'nl'
            ? `${minted} codes aangemaakt en naar de printopdracht geschreven.`
            : `${minted} codes minted and written to the print run.`}
        </Notice>
      ) : null}

      <DataTable
        caption={t('ops.codes')}
        head={[locale === 'nl' ? 'Doos' : 'Box', 'UNASSIGNED', 'ASSIGNED', 'ACTIVATED', 'REVOKED']}
      >
        {products.map((product) => {
          const forProduct = counts.filter((row) => row.boxProductId === product.id);
          const value = (state: string) =>
            forProduct.find((row) => row.state === state)?._count._all ?? 0;
          return (
            <tr key={product.id} className="border-b border-[var(--color-line)]">
              <td className="px-3 py-2">
                {product.translations.find((entry) => entry.locale === locale)?.name ?? product.sku}
              </td>
              <td className="px-3 py-2">
                <Badge tone={value('UNASSIGNED') > 10 ? 'ok' : 'warn'}>{value('UNASSIGNED')}</Badge>
              </td>
              <td className="px-3 py-2">{value('ASSIGNED')}</td>
              <td className="px-3 py-2">{value('ACTIVATED')}</td>
              <td className="px-3 py-2">{value('REVOKED')}</td>
            </tr>
          );
        })}
      </DataTable>

      <Card className="mt-8 max-w-md">
        <h2 className="mb-4 font-bold">{locale === 'nl' ? 'Codes bijmaken' : 'Mint codes'}</h2>
        <form action={mintCodesAction}>
          <Field label={locale === 'nl' ? 'Doos' : 'Box'} name="boxProductId">
            <select id="boxProductId" name="boxProductId" className="wb-input">
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku}
                </option>
              ))}
            </select>
          </Field>
          <Field label={locale === 'nl' ? 'Aantal' : 'Count'} name="count">
            <input
              id="count"
              name="count"
              type="number"
              min={1}
              max={500}
              defaultValue={50}
              className="wb-input"
            />
          </Field>
          <button type="submit" className="wb-button wb-button-primary">
            {locale === 'nl' ? 'Aanmaken' : 'Mint'}
          </button>
        </form>
      </Card>
    </>
  );
}
