import { z } from 'zod';
import { DomainError } from './errors.js';
import { ageBands, type AgeBand } from './people.js';
import { isClockTime, parseClockTime, type Weekday } from './time.js';

/**
 * The six life contexts the builder covers. They map onto the moments families
 * actually argue about, rather than onto app categories.
 */
export const agreementContexts = [
  'meals',
  'homework',
  'bedtime',
  'bedrooms',
  'school',
  'family_activities',
] as const;
export type AgreementContext = (typeof agreementContexts)[number];

/**
 * Who a rule binds. `everyone` is the default and the one the product nudges
 * families towards: adults model what they ask of children.
 */
export const ruleAudiences = ['everyone', 'adults', 'children', 'member'] as const;
export type RuleAudience = (typeof ruleAudiences)[number];

export const ruleKinds = [
  'devices_away',
  'device_free_room',
  'quiet_window',
  'shared_activity',
  'charge_outside_bedroom',
  'ask_before_new_app',
] as const;
export type RuleKind = (typeof ruleKinds)[number];

export const agreementStatuses = ['draft', 'proposed', 'active', 'retired'] as const;
export type AgreementStatus = (typeof agreementStatuses)[number];

export const agreementRuleSchema = z
  .object({
    id: z.string(),
    agreementId: z.string(),
    context: z.enum(agreementContexts),
    kind: z.enum(ruleKinds),
    audience: z.enum(ruleAudiences),
    /** Required when audience === 'member'. */
    memberId: z.string().nullable().default(null),
    /** Optional narrowing by age band; empty means "all bands in the audience". */
    ageBands: z.array(z.enum(ageBands)).default([]),
    /** Local HH:mm window, optional for rules that are not time bound. */
    startsAt: z.string().refine(isClockTime, 'time_format').nullable().default(null),
    endsAt: z.string().refine(isClockTime, 'time_format').nullable().default(null),
    weekdays: z.array(z.number().int().min(0).max(6)).default([]),
    /** Warm, first-person wording the family wrote themselves. */
    text: z.string().min(3).max(240),
    /** What we do when it does not work out. Never a punishment. */
    repairText: z.string().max(240).nullable().default(null),
    createdAt: z.coerce.date(),
  })
  .superRefine((rule, ctx) => {
    if (rule.audience === 'member' && !rule.memberId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['memberId'],
        message: 'agreement.member_required',
      });
    }
    if ((rule.startsAt === null) !== (rule.endsAt === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'agreement.window_incomplete',
      });
    }
  });
export type AgreementRule = z.infer<typeof agreementRuleSchema>;

export const familyAgreementSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  title: z.string().min(3).max(80),
  status: z.enum(agreementStatuses),
  /** Everyone who has said "yes, this is ours". */
  agreedByUserIds: z.array(z.string()).default([]),
  createdByUserId: z.string(),
  createdAt: z.coerce.date(),
  activatedAt: z.coerce.date().nullable().default(null),
  reviewOnDayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  rules: z.array(agreementRuleSchema).default([]),
});
export type FamilyAgreement = z.infer<typeof familyAgreementSchema>;

export interface AgreementValidationIssue {
  readonly code:
    | 'no_rules'
    | 'adults_not_included'
    | 'children_only_context'
    | 'window_too_long'
    | 'child_band_missing';
  readonly messageKey: string;
  readonly ruleId?: string;
  readonly context?: AgreementContext;
}

/** A rule binds adults when it targets everyone, adults, or an adult member. */
export function bindsAdults(rule: Pick<AgreementRule, 'audience' | 'ageBands'>): boolean {
  if (rule.audience === 'children') return false;
  if (rule.audience === 'member') return rule.ageBands.includes('adult');
  if (rule.ageBands.length === 0) return true;
  return rule.ageBands.includes('adult');
}

export function bindsChildren(rule: Pick<AgreementRule, 'audience' | 'ageBands'>): boolean {
  if (rule.audience === 'adults') return false;
  if (rule.ageBands.length === 0) return true;
  return rule.ageBands.some((band) => band !== 'adult');
}

const MAX_QUIET_WINDOW_MINUTES = 14 * 60;

/**
 * The product rule that makes FocusFamily different from a parental-control
 * app: an agreement is not valid unless at least one rule binds the adults,
 * and no single context may be children-only.
 */
