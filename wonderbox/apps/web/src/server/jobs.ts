import { prisma } from '../lib/db.ts';
import { audit } from '../lib/audit.ts';
import { env } from '../lib/env.ts';
import { runRetentionSweep } from './privacy.ts';
import { dueSubscriptions, runRenewal } from './subscriptions.ts';
import { createShipmentForOrder } from './orders.ts';
import { snapshotSummary } from './progress.ts';
import {
  approvePurchaseOrder,
  createPurchaseOrder,
  replenishmentProposal,
  sendPurchaseOrder,
} from './purchasing.ts';

/**
 * The scheduled work.
 *
 * Everything that makes WonderBox run without somebody clicking a button lives
 * here, as a registry of named jobs a scheduler can call. There is no queue and
 * no worker daemon: each job is a plain async function that is safe to call
 * twice, so an external cron hitting `/api/jobs/run` is enough, and a job that
 * fires twice because a cron overlapped costs nothing.
 *
 * Every run is recorded in `JobRun`. An automated process nobody can observe is
 * indistinguishable from one that quietly stopped six weeks ago.
 */

export interface JobResult {
  readonly summary: Record<string, unknown>;
}

export interface JobDefinition {
  readonly name: string;
  readonly description: string;
  /** Suggested cron, for the ops console and the documentation. */
  readonly suggestedSchedule: string;
  run(now: Date): Promise<JobResult>;
}

