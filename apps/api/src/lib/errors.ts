import { DEFAULT_LOCALE, type Locale } from '@khidma/shared';

/**
 * Error codes are stable identifiers; the API returns both the code and a
 * message already translated into the caller's language, so the app can show
 * something useful even for a code it does not know yet.
 */
export type ErrorCode =
  | 'validation_failed'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'otp_invalid'
  | 'otp_expired'
  | 'otp_too_many_attempts'
  | 'account_blocked'
  | 'pro_profile_required'
  | 'pro_profile_exists'
  | 'subscription_required'
  | 'no_credits_remaining'
  | 'plan_limit_categories'
  | 'plan_limit_cities'
  | 'job_not_open'
  | 'job_quote_limit_reached'
  | 'job_already_quoted'
  | 'lead_not_released'
  | 'quote_not_pending'
  | 'quote_expired'
  | 'review_already_exists'
  | 'review_requires_completed_job'
  | 'conflict'
  | 'internal_error';

const MESSAGES: Record<ErrorCode, Record<Locale, string>> = {
  validation_failed: {
    fr: 'Certaines informations sont invalides.',
    ar: 'بعض المعلومات غير صحيحة.',
    en: 'Some of the information provided is invalid.',
  },
  unauthorized: {
    fr: 'Veuillez vous connecter pour continuer.',
    ar: 'يرجى تسجيل الدخول للمتابعة.',
    en: 'Please sign in to continue.',
  },
  forbidden: {
    fr: "Vous n'avez pas accès à cette ressource.",
    ar: 'ليس لديك صلاحية الوصول إلى هذا المحتوى.',
    en: 'You do not have access to this resource.',
  },
  not_found: {
    fr: 'Introuvable.',
    ar: 'غير موجود.',
    en: 'Not found.',
  },
  rate_limited: {
    fr: 'Trop de tentatives. Réessayez dans quelques minutes.',
    ar: 'محاولات كثيرة. أعد المحاولة بعد بضع دقائق.',
    en: 'Too many attempts. Try again in a few minutes.',
  },
  otp_invalid: {
    fr: 'Code incorrect.',
    ar: 'الرمز غير صحيح.',
    en: 'Incorrect code.',
  },
  otp_expired: {
    fr: 'Ce code a expiré. Demandez-en un nouveau.',
    ar: 'انتهت صلاحية الرمز. اطلب رمزًا جديدًا.',
    en: 'That code has expired. Request a new one.',
  },
  otp_too_many_attempts: {
    fr: 'Trop de tentatives. Demandez un nouveau code.',
    ar: 'محاولات كثيرة. اطلب رمزًا جديدًا.',
    en: 'Too many attempts. Request a new code.',
  },
  account_blocked: {
    fr: 'Ce compte a été suspendu. Contactez le support.',
    ar: 'تم تعليق هذا الحساب. تواصل مع الدعم.',
    en: 'This account has been suspended. Please contact support.',
  },
  pro_profile_required: {
    fr: "Complétez votre profil professionnel pour continuer.",
    ar: 'أكمل ملفك المهني للمتابعة.',
    en: 'Complete your professional profile to continue.',
  },
  pro_profile_exists: {
    fr: 'Un profil professionnel existe déjà pour ce compte.',
    ar: 'يوجد ملف مهني بالفعل لهذا الحساب.',
    en: 'A professional profile already exists for this account.',
  },
  subscription_required: {
    fr: 'Un abonnement actif est nécessaire pour envoyer un devis.',
    ar: 'يلزم اشتراك نشط لإرسال عرض السعر.',
    en: 'An active subscription is required to send a quote.',
  },
  no_credits_remaining: {
    fr: "Vous avez utilisé tous vos devis du mois. Changez de formule pour en obtenir plus.",
    ar: 'لقد استنفدت عروض هذا الشهر. غيّر باقتك للحصول على المزيد.',
    en: 'You have used all of this month’s quotes. Upgrade your plan for more.',
  },
  plan_limit_categories: {
    fr: 'Votre formule ne permet pas autant de métiers.',
    ar: 'باقتك لا تسمح بهذا العدد من المهن.',
    en: 'Your plan does not allow that many trades.',
  },
  plan_limit_cities: {
    fr: 'Votre formule ne permet pas autant de villes.',
    ar: 'باقتك لا تسمح بهذا العدد من المدن.',
    en: 'Your plan does not allow that many cities.',
  },
  job_not_open: {
    fr: "Cette demande n'accepte plus de devis.",
    ar: 'هذا الطلب لم يعد يقبل عروض الأسعار.',
    en: 'This job is no longer accepting quotes.',
  },
  job_quote_limit_reached: {
    fr: 'Cette demande a déjà reçu le nombre maximum de devis.',
    ar: 'تلقى هذا الطلب الحد الأقصى من العروض.',
    en: 'This job has already received the maximum number of quotes.',
  },
  job_already_quoted: {
    fr: 'Vous avez déjà envoyé un devis pour cette demande.',
    ar: 'لقد أرسلت بالفعل عرض سعر لهذا الطلب.',
    en: 'You have already sent a quote for this job.',
  },
  lead_not_released: {
    fr: "Cette demande n'est pas encore ouverte à votre formule.",
    ar: 'هذا الطلب لم يُفتح بعد لباقتك.',
    en: 'This job has not been released to your plan yet.',
  },
  quote_not_pending: {
    fr: "Ce devis n'est plus en attente.",
    ar: 'عرض السعر هذا لم يعد في الانتظار.',
    en: 'That quote is no longer pending.',
  },
  quote_expired: {
    fr: 'Ce devis a expiré.',
    ar: 'انتهت صلاحية عرض السعر.',
    en: 'That quote has expired.',
  },
  review_already_exists: {
    fr: 'Vous avez déjà laissé un avis pour cette demande.',
    ar: 'لقد تركت تقييمًا لهذا الطلب من قبل.',
    en: 'You have already reviewed this job.',
  },
  review_requires_completed_job: {
    fr: 'Vous pourrez laisser un avis une fois les travaux terminés.',
    ar: 'يمكنك ترك تقييم بعد انتهاء الأشغال.',
    en: 'You can leave a review once the work is complete.',
  },
  conflict: {
    fr: 'Cette action entre en conflit avec l’état actuel.',
    ar: 'هذا الإجراء يتعارض مع الحالة الحالية.',
    en: 'That action conflicts with the current state.',
  },
  internal_error: {
    fr: 'Une erreur est survenue. Réessayez plus tard.',
    ar: 'حدث خطأ ما. حاول مرة أخرى لاحقًا.',
    en: 'Something went wrong. Please try again later.',
  },
};

