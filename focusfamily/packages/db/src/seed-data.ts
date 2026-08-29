import {
  MockScreenTimeAdapter,
  addDays,
  localDateKey,
  startOfLocalDay,
  type UsageCategory,
} from '@focusfamily/domain';
import type { PrismaClient } from '@prisma/client';
import { ACTIVITY_SUGGESTIONS, EDUCATIONAL_ARTICLES } from './content.js';
import { hashPassword } from './password.js';

export interface SeedResult {
  familyId: string;
  users: Record<'noor' | 'sam' | 'lena' | 'tijn' | 'admin', string>;
  demoPassword: string;
  counts: Record<string, number>;
}

const DEMO_PASSWORD = 'focusfamily-demo-2026';

/**
 * The demo family: two guardians who both take part, a fifteen year old and a
 * nine year old.
 *
 * The data is deliberately mixed and deliberately incomplete. There are
 * self-reported figures, app-observed focus sessions and clearly-labelled
 * simulated figures from the mock adapter - and no OS-verified rows at all,
 * because no device in a demo has ever been granted Screen Time access. That
 * gap is the point: the app has to look right when the phone tells it nothing.
 */
export async function seedDemoFamily(
  prisma: PrismaClient,
  options: { now?: Date; familyId?: string } = {},
): Promise<SeedResult> {
  const now = options.now ?? new Date();
  const today = startOfLocalDay(now);
  const familyId = options.familyId ?? 'fam_devries';
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const users = {
    noor: 'usr_noor',
    sam: 'usr_sam',
    lena: 'usr_lena',
    tijn: 'usr_tijn',
    admin: 'usr_support',
  } as const;

  await prisma.family.deleteMany({ where: { id: familyId } });
  await prisma.user.deleteMany({ where: { id: { in: Object.values(users) } } });

  await prisma.user.createMany({
    data: [
      {
        id: users.noor,
        email: 'noor@focusfamily.test',
        passwordHash,
        displayName: 'Noor',
        locale: 'nl',
        platformRole: 'member',
      },
      {
        id: users.sam,
        email: 'sam@focusfamily.test',
        passwordHash,
        displayName: 'Sam',
        locale: 'nl',
        platformRole: 'member',
      },
      {
        id: users.lena,
        email: 'lena@focusfamily.test',
        passwordHash,
        displayName: 'Lena',
        locale: 'nl',
        platformRole: 'member',
      },
      {
        id: users.tijn,
        email: null,
        passwordHash,
        displayName: 'Tijn',
        locale: 'nl',
        platformRole: 'member',
      },
      {
        id: users.admin,
        email: 'support@focusfamily.test',
        passwordHash,
        displayName: 'Support',
        locale: 'en',
        platformRole: 'support_admin',
      },
    ],
  });

  await prisma.family.create({
    data: {
      id: familyId,
      name: 'Familie De Vries',
      locale: 'nl',
      timeZone: 'Europe/Amsterdam',
      // Three weeks ago, so the quiet first week is over and the app may speak.
      baselineStartedAt: addDays(today, -21),
    },
  });

  await prisma.membership.createMany({
    data: [
      { id: 'mem_noor', familyId, userId: users.noor, role: 'guardian', displayName: 'Noor' },
      { id: 'mem_sam', familyId, userId: users.sam, role: 'guardian', displayName: 'Sam' },
      { id: 'mem_lena', familyId, userId: users.lena, role: 'child', displayName: 'Lena' },
      { id: 'mem_tijn', familyId, userId: users.tijn, role: 'child', displayName: 'Tijn' },
    ],
  });

  await prisma.childProfile.createMany({
    data: [
      {
        id: 'cp_lena',
        membershipId: 'mem_lena',
        familyId,
        birthYear: now.getFullYear() - 15,
        ageBand: 'band_14_17',
        canEditOwnAgreements: true,
        linkedByUserId: users.noor,
      },
      {
        id: 'cp_tijn',
        membershipId: 'mem_tijn',
        familyId,
        birthYear: now.getFullYear() - 9,
        ageBand: 'band_8_10',
        canEditOwnAgreements: false,
        linkedByUserId: users.noor,
      },
    ],
  });

  await prisma.device.createMany({
    data: [
      {
        id: 'dev_noor',
        familyId,
        userId: users.noor,
        label: 'Telefoon van Noor',
        platform: 'android',
        // No usage access granted in the demo, so nothing is read from it.
        adapter: 'none',
        osVersion: '15',
      },
      {
        id: 'dev_lena',
        familyId,
        userId: users.lena,
        label: 'Telefoon van Lena',
        platform: 'ios',
        adapter: 'mock',
        osVersion: '19.2',
      },
      {
        id: 'dev_tijn',
        familyId,
        userId: users.tijn,
        label: 'Tablet van Tijn',
        platform: 'android',
        adapter: 'mock',
        osVersion: '15',
      },
    ],
  });

  /* -------------------------------- consent ------------------------------ */

  const consentRows: Array<{
    id: string;
    subjectUserId: string;
    actorUserId: string;
    scope:
      | 'account_basic'
      | 'measurement_self_report'
      | 'measurement_app_observed'
      | 'measurement_os_verified'
      | 'notifications_push'
      | 'insights_weekly_review';
    decision: 'granted' | 'withdrawn';
    statementKey: string;
    daysAgo: number;
  }> = [];

  let consentSeq = 0;
  const addConsent = (row: Omit<(typeof consentRows)[number], 'id'>): void => {
    consentSeq += 1;
    consentRows.push({ id: `con_${consentSeq}`, ...row });
  };

  for (const [subject, actor] of [
    [users.noor, users.noor],
    [users.sam, users.sam],
    [users.lena, users.noor],
    [users.tijn, users.noor],
  ] as const) {
    addConsent({
      subjectUserId: subject,
      actorUserId: actor,
      scope: 'account_basic',
      decision: 'granted',
      statementKey: 'consent.statement.account.basic',
      daysAgo: 21,
    });
    addConsent({
      subjectUserId: subject,
      actorUserId: actor,
      scope: 'measurement_self_report',
      decision: 'granted',
      statementKey: 'consent.statement.measurement.self_report',
      daysAgo: 21,
    });
    addConsent({
      subjectUserId: subject,
      actorUserId: actor,
      scope: 'measurement_app_observed',
      decision: 'granted',
      statementKey: 'consent.statement.measurement.app_observed',
      daysAgo: 21,
    });
  }
  // Lena is fifteen, so her own yes is required as well as her guardian's.
  // In the demo she has not given it: the app must show a waiting state and
  // must not read anything from her phone.
  addConsent({
    subjectUserId: users.lena,
    actorUserId: users.noor,
    scope: 'measurement_os_verified',
    decision: 'granted',
    statementKey: 'consent.statement.measurement.os_verified',
    daysAgo: 14,
  });
  addConsent({
    subjectUserId: users.lena,
    actorUserId: users.lena,
    scope: 'measurement_app_observed',
    decision: 'granted',
    statementKey: 'consent.statement.measurement.app_observed',
    daysAgo: 20,
  });
  // Tijn is nine: his guardian consents and he is shown the plain explanation.
  addConsent({
    subjectUserId: users.tijn,
    actorUserId: users.noor,
    scope: 'measurement_os_verified',
    decision: 'granted',
    statementKey: 'consent.statement.measurement.os_verified',
    daysAgo: 14,
  });
  // Sam turned the weekly review on, then off again, then on. History is kept.
  addConsent({
    subjectUserId: users.sam,
    actorUserId: users.sam,
    scope: 'insights_weekly_review',
    decision: 'granted',
    statementKey: 'consent.statement.insights.weekly_review',
    daysAgo: 20,
  });
  addConsent({
    subjectUserId: users.sam,
    actorUserId: users.sam,
    scope: 'insights_weekly_review',
    decision: 'withdrawn',
    statementKey: 'consent.statement.insights.weekly_review',
    daysAgo: 12,
  });
  addConsent({
    subjectUserId: users.sam,
    actorUserId: users.sam,
    scope: 'insights_weekly_review',
    decision: 'granted',
    statementKey: 'consent.statement.insights.weekly_review',
    daysAgo: 5,
  });
  for (const subject of [users.noor, users.lena]) {
    addConsent({
      subjectUserId: subject,
      actorUserId: subject,
      scope: 'notifications_push',
      decision: 'granted',
      statementKey: 'consent.statement.notifications.push',
      daysAgo: 21,
    });
  }

  await prisma.consentRecord.createMany({
    data: consentRows.map((row) => ({
      id: row.id,
      familyId,
      subjectUserId: row.subjectUserId,
      actorUserId: row.actorUserId,
      scope: row.scope,
      decision: row.decision,
      statementKey: row.statementKey,
      statementVersion: '2026-01',
      recordedAt: addDays(today, -row.daysAgo),
    })),
  });

  await prisma.measurementSource.createMany({
    data: [
      {
        id: 'ms_focus_timer',
        familyId,
        userId: null,
        kind: 'app_observed',
        provider: 'focusfamily.timer',
        enabled: true,
      },
      {
        id: 'ms_self_report',
        familyId,
        userId: null,
        kind: 'self_reported',
        provider: 'focusfamily.form',
        enabled: true,
      },
      {
        id: 'ms_mock_lena',
        familyId,
        userId: users.lena,
        kind: 'simulated',
        provider: 'mock',
        enabled: true,
      },
      {
        id: 'ms_mock_tijn',
        familyId,
        userId: users.tijn,
        kind: 'simulated',
        provider: 'mock',
        enabled: true,
      },
      {
        id: 'ms_os_lena',
        familyId,
        userId: users.lena,
        kind: 'os_verified',
        provider: 'ios.DeviceActivity',
        // Waiting for Lena's own yes. Disabled, and therefore silent.
        enabled: false,
      },
    ],
  });

  /* ------------------------------- agreement ----------------------------- */

  await prisma.familyAgreement.create({
    data: {
      id: 'agr_devries',
      familyId,
      title: 'Onze afspraken',
      status: 'active',
      agreedByUserIds: [users.noor, users.sam, users.lena, users.tijn],
      createdByUserId: users.noor,
      createdAt: addDays(today, -14),
      activatedAt: addDays(today, -13),
      reviewOnDayKey: localDateKey(addDays(today, 14)),
      rules: {
        create: [
          {
            id: 'rule_meals',
            context: 'meals',
            kind: 'devices_away',
            audience: 'everyone',
            ageBands: [],
            startsAt: '18:00',
            endsAt: '19:00',
            weekdays: [],
            text: 'Tijdens het eten liggen alle telefoons in de mand in de gang.',
            repairText: 'Vergeet iemand het, dan legt die hem weg en eten we door.',
          },
          {
            id: 'rule_homework',
            context: 'homework',
            kind: 'quiet_window',
            audience: 'everyone',
            ageBands: [],
            startsAt: '16:30',
            endsAt: '17:30',
            weekdays: [1, 2, 3, 4],
            text: 'Het huiswerkuur is stil voor iedereen, ook voor Noor en Sam.',
            repairText: 'Lukt het vandaag niet, dan proberen we het morgen opnieuw.',
          },
          {
            id: 'rule_bedtime',
            context: 'bedtime',
            kind: 'charge_outside_bedroom',
            audience: 'everyone',
            ageBands: [],
            startsAt: '21:00',
            endsAt: '07:00',
            weekdays: [],
            text: 'Vanaf negen uur laadt elke telefoon op in de keuken, die van ons ook.',
            repairText: 'Vergeten? Breng hem naar beneden zodra je het merkt.',
          },
          {
            id: 'rule_bedtime_tijn',
            context: 'bedtime',
            kind: 'quiet_window',
            audience: 'member',
            memberId: users.tijn,
            ageBands: ['band_8_10'],
            startsAt: '19:30',
            endsAt: '07:00',
            weekdays: [],
            text: 'Tijn legt de tablet om half acht weg, dan lezen we samen.',
            repairText: 'Nog even bezig? Dan maken we het af en leggen we hem daarna weg.',
          },
          {
            id: 'rule_bedrooms',
            context: 'bedrooms',
            kind: 'device_free_room',
            audience: 'everyone',
            ageBands: [],
            weekdays: [],
            text: "'s Nachts blijven slaapkamers schermvrij, voor ons allemaal.",
            repairText: 'We herinneren elkaar er vriendelijk aan, één keer.',
          },
          {
            id: 'rule_school',
            context: 'school',
            kind: 'ask_before_new_app',
            audience: 'everyone',
            ageBands: [],
            weekdays: [],
            text: 'Een nieuwe app zetten we samen op de telefoon en bekijken we vijf minuten.',
            repairText: 'Al iets geïnstalleerd? Laat het zien, dan kijken we er samen naar.',
          },
          {
            id: 'rule_weekend',
            context: 'family_activities',
            kind: 'shared_activity',
            audience: 'everyone',
            ageBands: [],
            weekdays: [0, 6],
            text: 'Eén keer per weekend doen we samen iets zonder schermen.',
            repairText: 'Een druk weekend komt voor. Dan kiezen we een nieuw moment.',
          },
        ],
      },
    },
  });

  await prisma.focusSchedule.createMany({
    data: [
      {
        id: 'sch_dinner',
        familyId,
        agreementId: 'agr_devries',
        kind: 'dinner',
        title: 'Samen eten',
        startsAt: '18:00',
        durationMinutes: 45,
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        participantIds: [users.noor, users.sam, users.lena, users.tijn],
        enabled: true,
      },
      {
        id: 'sch_homework',
        familyId,
        agreementId: 'agr_devries',
        kind: 'homework',
        title: 'Huiswerkuur',
        startsAt: '16:30',
        durationMinutes: 60,
        weekdays: [1, 2, 3, 4],
        participantIds: [users.noor, users.lena],
        enabled: true,
      },
      {
        id: 'sch_bedtime',
        familyId,
        agreementId: 'agr_devries',
        kind: 'bedtime',
        title: 'Tot rust komen',
        startsAt: '21:00',
        durationMinutes: 30,
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        participantIds: [users.noor, users.sam, users.lena],
        enabled: true,
      },
    ],
  });

  /* ----------------------------- focus sessions -------------------------- */

  const sessionPlans: Array<{
    id: string;
    daysAgo: number;
    scheduleId: string;
    participants: string[];
    plannedMinutes: number;
    outcome: 'completed' | 'abandoned';
    focusedMinutes: number;
    pauseReason?: 'someone_needed_me' | 'urgent_call' | 'schoolwork';
    offline?: boolean;
  }> = [
    { id: 'fs_1', daysAgo: 12, scheduleId: 'sch_dinner', participants: [users.noor, users.sam, users.lena, users.tijn], plannedMinutes: 45, outcome: 'completed', focusedMinutes: 44 },
    { id: 'fs_2', daysAgo: 11, scheduleId: 'sch_homework', participants: [users.noor, users.lena], plannedMinutes: 60, outcome: 'completed', focusedMinutes: 52, pauseReason: 'schoolwork' },
    { id: 'fs_3', daysAgo: 9, scheduleId: 'sch_dinner', participants: [users.sam, users.lena, users.tijn], plannedMinutes: 45, outcome: 'abandoned', focusedMinutes: 8, pauseReason: 'urgent_call' },
    { id: 'fs_4', daysAgo: 6, scheduleId: 'sch_dinner', participants: [users.noor, users.sam, users.lena, users.tijn], plannedMinutes: 45, outcome: 'completed', focusedMinutes: 45 },
    { id: 'fs_5', daysAgo: 5, scheduleId: 'sch_bedtime', participants: [users.noor, users.lena], plannedMinutes: 30, outcome: 'completed', focusedMinutes: 28, offline: true },
    { id: 'fs_6', daysAgo: 4, scheduleId: 'sch_homework', participants: [users.noor, users.lena], plannedMinutes: 60, outcome: 'abandoned', focusedMinutes: 14, pauseReason: 'someone_needed_me' },
    { id: 'fs_7', daysAgo: 3, scheduleId: 'sch_dinner', participants: [users.noor, users.sam, users.lena, users.tijn], plannedMinutes: 45, outcome: 'completed', focusedMinutes: 41 },
    { id: 'fs_8', daysAgo: 1, scheduleId: 'sch_dinner', participants: [users.noor, users.sam, users.tijn], plannedMinutes: 45, outcome: 'completed', focusedMinutes: 40 },
  ];

  for (const plan of sessionPlans) {
    const day = addDays(today, -plan.daysAgo);
    const start = new Date(day.getTime() + 18 * 60 * 60_000);
    const events: Array<{
      id: string;
      type: 'start' | 'pause' | 'resume' | 'complete' | 'abandon';
      at: Date;
      reason: 'someone_needed_me' | 'urgent_call' | 'schoolwork' | null;
      recordedOffline: boolean;
    }> = [
      { id: `${plan.id}_e1`, type: 'start', at: start, reason: null, recordedOffline: false },
    ];
    let cursor = plan.focusedMinutes;
    if (plan.pauseReason) {
      const half = Math.max(1, Math.floor(plan.focusedMinutes / 2));
      events.push({
        id: `${plan.id}_e2`,
        type: 'pause',
        at: new Date(start.getTime() + half * 60_000),
        reason: plan.pauseReason,
        recordedOffline: plan.offline ?? false,
      });
      events.push({
        id: `${plan.id}_e3`,
        type: 'resume',
        at: new Date(start.getTime() + (half + 4) * 60_000),
        reason: null,
        recordedOffline: plan.offline ?? false,
      });
      cursor = plan.focusedMinutes + 4;
    }
    events.push({
      id: `${plan.id}_e9`,
      type: plan.outcome === 'completed' ? 'complete' : 'abandon',
      at: new Date(start.getTime() + cursor * 60_000),
      reason: null,
      recordedOffline: plan.offline ?? false,
    });

    await prisma.focusSession.create({
      data: {
        id: plan.id,
        familyId,
        scheduleId: plan.scheduleId,
        participantIds: plan.participants,
        startedByUserId: plan.participants[0] ?? users.noor,
        plannedMinutes: plan.plannedMinutes,
        status: plan.outcome,
        source: 'app_observed',
        createdAt: start,
        events: { create: events },
      },
    });
  }

  /* -------------------------------- check-ins ---------------------------- */

  const checkInPlans: Array<{
    user: string;
    daysAgo: number;
    sleepHours: number;
    bedtime: string;
    mood: number;
    conflict: 'none' | 'a_little' | 'quite_a_bit';
    note?: string;
    shared?: boolean;
  }> = [
    { user: users.lena, daysAgo: 6, sleepHours: 7, bedtime: '23:15', mood: 3, conflict: 'a_little' },
    { user: users.lena, daysAgo: 5, sleepHours: 7.5, bedtime: '22:50', mood: 4, conflict: 'none' },
    { user: users.lena, daysAgo: 4, sleepHours: 6.5, bedtime: '23:40', mood: 2, conflict: 'quite_a_bit', note: 'Groepsapp bleef maar doorgaan.', shared: false },
    { user: users.lena, daysAgo: 3, sleepHours: 8, bedtime: '22:20', mood: 4, conflict: 'none' },
    { user: users.lena, daysAgo: 1, sleepHours: 8.5, bedtime: '22:00', mood: 5, conflict: 'none', note: 'Oplader beneden helpt echt.', shared: true },
    { user: users.noor, daysAgo: 5, sleepHours: 7, bedtime: '23:30', mood: 3, conflict: 'a_little' },
    { user: users.noor, daysAgo: 3, sleepHours: 7.5, bedtime: '23:00', mood: 4, conflict: 'none' },
    { user: users.noor, daysAgo: 1, sleepHours: 7, bedtime: '23:10', mood: 4, conflict: 'none', note: 'Zelf ook later dan afgesproken.', shared: true },
    { user: users.tijn, daysAgo: 2, sleepHours: 10, bedtime: '20:00', mood: 5, conflict: 'none' },
    { user: users.sam, daysAgo: 2, sleepHours: 6.5, bedtime: '00:10', mood: 3, conflict: 'none' },
  ];

  await prisma.checkIn.createMany({
    data: checkInPlans.map((plan, index) => ({
      id: `ci_${index + 1}`,
      familyId,
      userId: plan.user,
      dayKey: localDateKey(addDays(today, -plan.daysAgo)),
      sleepHours: plan.sleepHours,
      bedtime: plan.bedtime,
      mood: plan.mood,
      conflict: plan.conflict,
      note: plan.note ?? null,
      sharedWithFamily: plan.shared ?? false,
      source: 'self_reported',
      createdAt: addDays(today, -plan.daysAgo),
    })),
  });

  /* -------------------------- usage: self-reported ----------------------- */

  const selfReported: Array<{ user: string; daysAgo: number; minutes: Partial<Record<UsageCategory, number>> }> = [
    { user: users.noor, daysAgo: 3, minutes: { social: 45, communication: 60, other: 30 } },
    { user: users.noor, daysAgo: 2, minutes: { social: 35, communication: 55, video: 40 } },
    { user: users.sam, daysAgo: 2, minutes: { video: 90, communication: 30 } },
  ];

  await prisma.usageSummary.createMany({
    data: selfReported.map((row, index) => ({
      id: `us_self_${index + 1}`,
      familyId,
      userId: row.user,
      dayKey: localDateKey(addDays(today, -row.daysAgo)),
      source: 'self_reported',
      provider: 'focusfamily.form',
      confidence: 'medium',
      minutesByCategory: row.minutes,
      screenPickups: null,
      note: 'Zelf ingeschat aan het eind van de dag.',
    })),
  });

  /* ---------------------- usage: clearly-marked mock --------------------- */

  const mock = new MockScreenTimeAdapter({ seed: 20260301, initialState: 'granted' });
  const from = localDateKey(addDays(today, -6));
  const to = localDateKey(addDays(today, -1));
  const simulatedRows: Array<{
    id: string;
    familyId: string;
    userId: string;
    dayKey: string;
    source: 'simulated';
    provider: string;
    confidence: 'low';
    minutesByCategory: Partial<Record<UsageCategory, number>>;
    screenPickups: number | null;
    note: string;
  }> = [];
  for (const [index, userId] of [users.lena, users.tijn].entries()) {
    const result = await mock.getDailyUsage({ memberId: userId, fromDayKey: from, toDayKey: to });
    if (!result.ok) continue;
    for (const [dayIndex, day] of result.value.entries()) {
      simulatedRows.push({
        id: `us_mock_${index}_${dayIndex}`,
        familyId,
        userId,
        dayKey: day.dayKey,
        source: 'simulated',
        provider: day.provider,
        confidence: 'low',
        minutesByCategory: day.minutesByCategory,
        screenPickups: day.pickups,
        note: 'Voorbeeldgegevens uit de mock-adapter; niet gemeten.',
      });
    }
  }
  await prisma.usageSummary.createMany({ data: simulatedRows });

  /* --------------------------------- goals ------------------------------- */

  await prisma.goal.create({
    data: {
      id: 'goal_dinners',
      familyId,
      kind: 'device_free_dinners',
      title: 'Drie maaltijden zonder apparaten',
      target: 3,
      periodDays: 7,
      startsOnDayKey: localDateKey(addDays(today, -6)),
      participantIds: [users.noor, users.sam, users.lena, users.tijn],
      createdByUserId: users.sam,
      createdAt: addDays(today, -6),
      contributions: {
        create: [
          { id: 'gc_1', familyId, contributedByUserId: users.noor, dayKey: localDateKey(addDays(today, -6)), amount: 1, focusSessionId: 'fs_4', source: 'app_observed' },
          { id: 'gc_2', familyId, contributedByUserId: users.lena, dayKey: localDateKey(addDays(today, -3)), amount: 1, focusSessionId: 'fs_7', source: 'app_observed' },
          { id: 'gc_3', familyId, contributedByUserId: users.tijn, dayKey: localDateKey(addDays(today, -1)), amount: 1, focusSessionId: 'fs_8', source: 'app_observed' },
        ],
      },
    },
  });

  await prisma.achievement.createMany({
    data: [
      {
        id: 'ach_1',
        familyId,
        kind: 'first_agreement',
        titleKey: 'celebration.goal.title',
        bodyKey: 'celebration.goal.body_everyone',
        earnedAt: addDays(today, -13),
      },
      {
        id: 'ach_2',
        familyId,
        kind: 'first_focus_moment',
        titleKey: 'celebration.goal.title',
        bodyKey: 'celebration.goal.body',
        earnedAt: addDays(today, -12),
      },
      {
        id: 'ach_3',
        familyId,
        goalId: 'goal_dinners',
        kind: 'everyone_joined_in',
        titleKey: 'celebration.goal.title',
        bodyKey: 'celebration.goal.body_everyone',
        earnedAt: addDays(today, -1),
      },
    ],
  });

  /* ---------------------- subscription and preferences ------------------- */

  await prisma.subscription.create({
    data: {
      id: 'sub_devries',
      familyId,
      plan: 'family_premium',
      status: 'trialing',
      provider: 'mock',
      providerRef: 'mock_cs_demo',
      currentPeriodEnd: addDays(today, 20),
    },
  });

  await prisma.notificationPreference.createMany({
    data: [
      { id: 'np_noor', userId: users.noor, familyId, enabledCategories: ['focus_reminder', 'checkin_invite', 'weekly_review_ready', 'agreement_change_proposed', 'celebration', 'account_security'], quietHoursStart: '21:30', quietHoursEnd: '07:00', channel: 'push' },
      { id: 'np_sam', userId: users.sam, familyId, enabledCategories: ['weekly_review_ready', 'celebration', 'account_security'], quietHoursStart: '22:00', quietHoursEnd: '07:00', channel: 'email' },
      { id: 'np_lena', userId: users.lena, familyId, enabledCategories: ['focus_reminder', 'celebration', 'account_security'], quietHoursStart: '20:30', quietHoursEnd: '07:30', channel: 'push' },
      { id: 'np_tijn', userId: users.tijn, familyId, enabledCategories: ['focus_reminder', 'account_security'], quietHoursStart: '19:30', quietHoursEnd: '07:30', channel: 'none' },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      { id: 'aud_1', familyId, actorUserId: users.noor, action: 'family.created', at: addDays(today, -21) },
      { id: 'aud_2', familyId, actorUserId: users.noor, action: 'guardian.invited', subjectUserId: users.sam, at: addDays(today, -21) },
      { id: 'aud_3', familyId, actorUserId: users.sam, action: 'guardian.joined', at: addDays(today, -20) },
      { id: 'aud_4', familyId, actorUserId: users.noor, action: 'child.linked', subjectUserId: users.lena, at: addDays(today, -20) },
      { id: 'aud_5', familyId, actorUserId: users.noor, action: 'child.linked', subjectUserId: users.tijn, at: addDays(today, -20) },
      { id: 'aud_6', familyId, actorUserId: users.noor, action: 'agreement.activated', at: addDays(today, -13) },
      { id: 'aud_7', familyId, actorUserId: users.sam, action: 'consent.withdrawn', subjectUserId: users.sam, at: addDays(today, -12) },
      { id: 'aud_8', familyId, actorUserId: users.sam, action: 'consent.granted', subjectUserId: users.sam, at: addDays(today, -5) },
    ],
  });

  const counts = {
    users: 5,
    memberships: 4,
    consentRecords: consentRows.length,
    agreementRules: 7,
    focusSchedules: 3,
    focusSessions: sessionPlans.length,
    checkIns: checkInPlans.length,
    usageSelfReported: selfReported.length,
    usageSimulated: simulatedRows.length,
    usageOsVerified: 0,
    goals: 1,
    achievements: 3,
  };

  return { familyId, users, demoPassword: DEMO_PASSWORD, counts };
}

