import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { createReview, assertReviewContentSafe, moderateReview } from '@/modules/reviews/service';
import { reportIncident, sendProviderMessage, getSafeguardingCase, updateSafeguardingCase } from '@/modules/safeguarding/service';
import { bookSession, recordAttendance } from '@/modules/booking/service';
import { platformStats, auditTrail, refundQueue } from '@/modules/admin/service';
import { signMediaUrl, verifyMediaSignature, assertUploadAllowed, MAX_UPLOAD_BYTES } from '@/lib/adapters/storage';
import { consumeRateLimit } from '@/lib/rate-limit';
import {
  createActivity,
  createChild,
  createCity,
  createGuardianWithFamily,
  createProvider,
  createSession,
  createUser,
  grantCredits,
  sessionUser,
} from './helpers';

async function attendedBooking(nickname = 'Nour') {
  const city = await createCity();
  const provider = await createProvider({ slug: 'club', cityId: city.id });
  const activity = await createActivity({ provider, creditCost: 2 });
  const session = await createSession({ activityId: activity.id, totalSeats: 5, startsInHours: 24 });
  const guardian = await createGuardianWithFamily();
  const child = await createChild(guardian.family.id, { nickname });
  await grantCredits(guardian.family.id, 10);
  const booking = await bookSession(guardian.viewer, guardian.family.id, {
    sessionId: session.id,
    childProfileId: child.id,
  });
  return { provider, activity, session, guardian, child, booking };
}

