import { z } from 'zod';

/** Locales the companion can speak. `nl` is the launch market, `en` the fallback. */
export const LocaleSchema = z.enum(['nl', 'en']);
export type Locale = z.infer<typeof LocaleSchema>;

/** Narration speed. The child can always ask for "slower"; there is no faster. */
export const NarrationSpeedSchema = z.enum(['slow', 'normal']);
export type NarrationSpeed = z.infer<typeof NarrationSpeedSchema>;

/**
 * A device-local identifier. Devices are anonymous: this is a random id burned
 * into the companion at manufacture and is never derived from a child.
 */
export const DeviceIdSchema = z.string().min(8).max(128);

/** Opaque server-issued identifiers. */
export const IdSchema = z.string().min(1).max(64);

/**
 * A client-generated event id. Progress is reconciled by this id, so a
 * companion that replays its offline queue twice cannot double-count.
 */
export const ClientEventIdSchema = z.string().min(8).max(128);

/** ISO-8601 timestamp as produced by the device clock (which may be wrong). */
export const TimestampSchema = z.string().datetime({ offset: true });

/**
 * Activation codes are printed on the box as WB-XXXX-XXXX-XXXX using Crockford
 * base32 without I/L/O/U, so a child reading them aloud cannot produce an
 * ambiguous character.
 */
export const ACTIVATION_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ACTIVATION_CODE_PATTERN = /^WB-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;
export const ActivationCodeSchema = z
  .string()
  .transform((value) => value.trim().toUpperCase().replace(/\s+/g, ''))
  .refine((value) => ACTIVATION_CODE_PATTERN.test(value), {
    message: 'Activation code must look like WB-XXXX-XXXX-XXXX',
  });

/** Normalises user input ("wb 3f7k 22aa m9x1") into canonical form. */
export function normaliseActivationCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^0-9A-Z]/g, '');
  const body = cleaned.startsWith('WB') ? cleaned.slice(2) : cleaned;
  const groups = [body.slice(0, 4), body.slice(4, 8), body.slice(8, 12)].filter(Boolean);
  return ['WB', ...groups].join('-');
}
