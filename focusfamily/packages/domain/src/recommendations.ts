import { assertNonDiagnostic, type CheckIn, summariseCheckIns } from './checkins.js';
import { baselineState } from './baseline.js';
import type { FamilyAgreement } from './agreements.js';
import type { FocusSession } from './focus.js';
import { countsAsCompleted } from './focus.js';
import type { Family } from './people.js';
import type { DataSourceKind } from './measurement.js';
import { describeSource, type SourceLabel } from './measurement.js';

/**
 * The recommendation engine is deliberately a set of if-statements.
 *
 * It suggests exactly one small change, always states which facts it used,
 * and only ever uses facts the family entered themselves or that the app
 * observed about its own timer. It does not infer mood causes, does not
 * mention health, and refuses to run at all during the baseline week.
 */
export const recommendationKinds = [
  'add_adult_rule',
  'shift_bedtime_charging',
  'shorten_first_focus_moment',
  'schedule_one_dinner',
  'talk_about_a_good_week',
  'invite_second_guardian',
  'lower_the_target',
] as const;
export type RecommendationKind = (typeof recommendationKinds)[number];

export interface Evidence {
  readonly factKey: string;
  readonly value: string | number;
  readonly label: SourceLabel;
}

export interface Recommendation {
  readonly kind: RecommendationKind;
  readonly titleKey: string;
  readonly bodyKey: string;
  /** Plain-language "why you are seeing this", rendered verbatim. */
  readonly reasonKey: string;
  readonly evidence: readonly Evidence[];
  /** Deterministic rules only; never a model output in this MVP. */
  readonly engine: 'deterministic_rules_v1';
  readonly confidence: 'low' | 'medium';
}

export interface RecommendationInput {
  readonly family: Pick<Family, 'baselineStartedAt'>;
  readonly now: Date;
  readonly guardianCount: number;
  readonly agreements: readonly FamilyAgreement[];
  readonly focusSessions: readonly FocusSession[];
  readonly checkIns: readonly CheckIn[];
  readonly hasDinnerSchedule: boolean;
  /** Provenance of the usage figures shown this week, if any. */
  readonly usageSources: readonly DataSourceKind[];
}

function evidence(
  factKey: string,
  value: string | number,
  kind: DataSourceKind,
): Evidence {
  return { factKey, value, label: describeSource(kind) };
}

/**
 * Returns at most one recommendation. Order matters: the earlier rules are the
 * ones with the clearest, least intrusive next step.
 */
export function recommendOne(input: RecommendationInput): Recommendation | null {
  const baseline = baselineState(input.family, input.now);
  if (baseline.suppressNudges) return null;

  const active = input.agreements.filter((agreement) => agreement.status === 'active');
  const rules = active.flatMap((agreement) => agreement.rules);

  // 1. Adults not in the agreement - the single most important fix.
  const adultBound = rules.some(
    (rule) =>
      rule.audience === 'everyone' ||
      rule.audience === 'adults' ||
      rule.ageBands.includes('adult'),
  );
  if (active.length > 0 && !adultBound) {
    return {
      kind: 'add_adult_rule',
      titleKey: 'recommendation.add_adult_rule.title',
      bodyKey: 'recommendation.add_adult_rule.body',
      reasonKey: 'recommendation.add_adult_rule.reason',
      evidence: [evidence('fact.rules_binding_adults', 0, 'app_observed')],
      engine: 'deterministic_rules_v1',
      confidence: 'medium',
    };
  }

  // 2. Only one guardian on the account.
  if (input.guardianCount < 2) {
    return {
      kind: 'invite_second_guardian',
      titleKey: 'recommendation.invite_second_guardian.title',
      bodyKey: 'recommendation.invite_second_guardian.body',
      reasonKey: 'recommendation.invite_second_guardian.reason',
      evidence: [evidence('fact.guardian_count', input.guardianCount, 'app_observed')],
      engine: 'deterministic_rules_v1',
      confidence: 'medium',
    };
  }

  // 3. Focus moments are being abandoned - the plan is probably too ambitious.
  const finished = input.focusSessions.filter((session) =>
    countsAsCompleted(session, input.now),
  );
  const attempted = input.focusSessions.length;
  if (attempted >= 3 && finished.length / attempted < 0.5) {
    return {
      kind: 'shorten_first_focus_moment',
      titleKey: 'recommendation.shorten_focus.title',
      bodyKey: 'recommendation.shorten_focus.body',
      reasonKey: 'recommendation.shorten_focus.reason',
      evidence: [
        evidence('fact.focus_sessions_started', attempted, 'app_observed'),
        evidence('fact.focus_sessions_finished', finished.length, 'app_observed'),
      ],
      engine: 'deterministic_rules_v1',
      confidence: 'medium',
    };
  }

  // 4. No shared meal moment scheduled yet.
  if (!input.hasDinnerSchedule) {
    return {
      kind: 'schedule_one_dinner',
      titleKey: 'recommendation.schedule_dinner.title',
      bodyKey: 'recommendation.schedule_dinner.body',
      reasonKey: 'recommendation.schedule_dinner.reason',
      evidence: [evidence('fact.dinner_schedule_present', 'no', 'app_observed')],
      engine: 'deterministic_rules_v1',
      confidence: 'medium',
    };
  }

  // 5. Self-reported short sleep on school nights, phrased as a routine idea
  //    and never as a health statement.
  const trend = summariseCheckIns(input.checkIns, 7);
  const chargingRule = rules.some((rule) => rule.kind === 'charge_outside_bedroom');
  if (
    trend.averageSleepHours !== null &&
    trend.responseCount >= 3 &&
    trend.averageSleepHours < 8 &&
    !chargingRule
  ) {
    return {
      kind: 'shift_bedtime_charging',
      titleKey: 'recommendation.bedtime_charging.title',
      bodyKey: 'recommendation.bedtime_charging.body',
      reasonKey: 'recommendation.bedtime_charging.reason',
      evidence: [
        evidence('fact.average_sleep_hours', trend.averageSleepHours, 'self_reported'),
        evidence('fact.checkin_responses', trend.responseCount, 'self_reported'),
      ],
      engine: 'deterministic_rules_v1',
      confidence: 'low',
    };
  }

  // 6. Nothing to fix - say so, and suggest a conversation instead.
  if (finished.length > 0) {
    return {
      kind: 'talk_about_a_good_week',
      titleKey: 'recommendation.good_week.title',
      bodyKey: 'recommendation.good_week.body',
      reasonKey: 'recommendation.good_week.reason',
      evidence: [evidence('fact.focus_sessions_finished', finished.length, 'app_observed')],
      engine: 'deterministic_rules_v1',
      confidence: 'medium',
    };
  }

  return null;
}