export function validateAgreement(
  agreement: Pick<FamilyAgreement, 'rules'>,
): AgreementValidationIssue[] {
  const issues: AgreementValidationIssue[] = [];
  const { rules } = agreement;

  if (rules.length === 0) {
    issues.push({ code: 'no_rules', messageKey: 'agreement.issue.no_rules' });
    return issues;
  }

  if (!rules.some(bindsAdults)) {
    issues.push({
      code: 'adults_not_included',
      messageKey: 'agreement.issue.adults_not_included',
    });
  }

  const byContext = new Map<AgreementContext, AgreementRule[]>();
  for (const rule of rules) {
    const bucket = byContext.get(rule.context) ?? [];
    bucket.push(rule);
    byContext.set(rule.context, bucket);
  }
  for (const [context, contextRules] of byContext) {
    if (!contextRules.some(bindsAdults)) {
      issues.push({
        code: 'children_only_context',
        messageKey: 'agreement.issue.children_only_context',
        context,
      });
    }
  }

  for (const rule of rules) {
    if (rule.startsAt && rule.endsAt) {
      const start = parseClockTime(rule.startsAt);
      const end = parseClockTime(rule.endsAt);
      const length = end > start ? end - start : end - start + 24 * 60;
      if (length > MAX_QUIET_WINDOW_MINUTES) {
        issues.push({
          code: 'window_too_long',
          messageKey: 'agreement.issue.window_too_long',
          ruleId: rule.id,
        });
      }
    }
  }

  return issues;
}

export function assertActivatable(agreement: FamilyAgreement): void {
  const issues = validateAgreement(agreement);
  if (issues.length > 0) {
    throw DomainError.policy('agreement.not_activatable', {
      issues: issues.map((issue) => issue.code),
    });
  }
}

export interface AppliesToArgs {
  readonly memberId: string;
  readonly ageBand: AgeBand;
  readonly weekday?: Weekday;
}

/** Does this rule apply to this person (optionally on this weekday)? */
export function ruleAppliesTo(rule: AgreementRule, who: AppliesToArgs): boolean {
  if (rule.weekdays.length > 0 && who.weekday !== undefined) {
    if (!rule.weekdays.includes(who.weekday)) return false;
  }
  if (rule.ageBands.length > 0 && !rule.ageBands.includes(who.ageBand)) return false;
  switch (rule.audience) {
    case 'everyone':
      return true;
    case 'adults':
      return who.ageBand === 'adult';
    case 'children':
      return who.ageBand !== 'adult';
    case 'member':
      return rule.memberId === who.memberId;
    default:
      return false;
  }
}

/**
 * The "what applies to me" view every member gets, adults included. This is
 * the transparency screen: nobody has to ask what is being measured or expected.
 */
export function rulesFor(
  agreement: Pick<FamilyAgreement, 'rules'>,
  who: AppliesToArgs,
): AgreementRule[] {
  return agreement.rules.filter((rule) => ruleAppliesTo(rule, who));
}

/** Age-appropriate variations: same rule, different wording per band. */
export const AGE_VARIATION_KEY_BY_BAND: Readonly<Record<AgeBand, string>> = Object.freeze({
  '8-10': 'agreement.variation.8_10',
  '11-13': 'agreement.variation.11_13',
  '14-17': 'agreement.variation.14_17',
  adult: 'agreement.variation.adult',
});

export interface AgreementTemplateRule {
  readonly context: AgreementContext;
  readonly kind: RuleKind;
  readonly audience: RuleAudience;
  readonly textKey: string;
  readonly repairKey: string;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly weekdays?: readonly number[];
}

/**
 * Starting points, not defaults that are silently applied. The builder shows
 * them as suggestions the family edits in their own words.
 */
export const AGREEMENT_TEMPLATES: readonly AgreementTemplateRule[] = Object.freeze([
  {
    context: 'meals',
    kind: 'devices_away',
    audience: 'everyone',
    textKey: 'template.meals.text',
    repairKey: 'template.meals.repair',
    startsAt: '18:00',
    endsAt: '19:00',
  },
  {
    context: 'homework',
    kind: 'quiet_window',
    audience: 'everyone',
    textKey: 'template.homework.text',
    repairKey: 'template.homework.repair',
    startsAt: '16:30',
    endsAt: '17:30',
    weekdays: [1, 2, 3, 4, 5],
  },
  {
    context: 'bedtime',
    kind: 'charge_outside_bedroom',
    audience: 'everyone',
    textKey: 'template.bedtime.text',
    repairKey: 'template.bedtime.repair',
    startsAt: '21:00',
    endsAt: '07:00',
  },
  {
    context: 'bedrooms',
    kind: 'device_free_room',
    audience: 'everyone',
    textKey: 'template.bedrooms.text',
    repairKey: 'template.bedrooms.repair',
  },
  {
    context: 'school',
    kind: 'ask_before_new_app',
    audience: 'everyone',
    textKey: 'template.school.text',
    repairKey: 'template.school.repair',
  },
  {
    context: 'family_activities',
    kind: 'shared_activity',
    audience: 'everyone',
    textKey: 'template.family_activities.text',
    repairKey: 'template.family_activities.repair',
    weekdays: [0, 6],
  },
]);
