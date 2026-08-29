/** URL-safe slug: lowercase ASCII, diacritics stripped, dashes between words. */
export function slugify(value: string, maxLength = 60): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLength);
}
