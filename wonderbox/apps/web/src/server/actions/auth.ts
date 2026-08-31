'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { prisma } from '../../lib/db.ts';
import { hashPassword, verifyPassword } from '../../lib/crypto.ts';
import { clientIp, createSession, destroySession } from '../../lib/auth/session.ts';
import { audit } from '../../lib/audit.ts';
import { POLICY_VERSION } from '../privacy.ts';

/**
 * Sign-up and sign-in.
 *
 * Both are plain form posts that work without JavaScript. Failures round-trip
 * through a query parameter rather than a client-side store, which keeps the
 * pages server-rendered and the back button honest.
 */

const SignUpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10, 'Use at least 10 characters'),
  displayName: z.string().trim().min(2).max(80),
  familyName: z.string().trim().min(2).max(80),
  consent: z.literal('on', { errorMap: () => ({ message: 'Consent is required' }) }),
});

export async function signUpAction(formData: FormData): Promise<void> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
    familyName: formData.get('familyName'),
    consent: formData.get('consent'),
  });
  if (!parsed.success) {
    redirect(`/signup?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? 'invalid')}`);
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) redirect('/signup?error=exists');

  const headerBag = await headers();
  const created = await prisma.$transaction(async (tx) => {
    const family = await tx.family.create({ data: { name: parsed.data.familyName } });
    const user = await tx.user.create({
      data: {
        email: parsed.data.email,
        displayName: parsed.data.displayName,
        passwordHash: await hashPassword(parsed.data.password),
        roles: ['PARENT'],
        familyId: family.id,
      },
    });
    for (const type of ['TERMS', 'PRIVACY'] as const) {
      await tx.consentRecord.create({
        data: {
          familyId: family.id,
          type,
          granted: true,
          policyVersion: POLICY_VERSION,
          grantedByUserId: user.id,
          evidence: { userAgent: headerBag.get('user-agent')?.slice(0, 255) ?? null },
        },
      });
    }
    await audit(
      { actorUserId: user.id, action: 'account.created', entityType: 'Family', entityId: family.id },
      tx,
    );
    return user;
  });

  await createSession(created.id);
  redirect('/account');
}

const SignInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function signInAction(formData: FormData): Promise<void> {
  const parsed = SignInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  const next = String(formData.get('next') ?? '') || null;
  if (!parsed.success) redirect('/login?error=invalid');

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Hash a throwaway password when the account is unknown, so a missing
  // account and a wrong password take the same amount of time.
  if (!user || user.deletedAt) {
    await verifyPassword(parsed.data.password, await hashPassword('timing-equaliser'));
    redirect('/login?error=invalid');
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    await audit({
      actorUserId: user.id,
      action: 'auth.failed',
      entityType: 'User',
      entityId: user.id,
      ipHash: clientIp(await headers()) ? 'present' : null,
    });
    redirect('/login?error=invalid');
  }

  await createSession(user.id);
  if (next && next.startsWith('/')) redirect(next);
  if (user.roles.includes('CONTENT_EDITOR') || user.roles.includes('CONTENT_APPROVER')) {
    redirect('/studio');
  }
  if (user.roles.includes('OPS') || user.roles.includes('SUPPORT')) redirect('/ops');
  redirect('/account');
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect('/');
}