const DEFAULT_STATUS: Record<ErrorCode, number> = {
  validation_failed: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  rate_limited: 429,
  otp_invalid: 400,
  otp_expired: 410,
  otp_too_many_attempts: 429,
  account_blocked: 403,
  pro_profile_required: 403,
  pro_profile_exists: 409,
  subscription_required: 402,
  no_credits_remaining: 402,
  plan_limit_categories: 403,
  plan_limit_cities: 403,
  job_not_open: 409,
  job_quote_limit_reached: 409,
  job_already_quoted: 409,
  lead_not_released: 403,
  quote_not_pending: 409,
  quote_expired: 410,
  review_already_exists: 409,
  review_requires_completed_job: 409,
  conflict: 409,
  internal_error: 500,
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(readonly code: ErrorCode, options: { status?: number; details?: unknown } = {}) {
    super(code);
    this.name = 'AppError';
    this.statusCode = options.status ?? DEFAULT_STATUS[code];
    this.details = options.details;
  }

  localizedMessage(locale: Locale = DEFAULT_LOCALE): string {
    return MESSAGES[this.code][locale] ?? MESSAGES[this.code][DEFAULT_LOCALE];
  }
}

export function errorMessage(code: ErrorCode, locale: Locale = DEFAULT_LOCALE): string {
  return MESSAGES[code][locale] ?? MESSAGES[code][DEFAULT_LOCALE];
}
