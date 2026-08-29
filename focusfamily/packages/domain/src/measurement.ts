import { z } from 'zod';

/**
 * Honest measurement labelling is a product requirement, not a nicety.
 * Every number FocusFamily shows carries the provenance that produced it and
 * the confidence we are willing to claim for it.
 */
export const dataSourceKinds = [
  'self_reported',
  'app_observed',
  'os_verified',
  'simulated',
] as const;
export type DataSourceKind = (typeof dataSourceKinds)[number];

export const confidenceLevels = ['low', 'medium', 'high'] as const;
export type ConfidenceLevel = (typeof confidenceLevels)[number];

/**
 * The confidence we allow ourselves to claim per provenance. A self-reported
 * number can never be presented as high confidence, and simulated data can
 * never be presented as anything but simulated.
 */
export const MAX_CONFIDENCE_BY_SOURCE: Readonly<Record<DataSourceKind, ConfidenceLevel>> =
  Object.freeze({
    self_reported: 'medium',
    app_observed: 'medium',
    os_verified: 'high',
    simulated: 'low',
  });

const confidenceRank: Record<ConfidenceLevel, number> = { low: 0, medium: 1, high: 2 };

export function clampConfidence(
  kind: DataSourceKind,
  requested: ConfidenceLevel,
): ConfidenceLevel {
  const ceiling = MAX_CONFIDENCE_BY_SOURCE[kind];
  return confidenceRank[requested] > confidenceRank[ceiling] ? ceiling : requested;
}

/** The weakest provenance in a set wins - a mixed figure is only as strong as its weakest input. */
export function weakestSource(kinds: readonly DataSourceKind[]): DataSourceKind {
  const order: DataSourceKind[] = ['simulated', 'self_reported', 'app_observed', 'os_verified'];
  for (const candidate of order) {
    if (kinds.includes(candidate)) return candidate;
  }
  return 'self_reported';
}

export const measurementSourceSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  /** Which member the source measures. Null for family-wide sources. */
  memberId: z.string().nullable(),
  kind: z.enum(dataSourceKinds),
  /** e.g. "ios.DeviceActivity", "android.UsageStats", "focusfamily.timer", "mock". */
  provider: z.string().min(1).max(64),
  /** Enabled only while a valid consent record backs it. */
  enabled: z.boolean(),
  createdAt: z.coerce.date(),
  disabledAt: z.coerce.date().nullable().default(null),
});
export type MeasurementSource = z.infer<typeof measurementSourceSchema>;

/**
 * Usage categories are deliberately coarse. FocusFamily never records which app
 * or which website; only how long a broad category was in the foreground, and
 * only when the OS itself reports it with consent.
 */
export const usageCategories = [
  'social',
  'video',
  'games',
  'creation',
  'school',
  'communication',
  'other',
] as const;
export type UsageCategory = (typeof usageCategories)[number];

export const usageSummarySchema = z.object({
  id: z.string(),
  familyId: z.string(),
  memberId: z.string(),
  /** Local YYYY-MM-DD; we never store minute-level timelines. */
  dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.enum(dataSourceKinds),
  provider: z.string().min(1).max(64),
  confidence: z.enum(confidenceLevels),
  /** Whole minutes per coarse category. */
  minutesByCategory: z.record(z.enum(usageCategories), z.number().int().min(0).max(1440)),
  screenPickups: z.number().int().min(0).max(5000).nullable().default(null),
  note: z.string().max(280).nullable().default(null),
  createdAt: z.coerce.date(),
});
export type UsageSummary = z.infer<typeof usageSummarySchema>;

export function totalMinutes(summary: Pick<UsageSummary, 'minutesByCategory'>): number {
  return Object.values(summary.minutesByCategory).reduce<number>(
    (sum, value) => sum + (value ?? 0),
    0,
  );
}

/**
 * A label object every UI must render next to a figure. Keys resolve through
 * the i18n catalogue, so the same summary reads correctly in Dutch and English.
 */
export interface SourceLabel {
  readonly kind: DataSourceKind;
  readonly confidence: ConfidenceLevel;
  readonly labelKey: `source.${DataSourceKind}.label`;
  readonly explanationKey: `source.${DataSourceKind}.explanation`;
  readonly confidenceKey: `confidence.${ConfidenceLevel}`;
}

export function describeSource(
  kind: DataSourceKind,
  confidence: ConfidenceLevel = MAX_CONFIDENCE_BY_SOURCE[kind],
): SourceLabel {
  return {
    kind,
    confidence: clampConfidence(kind, confidence),
    labelKey: `source.${kind}.label`,
    explanationKey: `source.${kind}.explanation`,
    confidenceKey: `confidence.${clampConfidence(kind, confidence)}`,
  };
}
