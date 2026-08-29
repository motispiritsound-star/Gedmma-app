import { z } from 'zod';

/**
 * Export, deletion and the audit trail. Every family member can export their
 * own data; a guardian can export the family bundle. Deletion is a real
 * deletion after a short grace period, not a hidden "deactivated" flag.
 */
export const exportFormats = ['json', 'csv_zip'] as const;
export type ExportFormat = (typeof exportFormats)[number];

export const requestStatuses = ['pending', 'ready', 'failed', 'expired'] as const;
export type RequestStatus = (typeof requestStatuses)[number];

export const dataExportRequestSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    requestedByUserId: z.string(),
    /** 'self' exports one person; 'family' needs a guardian. */
    scope: z.enum(['self', 'family']),
    format: z.enum(exportFormats),
    status: z.enum(requestStatuses),
    requestedAt: z.coerce.date(),
    completedAt: z.coerce.date().nullable().default(null),
    /** Download links expire; the bundle is deleted with them. */
    expiresAt: z.coerce.date().nullable().default(null),
  })
  .strict();
export type DataExportRequest = z.infer<typeof dataExportRequestSchema>;

export const deletionScopes = ['self', 'child_profile', 'family'] as const;
export type DeletionScope = (typeof deletionScopes)[number];

/** Days between asking and irreversible deletion. Cancellable throughout. */
export const DELETION_GRACE_DAYS = 7;

export const deletionRequestSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    requestedByUserId: z.string(),
    subjectUserId: z.string().nullable().default(null),
    scope: z.enum(deletionScopes),
    status: z.enum(['scheduled', 'cancelled', 'completed']),
    requestedAt: z.coerce.date(),
    executeAfter: z.coerce.date(),
    completedAt: z.coerce.date().nullable().default(null),
    cancelledAt: z.coerce.date().nullable().default(null),
  })
  .strict();
export type DeletionRequest = z.infer<typeof deletionRequestSchema>;

export const auditActions = [
  'family.created',
  'guardian.invited',
  'guardian.joined',
  'child.linked',
  'consent.granted',
  'consent.withdrawn',
  'measurement.enabled',
  'measurement.disabled',
  'agreement.activated',
  'agreement.change_proposed',
  'focus.session.completed',
  'export.requested',
  'export.delivered',
  'deletion.requested',
  'deletion.cancelled',
  'deletion.completed',
  'subscription.changed',
  'admin.metrics.viewed',
  'auth.signed_in',
  'auth.sign_in_failed',
] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditLogSchema = z
  .object({
    id: z.string(),
    familyId: z.string().nullable(),
    actorUserId: z.string().nullable(),
    action: z.enum(auditActions),
    subjectUserId: z.string().nullable().default(null),
    /** Never contains message content, browsing data or free-text notes. */
    metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
    at: z.coerce.date(),
  })
  .strict();
export type AuditLog = z.infer<typeof auditLogSchema>;

/**
 * The shape of an export bundle. Written as a type so the API and the tests
 * agree on what "all my data" means, and so a reviewer can see at a glance
 * that there is no message or browsing collection to export.
 */
export interface ExportBundle {
  readonly generatedAt: string;
  readonly scope: 'self' | 'family';
  readonly format: 'json';
  readonly subject: { readonly userId: string; readonly displayName: string };
  readonly family: { readonly id: string; readonly name: string } | null;
  readonly sections: {
    readonly memberships: readonly unknown[];
    readonly consentRecords: readonly unknown[];
    readonly measurementSources: readonly unknown[];
    readonly usageSummaries: readonly unknown[];
    readonly agreements: readonly unknown[];
    readonly focusSchedules: readonly unknown[];
    readonly focusSessions: readonly unknown[];
    readonly checkIns: readonly unknown[];
    readonly goals: readonly unknown[];
    readonly goalContributions: readonly unknown[];
    readonly achievements: readonly unknown[];
    readonly notificationPreferences: readonly unknown[];
    readonly subscriptions: readonly unknown[];
    readonly auditLog: readonly unknown[];
  };
  /** Stated explicitly in the file so the reader knows what was never held. */
  readonly notCollected: readonly string[];
}

export const NOT_COLLECTED: readonly string[] = Object.freeze([
  'message_content',
  'message_metadata',
  'browsing_history',
  'browsing_content',
  'keystrokes',
  'screenshots',
  'microphone_audio',
  'camera_images',
  'precise_location',
  'contacts',
  'photo_library',
  'per_app_usage_detail',
]);

export function scheduleDeletion(args: {
  id: string;
  familyId: string;
  requestedByUserId: string;
  subjectUserId: string | null;
  scope: DeletionScope;
  now: Date;
}): DeletionRequest {
  const executeAfter = new Date(args.now.getTime());
  executeAfter.setDate(executeAfter.getDate() + DELETION_GRACE_DAYS);
  return deletionRequestSchema.parse({
    id: args.id,
    familyId: args.familyId,
    requestedByUserId: args.requestedByUserId,
    subjectUserId: args.subjectUserId,
    scope: args.scope,
    status: 'scheduled',
    requestedAt: args.now,
    executeAfter,
    completedAt: null,
    cancelledAt: null,
  });
}

export function isDeletionDue(request: DeletionRequest, now: Date): boolean {
  return request.status === 'scheduled' && request.executeAfter.getTime() <= now.getTime();
}
