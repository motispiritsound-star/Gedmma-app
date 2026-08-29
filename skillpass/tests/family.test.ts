import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { childProfileSchema, createChildProfile, listChildren } from '@/modules/family/service';
import { requireChildInFamily } from '@/lib/auth/rbac';
import { createGuardianWithFamily } from './helpers';

describe('child profiles', () => {
  it('creates a profile with an age band, interests and no date of birth', async () => {
    const { user, family } = await createGuardianWithFamily();
    await prisma.interest.create({ data: { slug: 'drawing', labelNl: 'Tekenen', labelEn: 'Drawing', category: 'ART' } });

    const child = await createChildProfile(family.id, user.id, {
      nickname: 'Nour',
      ageBand: 'AGE_9_11',
      pronouns: 'zij/haar',
      accessibilityNeeds: 'Prikkelarme ruimte',
      medicalNotes: '',
      preferredLanguages: ['NL', 'EN'],
      interestSlugs: ['drawing'],
    });

    expect(child.nickname).toBe('Nour');
    expect(child.ageBand).toBe('AGE_9_11');
    expect(child.interests).toHaveLength(1);
    // The schema has no birth-date column at all.
    expect(Object.keys(child)).not.toContain('dateOfBirth');

    const children = await listChildren(family.id);
    expect(children).toHaveLength(1);
  });

  it('does not write the nickname or notes into the audit log', async () => {
    const { user, family } = await createGuardianWithFamily();
    await createChildProfile(family.id, user.id, {
      nickname: 'Sami',
      ageBand: 'AGE_12_14',
      preferredLanguages: ['NL'],
      interestSlugs: [],
    });

    const entry = await prisma.auditLog.findFirstOrThrow({ where: { action: 'family.child_created' } });
    expect(JSON.stringify(entry.metadata)).not.toContain('Sami');
    expect(entry.metadata).toMatchObject({ ageBand: 'AGE_12_14' });
  });

  it('rejects something that looks like a full name', () => {
    expect(childProfileSchema.safeParse({ nickname: 'Nour El Amrani Haddad', ageBand: 'AGE_9_11' }).success).toBe(false);
    expect(childProfileSchema.safeParse({ nickname: 'Nour', ageBand: 'AGE_9_11' }).success).toBe(true);
  });

  it('refuses to resolve a child profile that belongs to another family', async () => {
    const a = await createGuardianWithFamily('a@test.local');
    const b = await createGuardianWithFamily('b@test.local');
    const child = await createChildProfile(b.family.id, b.user.id, {
      nickname: 'Otherkid',
      ageBand: 'AGE_6_8',
      preferredLanguages: ['NL'],
      interestSlugs: [],
    });

    await expect(requireChildInFamily(a.family.id, child.id)).rejects.toMatchObject({ code: 'forbidden' });
  });
});
