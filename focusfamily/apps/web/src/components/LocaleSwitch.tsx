import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LOCALE_COOKIE } from '@/lib/i18n';
import type { Locale } from '@focusfamily/domain';

async function setLocale(formData: FormData): Promise<void> {
  'use server';
  const value = formData.get('locale');
  const locale: Locale = value === 'en' ? 'en' : 'nl';
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  revalidatePath('/', 'layout');
}

export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  return (
    <form action={setLocale} style={{ marginLeft: 'auto' }}>
      <fieldset
        style={{ border: 0, padding: 0, margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}
      >
        <legend className="visually-hidden">{label}</legend>
        <button
          type="submit"
          name="locale"
          value="nl"
          className="btn btn--secondary"
          style={{ minHeight: '36px', padding: '4px 12px' }}
          aria-pressed={locale === 'nl'}
          lang="nl"
        >
          Nederlands
        </button>
        <button
          type="submit"
          name="locale"
          value="en"
          className="btn btn--secondary"
          style={{ minHeight: '36px', padding: '4px 12px' }}
          aria-pressed={locale === 'en'}
          lang="en"
        >
          English
        </button>
      </fieldset>
    </form>
  );
}
