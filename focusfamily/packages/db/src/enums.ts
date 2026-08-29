import type { AgeBand, ConsentScope, Feature } from '@focusfamily/domain';

/**
 * Postgres enum labels cannot contain hyphens or dots, so a few domain unions
 * need a translation. Keeping the mapping here means the API never has to
 * remember which side it is on.
 */
export const AGE_BAND_TO_DB = {
  '8-10': 'band_8_10',
  '11-13': 'band_11_13',
  '14-17': 'band_14_17',
  adult: 'adult',
} as const satisfies Record<AgeBand, string>;

export const AGE_BAND_FROM_DB = {
  band_8_10: '8-10',
  band_11_13: '11-13',
  band_14_17: '14-17',
  adult: 'adult',
} as const;

export type DbAgeBand = keyof typeof AGE_BAND_FROM_DB;

export const CONSENT_SCOPE_TO_DB = {
  'account.basic': 'account_basic',
  'measurement.self_report': 'measurement_self_report',
  'measurement.app_observed': 'measurement_app_observed',
  'measurement.os_verified': 'measurement_os_verified',
  'notifications.push': 'notifications_push',
  'insights.weekly_review': 'insights_weekly_review',
  'ai.assistant': 'ai_assistant',
} as const satisfies Record<ConsentScope, string>;

export const CONSENT_SCOPE_FROM_DB = {
  account_basic: 'account.basic',
  measurement_self_report: 'measurement.self_report',
  measurement_app_observed: 'measurement.app_observed',
  measurement_os_verified: 'measurement.os_verified',
  notifications_push: 'notifications.push',
  insights_weekly_review: 'insights.weekly_review',
  ai_assistant: 'ai.assistant',
} as const;

export type DbConsentScope = keyof typeof CONSENT_SCOPE_FROM_DB;

export const FEATURE_TO_DB = {
  'agreements.multiple': 'agreements_multiple',
  'insights.history_90d': 'insights_history_90d',
  'programmes.guided': 'programmes_guided',
  'activities.extra_packs': 'activities_extra_packs',
  'review.export_pdf': 'review_export_pdf',
  'focus.custom_schedules': 'focus_custom_schedules',
} as const satisfies Record<Feature, string>;

export const FEATURE_FROM_DB = {
  agreements_multiple: 'agreements.multiple',
  insights_history_90d: 'insights.history_90d',
  programmes_guided: 'programmes.guided',
  activities_extra_packs: 'activities.extra_packs',
  review_export_pdf: 'review.export_pdf',
  focus_custom_schedules: 'focus.custom_schedules',
} as const;

export type DbFeature = keyof typeof FEATURE_FROM_DB;
