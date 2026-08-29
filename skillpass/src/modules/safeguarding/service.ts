import { z } from 'zod';
import { prisma } from '@/lib/db';
import { audit } from '@/lib/audit';
import { reference } from '@/lib/crypto';
import { AuthorizationError, ChildContactBlockedError, NotFoundError, ValidationError } from '@/lib/errors';
import { requireProviderAccess, requireSafeguardingOfficer } from '@/lib/auth/rbac';
import type { SessionUser } from '@/lib/auth/session';
import { notify } from '@/modules/notifications/service';

export const incidentSchema = z.object({
  category: z.enum(['INJURY', 'BEHAVIOUR', 'SAFEGUARDING', 'FACILITY', 'DISCRIMINATION', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  summary: z.string().trim().min(5).max(200),
  details: z.string().trim().min(20).max(4000),
  occurredAt: z.string(),
  sessionId: z.string().cuid().optional().or(z.literal('')),
  providerId: z.string().cuid().optional().or(z.literal('')),
});

export type IncidentInput = z.infer<typeof incidentSchema>;

/**
 * Anyone with an account can report an incident. A SAFEGUARDING category, or
 * any HIGH/CRITICAL severity, immediately opens a restricted safeguarding case
 * and pages the officers — it is never left sitting in a general queue.
 */
export async function reportIncident(user: SessionUser, input: IncidentInput) {
  const incident = await prisma.incident.create({
    data: {
      reference: reference('INC'),
      providerId: input.providerId || null,
      sessionId: input.sessionId || null,
      reporterId: user.id,
      category: input.category,
      severity: input.severity,
      status: 'OPEN',
      summary: input.summary,
      details: input.details,
      occurredAt: new Date(input.occurredAt),
    },
  });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'safeguarding.incident_reported',
    entityType: 'Incident',
    entityId: incident.id,
    metadata: { category: input.category, severity: input.severity, reference: incident.reference },
  });

  const needsCase = input.category === 'SAFEGUARDING' || input.severity === 'HIGH' || input.severity === 'CRITICAL';
  if (needsCase) {
    await escalateToSafeguarding(incident.id, 'auto-escalated on report');
  }

  const officers = await prisma.user.findMany({
    where: { role: needsCase ? 'SAFEGUARDING_OFFICER' : { in: ['ADMIN', 'SAFEGUARDING_OFFICER'] }, status: 'ACTIVE' },
    select: { id: true },
  });
  for (const officer of officers) {
    await notify({
      userId: officer.id,
      category: needsCase ? 'SAFEGUARDING' : 'INCIDENT',
      titleNl: `Nieuwe melding ${incident.reference}`,
      titleEn: `New report ${incident.reference}`,
      bodyNl: `${input.severity} — ${input.summary}`,
      bodyEn: `${input.severity} — ${input.summary}`,
      link: `/nl/admin/incidents/${incident.id}`,
    });
  }

  // Escalation moves the incident to ESCALATED; return the current row rather
  // than the pre-escalation snapshot.
  return needsCase ? prisma.incident.findUniqueOrThrow({ where: { id: incident.id } }) : incident;
}

export async function escalateToSafeguarding(incidentId: string, note: string, officer?: SessionUser) {
  const incident = await prisma.incident.findUniqueOrThrow({ where: { id: incidentId } });
  const existing = await prisma.safeguardingCase.findUnique({ where: { incidentId } });
  if (existing) return existing;

  const created = await prisma.safeguardingCase.create({
    data: {
      reference: reference('SG'),
      incidentId: incident.id,
      officerId: officer?.id ?? null,
      status: 'OPEN',
      caseNotes: note,
    },
  });
  await prisma.incident.update({ where: { id: incidentId }, data: { status: 'ESCALATED' } });

  await audit({
    actorUserId: officer?.id ?? null,
    action: 'safeguarding.case_opened',
    entityType: 'SafeguardingCase',
    entityId: created.id,
    metadata: { incidentId, reference: created.reference },
  });

  return created;
}

/** Safeguarding case notes are restricted to the safeguarding role. */
export async function getSafeguardingCase(user: SessionUser, caseId: string) {
  requireSafeguardingOfficer(user);
  const found = await prisma.safeguardingCase.findUnique({
    where: { id: caseId },
    include: { incident: { include: { provider: true, session: true, reporter: { select: { displayName: true, email: true } } } } },
  });
  if (!found) throw new NotFoundError('Case not found');
  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'safeguarding.case_viewed',
    entityType: 'SafeguardingCase',
    entityId: caseId,
  });
  return found;
}

