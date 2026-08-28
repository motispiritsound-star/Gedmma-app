import { z } from 'zod';
import { isValidKvk } from '../identifiers.js';
import { isDutchMobile, normalizeDutchPhone } from '../phone.js';
import { localeSchema } from './common.js';

/**
 * Registering interest from the website, before the app is on the stores.
 *
 * This is not an account. There is no password, no phone verification and no
 * profile — just enough to tell someone their side of the marketplace is ready
 * and to know, before launch, whether there are enough painters in Zwolle for
 * the first customer in Zwolle to get a quote. That last question is the whole
 * reason a marketplace opens a waiting list rather than a front door.
 */
export const SIGNUP_ROLES = ['CUSTOMER', 'PRO'] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

const emailSchema = z.string().trim().toLowerCase().email('email_invalid').max(160);

/** Optional on the form; normalised to E.164 when it is given. */
const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || isDutchMobile(value), { message: 'phone_invalid_mobile' })
  .transform((value) => (value === '' ? undefined : normalizeDutchPhone(value)))
  .optional();

const optionalKvkSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || isValidKvk(value), { message: 'kvk_invalid' })
  .transform((value) => (value === '' ? undefined : value.replace(/\D/g, '')))
  .optional();

export const signupSchema = z
  .object({
    role: z.enum(SIGNUP_ROLES),
    email: emailSchema,
    phone: optionalPhoneSchema,
    /** A person's name, or a business name for a professional. */
    name: z.string().trim().min(2).max(120).optional().or(z.literal('')),
    /** Where they are, as a city slug from the catalog. */
    citySlug: z.string().trim().max(64).optional().or(z.literal('')),
    /** What a professional does, as category slugs. Ignored for a customer. */
    categorySlugs: z.array(z.string().max(64)).max(5).optional(),
    kvk: optionalKvkSchema,
    locale: localeSchema.optional(),
    /**
     * Explicit and unticked by default. An email address collected to be
     * emailed later is consent under Article 6(1)(a) and under the
     * Telecommunicatiewet, and neither is satisfied by a pre-ticked box or by
     * "by submitting this form you agree".
     */
    consent: z.literal(true),
    /**
     * Left empty by a person and filled in by a bot. Never shown, never
     * stored — a request carrying it is dropped.
     */
    website: z.string().max(200).optional(),
  })
  .refine((value) => value.role !== 'PRO' || Boolean(value.kvk), {
    message: 'kvk_required_for_pro',
    path: ['kvk'],
  });

export type SignupInput = z.infer<typeof signupSchema>;