/**
 * Facts the recommendation engine is allowed to read. Anything outside this
 * list is a boundary violation and the AI interface below is held to it too.
 */
export const ALLOWED_FACT_KEYS: readonly string[] = Object.freeze([
  'fact.rules_binding_adults',
  'fact.guardian_count',
  'fact.focus_sessions_started',
  'fact.focus_sessions_finished',
  'fact.dinner_schedule_present',
  'fact.average_sleep_hours',
  'fact.checkin_responses',
  'fact.goal_progress',
  'fact.week_number',
]);

export function assertWithinDataBoundary(recommendation: Recommendation): void {
  for (const item of recommendation.evidence) {
    if (!ALLOWED_FACT_KEYS.includes(item.factKey)) {
      throw new Error(`Recommendation used a fact outside the boundary: ${item.factKey}`);
    }
  }
}

/* ------------------------- optional AI interface ------------------------- */

export interface AiAdvisorRequest {
  /** Only whitelisted, aggregated facts. No free text, no names, no notes. */
  readonly facts: ReadonlyArray<{ key: string; value: string | number }>;
  readonly locale: 'nl' | 'en';
}

export interface AiAdvisorSuggestion {
  readonly titleKey: string;
  readonly bodyKey: string;
  /** Human-readable, shown verbatim. An unexplained suggestion is not shipped. */
  readonly reason: string;
  readonly usedFactKeys: readonly string[];
}

export interface AiAdvisor {
  readonly enabled: boolean;
  suggest(request: AiAdvisorRequest): Promise<AiAdvisorSuggestion | null>;
}

/**
 * The shipped default. AI assistance is off, and turning it on requires an
 * explicit `ai.assistant` consent record per family - see PRODUCT_DECISIONS.md.
 */
export class DisabledAiAdvisor implements AiAdvisor {
  readonly enabled = false;
  async suggest(): Promise<AiAdvisorSuggestion | null> {
    return null;
  }
}

/**
 * Filter a request down to the boundary before it leaves the process, and
 * reject a suggestion that comes back with clinical or shaming language.
 */
export function prepareAiRequest(
  facts: ReadonlyArray<{ key: string; value: string | number }>,
  locale: 'nl' | 'en',
): AiAdvisorRequest {
  return {
    facts: facts.filter((fact) => ALLOWED_FACT_KEYS.includes(fact.key)),
    locale,
  };
}

export function validateAiSuggestion(suggestion: AiAdvisorSuggestion): AiAdvisorSuggestion {
  assertNonDiagnostic(suggestion.reason);
  for (const key of suggestion.usedFactKeys) {
    if (!ALLOWED_FACT_KEYS.includes(key)) {
      throw new Error(`AI suggestion referenced a fact outside the boundary: ${key}`);
    }
  }
  return suggestion;
}