export async function updateSafeguardingCase(
  user: SessionUser,
  caseId: string,
  data: { status?: 'OPEN' | 'INVESTIGATING' | 'REFERRED_TO_AUTHORITY' | 'CLOSED'; caseNotes?: string; authorityReference?: string },
) {
  requireSafeguardingOfficer(user);
  const updated = await prisma.safeguardingCase.update({
    where: { id: caseId },
    data: {
      ...(data.status ? { status: data.status, closedAt: data.status === 'CLOSED' ? new Date() : null } : {}),
      ...(data.caseNotes !== undefined ? { caseNotes: data.caseNotes } : {}),
      ...(data.authorityReference !== undefined ? { authorityReference: data.authorityReference } : {}),
      officerId: user.id,
    },
  });
  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'safeguarding.case_updated',
    entityType: 'SafeguardingCase',
    entityId: caseId,
    metadata: { status: data.status ?? null },
  });
  return updated;
}

export async function resolveIncident(user: SessionUser, incidentId: string, resolution: string) {
  const incident = await prisma.incident.update({
    where: { id: incidentId },
    data: { status: 'RESOLVED', resolution, resolvedAt: new Date() },
  });
  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'safeguarding.incident_resolved',
    entityType: 'Incident',
    entityId: incidentId,
    metadata: { resolution },
  });
  return incident;
}

/**
 * The only provider -> family communication channel. Messages are structured:
 * the provider picks a template and supplies variables, so there is no free
 * text channel that could be used to groom or pressure a family, and there is
 * no addressing mode that can reach a child.
 */
export const MESSAGE_TEMPLATES = {
  session_reminder: {
    nl: 'Herinnering: {activity} begint op {when} bij {venue}.',
    en: 'Reminder: {activity} starts on {when} at {venue}.',
  },
  bring_equipment: {
    nl: 'Voor {activity} graag meenemen: {items}.',
    en: 'For {activity}, please bring: {items}.',
  },
  session_cancelled: {
    nl: '{activity} van {when} gaat niet door. Reden: {reason}. Je credits zijn teruggestort.',
    en: '{activity} on {when} has been cancelled. Reason: {reason}. Your credits have been returned.',
  },
  location_change: {
    nl: '{activity} vindt op {when} plaats op een andere locatie: {venue}.',
    en: '{activity} on {when} takes place at a different location: {venue}.',
  },
} as const;

export type MessageTemplateKey = keyof typeof MESSAGE_TEMPLATES;

function render(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => variables[key] ?? match);
}

export async function sendProviderMessage(
  user: SessionUser,
  providerId: string,
  input: { recipientUserId: string; templateKey: MessageTemplateKey; variables: Record<string, string> },
) {
  await requireProviderAccess(user, providerId, 'messages:send');

  const template = MESSAGE_TEMPLATES[input.templateKey];
  if (!template) throw new ValidationError('Unknown message template');

  const recipient = await prisma.user.findUnique({
    where: { id: input.recipientUserId },
    select: { id: true, role: true, status: true },
  });

  // A child profile has no User row, so a child id can never resolve here. This
  // check also blocks messaging staff or admins through the parent channel.
  if (!recipient) {
    const asChild = await prisma.childProfile.findUnique({ where: { id: input.recipientUserId }, select: { id: true } });
    if (asChild) {
      await audit({
        actorUserId: user.id,
        actorRole: user.role,
        action: 'safeguarding.child_contact_blocked',
        entityType: 'ChildProfile',
        entityId: asChild.id,
        metadata: { providerId, templateKey: input.templateKey },
      });
      throw new ChildContactBlockedError();
    }
    throw new NotFoundError('Recipient not found');
  }
  if (recipient.role !== 'GUARDIAN') {
    throw new AuthorizationError('Provider messages can only be sent to a guardian');
  }

  // The recipient must actually have a booking with this provider.
  const relationship = await prisma.booking.findFirst({
    where: {
      createdById: recipient.id,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      session: { activity: { providerId } },
    },
    select: { id: true },
  });
  if (!relationship) {
    throw new AuthorizationError('You can only message guardians who have a booking with you');
  }

  const message = await prisma.providerMessage.create({
    data: {
      providerId,
      senderId: user.id,
      recipientId: recipient.id,
      templateKey: input.templateKey,
      variables: input.variables,
    },
  });

  await notify({
    userId: recipient.id,
    category: 'PROVIDER_ANNOUNCEMENT',
    titleNl: 'Bericht van je aanbieder',
    titleEn: 'Message from your provider',
    bodyNl: render(template.nl, input.variables),
    bodyEn: render(template.en, input.variables),
    link: '/nl/notifications',
  });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'provider.message_sent',
    entityType: 'ProviderMessage',
    entityId: message.id,
    metadata: { providerId, templateKey: input.templateKey },
  });

  return message;
}

export async function listIncidents(filter: { status?: 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'CLOSED' } = {}) {
  return prisma.incident.findMany({
    where: { ...(filter.status ? { status: filter.status } : {}) },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    include: {
      provider: { select: { displayName: true } },
      reporter: { select: { displayName: true, role: true } },
      safeguardingCase: { select: { id: true, reference: true, status: true } },
    },
  });
}
