import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { env } from '../../../../lib/env.ts';
import { safeEqual } from '../../../../lib/crypto.ts';
import { UnknownJobError, runAllJobs, runJob } from '../../../../server/jobs.ts';

/**
 * The scheduler's entry point.
 *
 * Any cron that can make an HTTP request drives the whole automation:
 *
 *   0 6 * * *  curl -fsS -X POST https://…/api/jobs/run \
 *                -H "authorization: Bearer $JOB_RUNNER_TOKEN" \
 *                -d '{"job":"renew-subscriptions"}'
 *
 * Authorisation is a shared secret compared in constant time, not a session:
 * the caller is a machine, and it has no business holding a user's cookie.
 * Without JOB_RUNNER_TOKEN configured the endpoint refuses everything, so a
 * misconfigured deployment fails loudly rather than running unauthenticated.
 */
const BodySchema = z.object({
  job: z.string().min(1).optional(),
  /** Skip when the same job already succeeded this recently. */
  minIntervalMinutes: z.number().int().min(0).max(10_080).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = env.JOB_RUNNER_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'notConfigured', detail: 'JOB_RUNNER_TOKEN is not set' },
      { status: 503 },
    );
  }

  const presented = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!presented || !safeEqual(presented, token)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'badRequest', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const runs = parsed.data.job
      ? [await runJob(parsed.data.job, { minIntervalMinutes: parsed.data.minIntervalMinutes })]
      : await runAllJobs();

    // A failed job is reported, not thrown: the scheduler should see which one
    // failed rather than a blank 500, and should not retry the whole batch.
    const failed = runs.filter((run) => run.status === 'failed');
    return NextResponse.json(
      { runs, failed: failed.length },
      { status: failed.length > 0 ? 207 : 200, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof UnknownJobError) {
      return NextResponse.json({ error: 'unknownJob', detail: error.message }, { status: 404 });
    }
    throw error;
  }
}