describe('guardian-only reviews', () => {
  it('allows a review only after the provider has recorded attendance', async () => {
    const context = await attendedBooking();

    await expect(
      createReview(context.guardian.viewer, context.guardian.family.id, {
        bookingId: context.booking.bookingId,
        rating: 5,
        body: 'Wij waren erg tevreden over de begeleiding en de sfeer in de groep.',
      }),
    ).rejects.toThrow(/attendance/i);

    await recordAttendance(context.provider.owner, context.provider.providerId, {
      bookingId: context.booking.bookingId,
      status: 'ATTENDED',
    });

    const review = await createReview(context.guardian.viewer, context.guardian.family.id, {
      bookingId: context.booking.bookingId,
      rating: 5,
      body: 'Wij waren erg tevreden over de begeleiding en de sfeer in de groep.',
    });
    expect(review.status).toBe('PUBLISHED');
    expect(review.authorId).toBe(context.guardian.user.id);
  });

  it('refuses a review written by another family', async () => {
    const context = await attendedBooking();
    await recordAttendance(context.provider.owner, context.provider.providerId, {
      bookingId: context.booking.bookingId,
      status: 'ATTENDED',
    });

    const stranger = await createGuardianWithFamily('stranger@test.local');
    await expect(
      createReview(stranger.viewer, stranger.family.id, {
        bookingId: context.booking.bookingId,
        rating: 1,
        body: 'Ik was hier helemaal niet bij aanwezig maar schrijf toch een beoordeling.',
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('refuses a review written by provider staff', async () => {
    const context = await attendedBooking();
    await recordAttendance(context.provider.owner, context.provider.providerId, {
      bookingId: context.booking.bookingId,
      status: 'ATTENDED',
    });

    await expect(
      createReview(context.provider.owner, context.guardian.family.id, {
        bookingId: context.booking.bookingId,
        rating: 5,
        body: 'Wij vinden onze eigen les natuurlijk uitstekend en geven vijf sterren.',
      }),
    ).rejects.toThrow(/Only guardians/);
  });

  it('allows only one review per booking', async () => {
    const context = await attendedBooking();
    await recordAttendance(context.provider.owner, context.provider.providerId, {
      bookingId: context.booking.bookingId,
      status: 'ATTENDED',
    });
    const input = {
      bookingId: context.booking.bookingId,
      rating: 4,
      body: 'Prima les, goede uitleg en genoeg aandacht voor elk kind in de groep.',
    };
    await createReview(context.guardian.viewer, context.guardian.family.id, input);
    await expect(createReview(context.guardian.viewer, context.guardian.family.id, input)).rejects.toMatchObject({
      code: 'already_reviewed',
    });
  });

  it('blocks a child’s name and any image from public review text', async () => {
    const context = await attendedBooking('Sami');
    await recordAttendance(context.provider.owner, context.provider.providerId, {
      bookingId: context.booking.bookingId,
      status: 'ATTENDED',
    });

    await expect(
      createReview(context.guardian.viewer, context.guardian.family.id, {
        bookingId: context.booking.bookingId,
        rating: 5,
        body: 'Sami vond het geweldig en wil volgende week meteen weer terugkomen naar deze les.',
      }),
    ).rejects.toThrow(/child’s name/);

    await expect(
      createReview(context.guardian.viewer, context.guardian.family.id, {
        bookingId: context.booking.bookingId,
        rating: 5,
        body: 'Erg leuke les, kijk maar: https://example.com/kind.jpg voor een sfeerimpressie van de groep.',
      }),
    ).rejects.toThrow(/Images are not allowed/);

    // The Review model has no field to attach media to in the first place.
    const columns = Object.keys(prisma.review.fields);
    expect(columns).not.toContain('mediaAssetId');
  });

  it('lets an administrator hide a published review with a recorded reason', async () => {
    const context = await attendedBooking();
    await recordAttendance(context.provider.owner, context.provider.providerId, {
      bookingId: context.booking.bookingId,
      status: 'ATTENDED',
    });
    const review = await createReview(context.guardian.viewer, context.guardian.family.id, {
      bookingId: context.booking.bookingId,
      rating: 3,
      body: 'Een prima les maar de zaal was koud en de uitleg mocht wat rustiger.',
    });

    const admin = sessionUser(await createUser({ email: 'admin@test.local', role: 'ADMIN' }));
    const hidden = await moderateReview(admin, review.id, 'HIDDEN', 'reported by provider');
    expect(hidden.status).toBe('HIDDEN');
    expect(await prisma.auditLog.count({ where: { action: 'admin.review_moderated' } })).toBe(1);
  });

  it('accepts a review that talks about the activity rather than the child', () => {
    expect(() =>
      assertReviewContentSafe('De begeleiders legden alles rustig uit en de groep was klein.', undefined, 'Nour'),
    ).not.toThrow();
  });
});

describe('no direct adult-to-child contact', () => {
  it('blocks any attempt to address a child profile and records it', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const guardian = await createGuardianWithFamily();
    const child = await createChild(guardian.family.id, { nickname: 'Nour' });

    await expect(
      sendProviderMessage(provider.owner, provider.providerId, {
        recipientUserId: child.id,
        templateKey: 'session_reminder',
        variables: { activity: 'Turnen', when: 'morgen', venue: 'Sporthal' },
      }),
    ).rejects.toMatchObject({ code: 'child_contact_blocked' });

    const entry = await prisma.auditLog.findFirstOrThrow({ where: { action: 'safeguarding.child_contact_blocked' } });
    expect(entry.entityType).toBe('ChildProfile');
    expect(entry.entityId).toBe(child.id);
    expect(await prisma.providerMessage.count()).toBe(0);
  });

  it('delivers a templated message to the guardian who booked, and nobody else', async () => {
    const context = await attendedBooking();

    const message = await sendProviderMessage(context.provider.owner, context.provider.providerId, {
      recipientUserId: context.guardian.user.id,
      templateKey: 'bring_equipment',
      variables: { activity: 'Turnen', items: 'gymschoenen' },
    });
    expect(message.recipientId).toBe(context.guardian.user.id);

    const notification = await prisma.notification.findFirstOrThrow({
      where: { userId: context.guardian.user.id, category: 'PROVIDER_ANNOUNCEMENT', channel: 'IN_APP' },
    });
    expect(notification.bodyNl).toContain('gymschoenen');
    expect(notification.bodyEn).toContain('gymschoenen');

    // A guardian with no booking at this provider cannot be messaged.
    const stranger = await createGuardianWithFamily('stranger@test.local');
    await expect(
      sendProviderMessage(context.provider.owner, context.provider.providerId, {
        recipientUserId: stranger.user.id,
        templateKey: 'bring_equipment',
        variables: { activity: 'Turnen', items: 'gymschoenen' },
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('has no messaging path that accepts free-form text', async () => {
    const context = await attendedBooking();
    await expect(
      sendProviderMessage(context.provider.owner, context.provider.providerId, {
        recipientUserId: context.guardian.user.id,
        // @ts-expect-error deliberately passing a key outside the template set
        templateKey: 'anything_i_want_to_say',
        variables: {},
      }),
    ).rejects.toThrow(/Unknown message template/);
  });
});

describe('incidents and safeguarding', () => {
  it('auto-opens a restricted case for a safeguarding report and alerts the officer', async () => {
    const officer = await createUser({ email: 'officer@test.local', role: 'SAFEGUARDING_OFFICER' });
    const guardian = await createGuardianWithFamily();

    const incident = await reportIncident(guardian.viewer, {
      category: 'SAFEGUARDING',
      severity: 'HIGH',
      summary: 'Zorgen over toezicht',
      details: 'Er was tijdens het omkleden geen tweede volwassene aanwezig in de kleedkamer.',
      occurredAt: new Date().toISOString(),
    });

    expect(incident.status).toBe('ESCALATED');
    const safeguardingCase = await prisma.safeguardingCase.findUniqueOrThrow({ where: { incidentId: incident.id } });
    expect(safeguardingCase.status).toBe('OPEN');

    const alert = await prisma.notification.findFirst({ where: { userId: officer.id, category: 'SAFEGUARDING' } });
    expect(alert).not.toBeNull();
  });

  it('keeps case notes readable only by the safeguarding officer', async () => {
    const officerUser = await createUser({ email: 'officer@test.local', role: 'SAFEGUARDING_OFFICER' });
    const officer = sessionUser(officerUser);
    const admin = sessionUser(await createUser({ email: 'admin@test.local', role: 'ADMIN' }));
    const guardian = await createGuardianWithFamily();

    const incident = await reportIncident(guardian.viewer, {
      category: 'SAFEGUARDING',
      severity: 'CRITICAL',
      summary: 'Ernstige melding',
      details: 'Een gedetailleerde melding die alleen de safeguarding officer mag inzien in dit systeem.',
      occurredAt: new Date().toISOString(),
    });
    const safeguardingCase = await prisma.safeguardingCase.findUniqueOrThrow({ where: { incidentId: incident.id } });

    await expect(getSafeguardingCase(admin, safeguardingCase.id)).rejects.toMatchObject({ code: 'forbidden' });
    await expect(getSafeguardingCase(guardian.viewer, safeguardingCase.id)).rejects.toMatchObject({ code: 'forbidden' });

    const readable = await getSafeguardingCase(officer, safeguardingCase.id);
    expect(readable.incident.summary).toBe('Ernstige melding');

    await updateSafeguardingCase(officer, safeguardingCase.id, { status: 'REFERRED_TO_AUTHORITY', caseNotes: 'Gemeld' });
    const updated = await prisma.safeguardingCase.findUniqueOrThrow({ where: { id: safeguardingCase.id } });
    expect(updated.status).toBe('REFERRED_TO_AUTHORITY');
    expect(updated.officerId).toBe(officerUser.id);

    // Every read of a case leaves a trace.
    expect(await prisma.auditLog.count({ where: { action: 'safeguarding.case_viewed' } })).toBe(1);
  });

  it('does not open a case for a routine low-severity report', async () => {
    const guardian = await createGuardianWithFamily();
    const incident = await reportIncident(guardian.viewer, {
      category: 'FACILITY',
      severity: 'LOW',
      summary: 'Kapotte kapstok',
      details: 'De kapstok in de gang is los en zou opnieuw bevestigd moeten worden voor de volgende les.',
      occurredAt: new Date().toISOString(),
    });
    expect(incident.status).toBe('OPEN');
    expect(await prisma.safeguardingCase.count()).toBe(0);
  });
});

describe('administrator access control', () => {
  it('refuses platform statistics, the audit trail and the refund queue to non-staff', async () => {
    const guardian = await createGuardianWithFamily();
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });

    for (const viewer of [guardian.viewer, provider.owner]) {
      await expect(platformStats(viewer)).rejects.toMatchObject({ code: 'forbidden' });
      await expect(auditTrail(viewer)).rejects.toMatchObject({ code: 'forbidden' });
      await expect(refundQueue(viewer)).rejects.toMatchObject({ code: 'forbidden' });
    }

    const admin = sessionUser(await createUser({ email: 'admin@test.local', role: 'ADMIN' }));
    await expect(platformStats(admin)).resolves.toMatchObject({ providers: { total: 1 } });
  });

  it('keeps the audit log append-only', async () => {
    const guardian = await createGuardianWithFamily();
    await createChild(guardian.family.id);
    const admin = sessionUser(await createUser({ email: 'admin@test.local', role: 'ADMIN' }));
    await platformStats(admin);

    const entry = await prisma.auditLog.create({
      data: { action: 'test.entry', entityType: 'Test', metadata: {} },
    });
    await expect(prisma.auditLog.update({ where: { id: entry.id }, data: { action: 'tampered' } })).rejects.toThrow(
      /append-only/,
    );
    await expect(prisma.auditLog.delete({ where: { id: entry.id } })).rejects.toThrow(/append-only/);
  });
});

describe('private media and uploads', () => {
  it('accepts only a signed, unexpired link bound to one viewer', () => {
    const url = signMediaUrl('asset-1', 'user-1', 300);
    const parsed = new URL(url, 'http://localhost');
    const expires = Number(parsed.searchParams.get('expires'));
    const signature = parsed.searchParams.get('signature')!;

    expect(verifyMediaSignature('asset-1', 'user-1', expires, signature)).toBe(true);
    // Another viewer, another asset, a tampered signature or an expiry in the
    // past must all fail.
    expect(verifyMediaSignature('asset-1', 'user-2', expires, signature)).toBe(false);
    expect(verifyMediaSignature('asset-2', 'user-1', expires, signature)).toBe(false);
    expect(verifyMediaSignature('asset-1', 'user-1', expires, 'f'.repeat(64))).toBe(false);
    expect(verifyMediaSignature('asset-1', 'user-1', Math.floor(Date.now() / 1000) - 10, signature)).toBe(false);
  });

  it('rejects unsupported types and oversized uploads', () => {
    expect(() => assertUploadAllowed('image/png', 1024)).not.toThrow();
    expect(() => assertUploadAllowed('application/pdf', 1024)).not.toThrow();
    expect(() => assertUploadAllowed('text/html', 1024)).toThrow(/Unsupported file type/);
    expect(() => assertUploadAllowed('image/png', MAX_UPLOAD_BYTES + 1)).toThrow(/between/);
    expect(() => assertUploadAllowed('image/png', 0)).toThrow(/between/);
  });
});

describe('rate limiting', () => {
  it('locks out repeated login attempts from one source', () => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      expect(() => consumeRateLimit('login', '203.0.113.7')).not.toThrow();
    }
    expect(() => consumeRateLimit('login', '203.0.113.7')).toThrow(/Too many requests/);
    // A different source is unaffected.
    expect(() => consumeRateLimit('login', '203.0.113.8')).not.toThrow();
  });
});
