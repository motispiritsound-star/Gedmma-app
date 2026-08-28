import { formatDistanceKm, type Locale } from '@buurklus/shared';

export { formatDate, formatDuration, formatMoney, formatRelative, pickName } from './format';

/** Distance to a job, already rounded by the API to whole kilometres. */
export function formatDistanceLabel(km: number, _locale: Locale): string {
  return formatDistanceKm(km);
}
