export const USER_ROLES = ['CUSTOMER', 'PRO', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const JOB_STATUSES = [
  'DRAFT',
  'OPEN',
  'QUOTED',
  'AWARDED',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const QUOTE_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** How soon the customer needs the work done. Drives lead ranking for pros. */
export const JOB_URGENCIES = ['URGENT', 'WITHIN_WEEK', 'WITHIN_MONTH', 'FLEXIBLE'] as const;
export type JobUrgency = (typeof JOB_URGENCIES)[number];

export const PROPERTY_TYPES = [
  'APPARTEMENT',
  'TUSSENWONING',
  'HOEKWONING',
  'TWEE_ONDER_EEN_KAP',
  'VRIJSTAAND',
  'BEDRIJFSPAND',
  'VVE',
  'ANDERS',
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PRO_VERIFICATION_STATUSES = [
  'UNVERIFIED',
  'PENDING',
  'VERIFIED',
  'REJECTED',
] as const;
export type ProVerificationStatus = (typeof PRO_VERIFICATION_STATUSES)[number];

export const SUBSCRIPTION_STATUSES = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
  'EXPIRED',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const BILLING_PERIODS = ['MONTHLY', 'YEARLY'] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

/**
 * iDEAL is how the Netherlands pays online, and SEPA direct debit is how it
 * pays for subscriptions. Card and bank transfer cover foreign-registered
 * businesses and companies that insist on invoicing.
 */
export const PAYMENT_METHODS = ['IDEAL', 'SEPA_DIRECT_DEBIT', 'CARD', 'BANK_TRANSFER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Reasons a pro's lead credit balance moves, for an auditable ledger. */
export const CREDIT_REASONS = [
  'PLAN_GRANT',
  'TRIAL_GRANT',
  'QUOTE_SUBMITTED',
  'QUOTE_REFUND',
  'MANUAL_ADJUSTMENT',
  'TOPUP_PURCHASE',
] as const;
export type CreditReason = (typeof CREDIT_REASONS)[number];
