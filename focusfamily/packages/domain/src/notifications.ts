import { z } from 'zod';
import { isClockTime, isWithinWindow, minuteOfDay, parseClockTime } from './time.js';

/**
 * FocusFamily sends few notifications and never sends a shaming one. Every
 * category can be switched off individually, and quiet hours win over
 * everything except a genuine account-security message.
 */
export const notificationCategories = [
  'focus_reminder',
  'checkin_invite',
  'weekly_review_ready',
  'agreement_change_proposed',
  'celebration',
  'account_security',
] as const;
export type NotificationCategory = (typeof notificationCategories)[number];

/** The only category quiet hours cannot suppress. */
export const ALWAYS_DELIVERABLE: readonly NotificationCategory[] = Object.freeze([
  'account_security',
]);

export const notificationPreferenceSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    familyId: z.string(),
    /** Off means off; there is no "important update" override. */
    enabledCategories: z.array(z.enum(notificationCategories)).default([
      'focus_reminder',
      'weekly_review_ready',
      'agreement_change_proposed',
      'celebration',
      'account_security',
    ]),
    quietHoursStart: z.string().refine(isClockTime, 'time_format').default('21:00'),
    quietHoursEnd: z.string().refine(isClockTime, 'time_format').default('07:30'),
    quietHoursEnabled: z.boolean().default(true),
    /** Children get quiet hours switched on by default and cannot be opted out by anyone else. */
    channel: z.enum(['push', 'email', 'none']).default('push'),
    updatedAt: z.coerce.date(),
  })
  .strict();
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>;

export interface DeliveryDecision {
  readonly deliver: boolean;
  readonly reasonKey: string;
  /** When suppressed by quiet hours we hold it until this local time. */
  readonly deferUntil: string | null;
}

export function shouldDeliver(args: {
  preference: NotificationPreference;
  category: NotificationCategory;
  now: Date;
}): DeliveryDecision {
  const { preference, category, now } = args;

  if (preference.channel === 'none') {
    return { deliver: false, reasonKey: 'notification.channel_off', deferUntil: null };
  }
  if (!preference.enabledCategories.includes(category)) {
    return { deliver: false, reasonKey: 'notification.category_off', deferUntil: null };
  }
  if (ALWAYS_DELIVERABLE.includes(category)) {
    return { deliver: true, reasonKey: 'notification.security', deferUntil: null };
  }
  if (preference.quietHoursEnabled) {
    const start = parseClockTime(preference.quietHoursStart);
    const end = parseClockTime(preference.quietHoursEnd);
    if (isWithinWindow(minuteOfDay(now), start, end)) {
      return {
        deliver: false,
        reasonKey: 'notification.quiet_hours',
        deferUntil: preference.quietHoursEnd,
      };
    }
  }
  return { deliver: true, reasonKey: 'notification.ok', deferUntil: null };
}

export function defaultPreference(args: {
  id: string;
  userId: string;
  familyId: string;
  isChild: boolean;
  now: Date;
}): NotificationPreference {
  return notificationPreferenceSchema.parse({
    id: args.id,
    userId: args.userId,
    familyId: args.familyId,
    enabledCategories: args.isChild
      ? ['focus_reminder', 'celebration', 'account_security']
      : [
          'focus_reminder',
          'checkin_invite',
          'weekly_review_ready',
          'agreement_change_proposed',
          'celebration',
          'account_security',
        ],
    quietHoursStart: args.isChild ? '20:30' : '21:00',
    quietHoursEnd: args.isChild ? '07:30' : '07:00',
    quietHoursEnabled: true,
    channel: 'push',
    updatedAt: args.now,
  });
}
