'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, clearSessionCookie, createSession, revokeSession, setSessionCookie, requestMeta } from '@/lib/auth/session';
import { authenticate, registerGuardian, verifyEmail } from '@/modules/auth/service';
import { loginSchema, registerSchema } from '@/modules/auth/schemas';
import { consumeRateLimit } from '@/lib/rate-limit';
import { AppError } from '@/lib/errors';

export interface FormState {
  error?: string;
  notice?: string;
  /** Development convenience: the verification link, when email is mocked. */
  devLink?: string;
}

function messageFor(error: unknown): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.name === 'ZodError') return 'Please check the highlighted fields';
  return 'Something went wrong. Please try again.';
}

export async function registerAction(_state: FormState, formData: FormData): Promise<FormState> {
  const locale = String(formData.get('locale') ?? 'nl') as 'nl' | 'en';
  const meta = await requestMeta();

  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
    familyName: formData.get('familyName'),
    locale,
    acceptedTerms: formData.get('acceptedTerms') === 'on',
    parentalConsent: formData.get('acceptedTerms') === 'on',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form' };
  }

  try {
    consumeRateLimit('register', meta.ip ?? 'unknown');
    const result = await registerGuardian(parsed.data, meta);
    const session = await createSession(result.userId, meta);
    await setSessionCookie(session.token, session.expiresAt);
    return {
      notice: 'verify',
      devLink: `/${locale}/auth/verify?token=${result.verificationToken}`,
    };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function loginAction(_state: FormState, formData: FormData): Promise<FormState> {
  const locale = String(formData.get('locale') ?? 'nl');
  const meta = await requestMeta();

  const parsed = loginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { error: 'Enter your email address and password' };

  try {
    consumeRateLimit('login', `${meta.ip ?? 'unknown'}:${parsed.data.email}`);
    const { userId } = await authenticate(parsed.data.email, parsed.data.password, meta);
    const session = await createSession(userId, meta);
    await setSessionCookie(session.token, session.expiresAt);
  } catch (error) {
    return { error: messageFor(error) };
  }
  redirect(`/${locale}/search`);
}

export async function logoutAction(formData: FormData): Promise<void> {
  const locale = String(formData.get('locale') ?? 'nl');
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await revokeSession(token);
  await clearSessionCookie();
  redirect(`/${locale}`);
}

export async function verifyEmailAction(token: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await verifyEmail(token);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageFor(error) };
  }
}