/** Library content is global, not per family. Safe to run repeatedly. */
export async function seedContent(prisma: PrismaClient): Promise<{ activities: number; articles: number }> {
  for (const activity of ACTIVITY_SUGGESTIONS) {
    await prisma.activitySuggestion.upsert({
      where: { id: activity.id },
      create: {
        id: activity.id,
        category: activity.category,
        title: activity.title,
        body: activity.body,
        minutes: activity.minutes,
        minAge: activity.minAge,
        maxAge: activity.maxAge,
        needsAdult: activity.needsAdult,
        pack: activity.pack,
        questlyRef: activity.questlyRef,
      },
      update: {
        title: activity.title,
        body: activity.body,
        minutes: activity.minutes,
        pack: activity.pack,
      },
    });
  }
  for (const article of EDUCATIONAL_ARTICLES) {
    await prisma.educationalArticle.upsert({
      where: { id: article.id },
      create: {
        id: article.id,
        slug: article.slug,
        topic: article.topic,
        title: article.title,
        summary: article.summary,
        body: article.body,
        readMinutes: article.readMinutes,
        audience: article.audience,
        sourceNote: article.sourceNote,
      },
      update: {
        title: article.title,
        summary: article.summary,
        body: article.body,
        readMinutes: article.readMinutes,
      },
    });
  }
  return { activities: ACTIVITY_SUGGESTIONS.length, articles: EDUCATIONAL_ARTICLES.length };
}
