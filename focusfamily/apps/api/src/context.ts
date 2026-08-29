import {
  AGE_BAND_FROM_DB,
  type DbAgeBand,
  prisma as defaultPrisma,
} from '@focusfamily/db';
import type { PrismaClient } from '@focusfamily/db';
import { DomainError, type Actor, type AgeBand, type Locale } from '@focusfamily/domain';
import type { FastifyRequest } from 'fastify';
import type { Config } from './config.js';
import { SESSION_COOKIE, hashToken, parseCookies } from './security.js';

export interface SessionContext {
  readonly sessionId: string;
  readonly actor: Actor;
  readonly locale: Locale;
  readonly displayName: string;
  readonly csrfHash: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    session?: SessionContext | undefined;
  }
}

export interface Services {
  readonly prisma: PrismaClient;
  readonly config: Config;
}

export function createServices(config: Config, prisma: PrismaClient = defaultPrisma): Services {
  return { prisma, config };
}

/**
 * Resolve the caller from their session cookie.
 *
 * A user can belong to exactly one family in this MVP; the membership decides
 * their family role, and the child profile decides their age band, which in
 * turn decides tone and the consent rules that apply to them.
 */
export async function loadSession(
  request: FastifyRequest,
  services: Services,
): Promise<SessionContext | undefined> {
  const cookies = parseCookies(request.headers.cookie);
  const raw = cookies[SESSION_COOKIE];
  if (!raw) return undefined;

  const session = await services.prisma.authSession.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: {
      user: {
        include: {
          memberships: {
            where: { removedAt: null },
            include: { childProfile: true },
            take: 1,
          },
        },
      },
    },
  });
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return undefined;
  }

  const membership = session.user.memberships[0];
  const ageBand: AgeBand = membership?.childProfile
    ? AGE_BAND_FROM_DB[membership.childProfile.ageBand as DbAgeBand]
    : 'adult';

  return {
    sessionId: session.id,
    csrfHash: session.csrfHash,
    locale: session.user.locale as Locale,
    displayName: session.user.displayName,
    actor: {
      userId: session.user.id,
      familyId: membership?.familyId ?? null,
      role: membership ? (membership.role as 'guardian' | 'child') : null,
      platformRole: session.user.platformRole as 'member' | 'support_admin',
      ageBand,
    },
  };
}

export function requireSession(request: FastifyRequest): SessionContext {
  if (!request.session) {
    throw new DomainError('forbidden', 'auth.sign_in_required');
  }
  return request.session;
}

export function requireFamily(request: FastifyRequest): SessionContext & { familyId: string } {
  const session = requireSession(request);
  if (!session.actor.familyId) {
    throw new DomainError('not_found', 'family.none_yet');
  }
  return Object.assign(session, { familyId: session.actor.familyId });
}

/** Append-only audit trail. Metadata is scalars only, never free text. */
export async function audit(
  services: Services,
  entry: {
    familyId?: string | null;
    actorUserId?: string | null;
    action: string;
    subjectUserId?: string | null;
    metadata?: Record<string, string | number | boolean>;
  },
): Promise<void> {
  await services.prisma.auditLog.create({
    data: {
      id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      familyId: entry.familyId ?? null,
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      subjectUserId: entry.subjectUserId ?? null,
      metadata: entry.metadata ?? {},
    },
  });
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
