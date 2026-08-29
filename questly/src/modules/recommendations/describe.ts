import type { Translate, TranslationKey } from "@/modules/i18n";
import type { Reason } from "./types";

/**
 * Turns a reason code into a sentence a parent can read. Enum-valued params are
 * translated too, so "OUTDOOR" reads as "Buiten" / "Outdoor".
 */
export function describeReason(reason: Reason, t: Translate): string {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(reason.params ?? {})) {
    if (key === "setting") params[key] = t(`setting.${value}` as TranslationKey);
    else if (key === "weather") params[key] = t(`weather.${value}` as TranslationKey);
    else if (key === "season") params[key] = t(`season.${value}` as TranslationKey);
    else params[key] = value;
  }
  return t(`rec.reason.${reason.code}` as TranslationKey, params);
}
