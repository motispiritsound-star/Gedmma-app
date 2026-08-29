import { setLocaleAction } from "@/server-actions/locale";
import type { AppLocale, Translate } from "@/modules/i18n";

export function LocaleSwitcher({ locale, t }: { locale: AppLocale; t: Translate }) {
  const next: AppLocale = locale === "nl" ? "en" : "nl";
  return (
    <form action={setLocaleAction}>
      <input type="hidden" name="locale" value={next} />
      <button type="submit" className="q-btn q-btn--ghost px-3 py-1.5 text-sm" lang={next}>
        <span aria-hidden="true">{next === "en" ? "🇬🇧" : "🇳🇱"}</span>
        {t("locale.switchTo")}
      </button>
    </form>
  );
}