/** Renews every subscription whose period has ended. */
const renewSubscriptions: JobDefinition = {
  name: 'renew-subscriptions',
  description: 'Verlengt elk abonnement waarvan de periode voorbij is en plaatst de bestelling.',
  suggestedSchedule: '0 6 * * *',
  async run(now) {
    const due = await dueSubscriptions(now);
    const outcomes: Record<string, number> = {};
    const failures: string[] = [];

    for (const subscriptionId of due) {
      try {
        const result = await runRenewal(subscriptionId, now);
        outcomes[result.outcome] = (outcomes[result.outcome] ?? 0) + 1;
      } catch (error) {
        // One family's bad address must not stop the other four hundred.
        failures.push(`${subscriptionId}: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }
    return { summary: { due: due.length, outcomes, failures } };
  },
};

/**
 * Creates a shipping label for every paid order.
 *
 * Off unless AUTO_FULFIL is set: labels cost money and a mislabelled parcel is
 * a real cost, so an operation opts into this once it trusts its own data.
 */
const fulfilPaidOrders: JobDefinition = {
  name: 'fulfil-paid-orders',
  description: 'Maakt automatisch een verzendlabel voor elke betaalde bestelling.',
  suggestedSchedule: '*/30 * * * *',
  async run() {
    if (!env.AUTO_FULFIL) {
      return { summary: { skipped: 'AUTO_FULFIL staat uit' } };
    }
    const orders = await prisma.order.findMany({
      where: { status: 'PAID', shipments: { none: {} } },
      select: { id: true, number: true },
      take: 200,
    });

    let labelled = 0;
    const failures: string[] = [];
    for (const order of orders) {
      try {
        await createShipmentForOrder(order.id, null);
        labelled += 1;
      } catch (error) {
        failures.push(`${order.number}: ${error instanceof Error ? error.message : 'unknown'}`);
      }
    }
    return { summary: { candidates: orders.length, labelled, failures } };
  },
};

/**
 * Turns the subscription book into purchase orders.
 *
 * Orders are raised as DRAFT and wait for a person, unless the supplier has an
 * `autoApproveUnderCents` ceiling the proposal fits under. The origin key is
 * the supplier plus the date, so running hourly still yields one order per
 * supplier per day.
 */
const replenishStock: JobDefinition = {
  name: 'replenish-stock',
  description:
    'Rekent de abonnementen door naar onderdelen en zet inkooporders klaar bij de leveranciers.',
  suggestedSchedule: '0 7 * * 1',
  async run(now) {
    const proposals = await replenishmentProposal(now);
    const day = now.toISOString().slice(0, 10);

    let created = 0;
    let reused = 0;
    let autoSent = 0;
    const held: string[] = [];

    for (const proposal of proposals) {
      if (proposal.belowMinimumOrderValue) {
        // Ordering under a supplier's minimum just gets rejected; wait a week.
        held.push(`${proposal.supplierCode}: onder minimale orderwaarde`);
        continue;
      }

      const { order, created: isNew } = await createPurchaseOrder(
        proposal,
        `replenish:${proposal.supplierId}:${day}`,
      );
      if (isNew) created += 1;
      else reused += 1;

      if (isNew && proposal.autoApprovable) {
        await approvePurchaseOrder(order.id, null);
        await sendPurchaseOrder(order.id);
        autoSent += 1;
      } else if (isNew) {
        held.push(`${proposal.supplierCode}: wacht op goedkeuring`);
      }
    }

    return {
      summary: { proposals: proposals.length, created, reused, autoSent, held },
    };
  },
};

/** Freezes a monthly summary so it survives the events it was built from. */
const snapshotSummaries: JobDefinition = {
  name: 'snapshot-summaries',
  description: 'Legt de oudersamenvatting per maand vast, voordat de voortgang verjaart.',
  suggestedSchedule: '0 3 1 * *',
  async run(now) {
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

    const boxes = await prisma.activatedBox.findMany({
      where: { lastPlayedAt: { gte: periodStart } },
      select: { id: true, familyId: true, family: { select: { locale: true } } },
    });

    for (const box of boxes) {
      await snapshotSummary(
        box.id,
        box.familyId,
        periodStart,
        periodEnd,
        box.family.locale === 'en' ? 'en' : 'nl',
      );
    }
    return { summary: { boxes: boxes.length, periodStart, periodEnd } };
  },
};

/** Drops what the retention policy says must go. */
const retentionSweep: JobDefinition = {
  name: 'retention-sweep',
  description: 'Verwijdert voortgang, auditregels en sessies die hun bewaartermijn voorbij zijn.',
  suggestedSchedule: '0 4 * * *',
  async run(now) {
    const report = await runRetentionSweep(now);
    return { summary: { ...report } };
  },
};

export const JOBS: readonly JobDefinition[] = [
  renewSubscriptions,
  replenishStock,
  fulfilPaidOrders,
  snapshotSummaries,
  retentionSweep,
];

export function findJob(name: string): JobDefinition | undefined {
  return JOBS.find((job) => job.name === name);
}

export class UnknownJobError extends Error {
  constructor(name: string) {
    super(`Unknown job: ${name}`);
    this.name = 'UnknownJobError';
  }
}

export interface RunRecord {
  readonly id: string;
  readonly job: string;
  readonly status: string;
  readonly summary: Record<string, unknown>;
  readonly durationMs: number;
  readonly skipped: boolean;
}

/**
 * Runs one job and records what happened.
 *
 * `minIntervalMinutes` makes an overlapping cron harmless: a job that has
 * already succeeded inside the window is skipped rather than repeated. The jobs
 * themselves are idempotent regardless — this only saves the work.
 */
export async function runJob(
  name: string,
  options: { now?: Date; minIntervalMinutes?: number } = {},
): Promise<RunRecord> {
  const job = findJob(name);
  if (!job) throw new UnknownJobError(name);
  const now = options.now ?? new Date();

  if (options.minIntervalMinutes && options.minIntervalMinutes > 0) {
    const since = new Date(now.getTime() - options.minIntervalMinutes * 60_000);
    const recent = await prisma.jobRun.findFirst({
      where: { job: name, status: 'succeeded', startedAt: { gte: since } },
      orderBy: { startedAt: 'desc' },
    });
    if (recent) {
      return {
        id: recent.id,
        job: name,
        status: 'skipped',
        summary: { reason: 'al gedraaid binnen het interval', previousRun: recent.startedAt },
        durationMs: 0,
        skipped: true,
      };
    }
  }

  const started = Date.now();
  const record = await prisma.jobRun.create({ data: { job: name, startedAt: now } });

  try {
    const result = await job.run(now);
    const finished = await prisma.jobRun.update({
      where: { id: record.id },
      data: {
        status: 'succeeded',
        finishedAt: new Date(),
        summary: result.summary as object,
      },
    });
    return {
      id: finished.id,
      job: name,
      status: 'succeeded',
      summary: result.summary,
      durationMs: Date.now() - started,
      skipped: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    await prisma.jobRun.update({
      where: { id: record.id },
      data: { status: 'failed', finishedAt: new Date(), error: message.slice(0, 2000) },
    });
    await audit({
      actorRole: 'SYSTEM',
      action: 'job.failed',
      entityType: 'JobRun',
      entityId: record.id,
      metadata: { job: name },
    });
    return {
      id: record.id,
      job: name,
      status: 'failed',
      summary: { error: message },
      durationMs: Date.now() - started,
      skipped: false,
    };
  }
}

/** Runs every job, in the order they are declared. */
export async function runAllJobs(now = new Date()): Promise<RunRecord[]> {
  const records: RunRecord[] = [];
  for (const job of JOBS) records.push(await runJob(job.name, { now }));
  return records;
}

/** The last run of each job, for the ops console. */
export async function jobStatus() {
  const latest = await Promise.all(
    JOBS.map(async (job) => {
      const run = await prisma.jobRun.findFirst({
        where: { job: job.name },
        orderBy: { startedAt: 'desc' },
      });
      return { definition: job, lastRun: run };
    }),
  );
  return latest;
}
