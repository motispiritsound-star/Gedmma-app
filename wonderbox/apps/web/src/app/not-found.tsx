import Link from 'next/link';
import { requestTranslator } from '../lib/ui/locale.ts';

export default async function NotFound() {
  const { locale } = await requestTranslator();
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-3xl font-bold">
        {locale === 'nl' ? 'Deze pagina bestaat niet' : 'This page does not exist'}
      </h1>
      <p className="mt-3 text-[var(--color-ink-soft)]">
        {locale === 'nl'
          ? 'Misschien is de doos nog niet vrijgegeven, of klopt het adres niet helemaal.'
          : 'Perhaps the box has not been released yet, or the address is not quite right.'}
      </p>
      <Link href="/" className="wb-button wb-button-primary mt-6">
        {locale === 'nl' ? 'Naar de startpagina' : 'Go to the home page'}
      </Link>
    </div>
  );
}
