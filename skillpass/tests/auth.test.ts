import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { authenticate, deleteAccount, exportAccountData, registerGuardian, verifyEmail } from '@/modules/auth/service';
import { registerSchema } from '@/modules/auth/schemas';
import { MockEmailProvider } from '@/lib/adapters/email';
import { createChild, createGuardianWithFamily, grantCredits } from './helpers';

const validInput = {
  email: 'Nieuwe.Ouder@Example.com',
  password: 'zonnebloem-fiets-42',
  displayName: 'Nieuwe Ouder',
  familyName: 'Familie Ouder',
  locale: 'nl' as const,
  acceptedTerms: true as const,
  parentalConsent: true as const,
};

describe('guardian registration', () => {
  it('creates a user, a family, an owner membership and consent records', async () => {
    const result = await registerGuardian(validInput);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: result.userId } });
    expect(user.role).toBe('GUARDIAN');
    expect(user.status).toBe('PENDING_VERIFICATION');
    // Original casing preserved, normalised copy lower-cased.
    expect(user.email).toBe('Nieuwe.Ouder@Example.com');
    expect(user.emailNormalised).toBe('nieuwe.ouder@example.com');
    expect(user.passwordHash).not.toContain(validInput.password);

    const membership = await prisma.familyMembership.findFirstOrThrow({ where: { userId: user.id } });
    expect(membership.role).toBe('OWNER');
    expect(membership.familyId).toBe(result.familyId);

    const consents = await prisma.consent.findMany({ where: { userId: user.id } });
    expect(consents.map((c) => c.type).sort()).toEqual(['CHILD_DATA_PROCESSING', 'PRIVACY_POLICY', 'TERMS_OF_SERVICE']);
  });

  it('sends a verification email and activates the account once the link is used', async () => {
    const result = await registerGuardian(validInput);
    expect(MockEmailProvider.outbox()[0]?.to).toBe('Nieuwe.Ouder@Example.com');

    await verifyEmail(result.verificationToken);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: result.userId } });
    expect(user.status).toBe('ACTIVE');
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  it('refuses a duplicate email regardless of casing', async () => {
    await registerGuardian(validInput);
    await expect(registerGuardian({ ...validInput, email: 'nieuwe.ouder@example.com' })).rejects.toMatchObject({
      code: 'email_taken',
    });
  });

  it('rejects a verification token that has already been used', async () => {
    const result = await registerGuardian(validInput);
    await verifyEmail(result.verificationToken);
    await expect(verifyEmail(result.verificationToken)).rejects.toThrow(/already been used/);
  });

  it('requires a password of at least 12 characters and explicit consent', () => {
    expect(registerSchema.safeParse({ ...validInput, password: 'kort123' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validInput, acceptedTerms: false }).success).toBe(false);
  });

  it('authenticates with the right password and refuses the wrong one', async () => {
    const result = await registerGuardian(validInput);
    await verifyEmail(result.verificationToken);

    await expect(authenticate(validInput.email, validInput.password)).resolves.toMatchObject({ userId: result.userId });
    await expect(authenticate(validInput.email, 'wrong-password-here')).rejects.toThrow(/incorrect/);
  });

  it('gives the same error for an unknown account as for a wrong password', async () => {
    await expect(authenticate('nobody@example.com', 'whatever-password')).rejects.toThrow(/incorrect/);
  });
});

describe('data export and erasure', () => {
  it('exports the account, its children and its financial records', async () => {
    const { user, family, viewer } = await createGuardianWithFamily('export@test.local');
    await createChild(family.id, { nickname: 'Nour' });
    await grantCredits(family.id, 10);

    const data = await exportAccountData(user.id);
    expect(data.account.email).toBe('export@test.local');
    expect(data.children).toHaveLength(1);
    expect(data.creditLedger).toHaveLength(1);
    expect(viewer.id).toBe(user.id);
  });

  it('erases child data and pseudonymises the account while keeping the ledger', async () => {
    const { user, family } = await createGuardianWithFamily('erase@test.local');
    await createChild(family.id, { nickname: 'Sami' });
    await grantCredits(family.id, 6);

    await deleteAccount(user.id);

    expect(await prisma.childProfile.count({ where: { familyId: family.id } })).toBe(0);
    expect(await prisma.authSession.count({ where: { userId: user.id } })).toBe(0);

    const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(after.status).toBe('DELETED');
    expect(after.email).not.toBe('erase@test.local');
    expect(after.anonymisedAt).not.toBeNull();

    // Financial history survives erasure — it is required for bookkeeping.
    expect(await prisma.creditLedgerEntry.count({ where: { familyId: family.id } })).toBe(1);

    // A deleted account can no longer sign in.
    await expect(authenticate('erase@test.local', 'CorrectHorseBattery1')).rejects.toThrow();
  });
});
