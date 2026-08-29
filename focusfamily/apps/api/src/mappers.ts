import { AGE_BAND_FROM_DB, type DbAgeBand } from '@focusfamily/db';
import type {
  AgeBand,
  FocusEvent,
  FocusSession,
  Subscription,
} from '@focusfamily/domain';

/** Row shapes as Prisma returns them, narrowed to what the mappers need. */
export interface SubscriptionRow {
  id: string;
  familyId: string;
  plan: string;
  status: string;
  provider: string;
  providerRef: string | null;
  sponsorName: string | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
}

export function toDomainSubscription(row: SubscriptionRow | null): Subscription | null {
  if (!row) return null;
  return {
    id: row.id,
    familyId: row.familyId,
    plan: row.plan as Subscription['plan'],
    status: row.status as Subscription['status'],
    provider: row.provider as Subscription['provider'],
    providerRef: row.providerRef,
    sponsorName: row.sponsorName,
    currentPeriodEnd: row.currentPeriodEnd,
    createdAt: row.createdAt,
  };
}

export interface FocusSessionRow {
  id: string;
  familyId: string;
  scheduleId: string | null;
  participantIds: string[];
  startedByUserId: string;
  plannedMinutes: number;
  status: string;
  createdAt: Date;
  events: Array<{
    id: string;
    type: string;
    at: Date;
    reason: string | null;
    recordedOffline: boolean;
  }>;
}

export function toDomainSession(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    familyId: row.familyId,
    scheduleId: row.scheduleId,
    participantIds: row.participantIds,
    startedByUserId: row.startedByUserId,
    plannedMinutes: row.plannedMinutes,
    status: row.status as FocusSession['status'],
    source: 'app_observed',
    createdAt: row.createdAt,
    events: row.events.map(
      (event): FocusEvent => ({
        id: event.id,
        type: event.type as FocusEvent['type'],
        at: event.at,
        reason: event.reason as FocusEvent['reason'],
        recordedOffline: event.recordedOffline,
      }),
    ),
  };
}

export function ageBandOf(
  membership: { childProfile: { ageBand: string } | null } | null,
): AgeBand {
  return membership?.childProfile
    ? AGE_BAND_FROM_DB[membership.childProfile.ageBand as DbAgeBand]
    : 'adult';
}
