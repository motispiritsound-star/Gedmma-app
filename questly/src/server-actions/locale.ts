"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, parseLocale } from "@/modules/i18n";

/** Stores the reader's language choice for a year. Not personal data. */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = parseLocale(String(formData.get("locale") ?? ""));
  if (!locale) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 3600,
  });
  revalidatePath("/", "layout");
}
