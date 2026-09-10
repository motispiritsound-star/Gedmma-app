import { z } from 'zod';
import { localeSchema } from './common.js';

/**
 * A message from the contact form.
 *
 * Deliberately three fields. A contact form is the easiest place on a site to
 * over-collect — a phone number "in case", an address "for our records" — and
 * every field added here is a field that has to be justified in the privacy
 * statement, kept safe, and deleted on time. Somebody who wants to be phoned
 * back can say so in the message.
 */
export const CONTACT_MESSAGE_MAX = 4000;

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'name_too_short').max(120),
  email: z.string().trim().toLowerCase().email('email_invalid').max(160),
  message: z.string().trim().min(10, 'message_too_short').max(CONTACT_MESSAGE_MAX),
  locale: localeSchema.optional(),
  /** Left empty by a person and filled in by a bot. Never stored. */
  website: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
