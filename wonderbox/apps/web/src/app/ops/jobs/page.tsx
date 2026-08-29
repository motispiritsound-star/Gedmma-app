import { Badge, Card, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { env } from '../../../lib/env.ts';
import { jobStatus } from '../../../server/jobs.ts';
import { runJobAction } from '../../../server/actions/ops.ts';

/**
 * The automation, made visible.
 *
 * An automated process nobody can observe is indistinguishable from one that
 * quietly stopped six weeks ago, so every run is recorded and the last one is
 * shown here — including what it decided, which is usually the interesting part.
 */
export default async function JobsPage() {
  await requirePermissionPage('inventory.read', '/ops/jobs');
  const { locale } = await requestTranslator();
  const nl = locale === 'nl';

  const [status, recent] = await Promise.all([
    jobStatus(),
    prisma.jobRun.findMany({ orderBy: { startedAt: 'desc' }, take: 25 }),
  ]);

  const stamps = new Intl.DateTimeFormat(nl ? 'nl-NL' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const staleAfterHours = 36;
  const isStale = (at: Date | null | undefined) =>
    !at || Date.now() - at.getTime() > staleAfterHours * 60 * 60 * 1000;

  return (
    <>
      <PageHeading
        title={nl ? 'Automatische taken' : 'Scheduled jobs'}
        description={
          nl
            ? 'Elke taak is veilig om twee keer te draaien, dus een overlappende cron kost niets. Een externe planner roept één endpoint aan; daar hoeft geen worker of wachtrij bij.'
            : 'Every job is safe to run twice, so an overlapping cron costs nothing. An external scheduler calls one endpoint; no worker or queue required.'
        }
      />

      <Notice tone={env.JOB_RUNNER_TOKEN ? 'neutral' : 'warn'}>
        {env.JOB_RUNNER_TOKEN ? (
          nl ? (
            <>
              De planner post naar <code>/api/jobs/run</code> met{' '}
              <code>authorization: Bearer &lt;JOB_RUNNER_TOKEN&gt;</code>. Zonder <code>job</code>{' '}
              in de body draaien ze allemaal.
            </>
          ) : (
            <>
              The scheduler posts to <code>/api/jobs/run</code> with{' '}
              <code>authorization: Bearer &lt;JOB_RUNNER_TOKEN&gt;</code>. With no <code>job</code>{' '}
              in the body, every job runs.
            </>
          )
        ) : nl ? (
          'JOB_RUNNER_TOKEN is niet gezet, dus het endpoint weigert alles. De automatisering draait nu niet.'
        ) : (
          'JOB_RUNNER_TOKEN is not set, so the endpoint refuses everything. The automation is not running.'
        )}
      </Notice>

      <ul className="mb-10 grid gap-4 lg:grid-cols-2">
        {status.map(({ definition, lastRun }) => (
          <Card key={definition.name} as="li">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <code className="font-mono text-sm font-bold">{definition.name}</code>
              {lastRun ? (
                <Badge
                  tone={
                    lastRun.status === 'succeeded'
                      ? isStale(lastRun.startedAt)
                        ? 'caution'
                        : 'ok'
                      : lastRun.status === 'failed'
                        ? 'warn'
                        : 'muted'
                  }
                >
                  {lastRun.status}
                </Badge>
              ) : (
                <Badge tone="warn">{nl ? 'nooit gedraaid' : 'never run'}</Badge>
              )}
              <code className="ms-auto text-xs text-[var(--color-ink-soft)]">
                {definition.suggestedSchedule}
              </code>
            </div>

            <p className="text-sm text-[var(--color-ink-soft)]">{definition.description}</p>

            {lastRun ? (
              <>
                <p className="mt-3 text-xs text-[var(--color-ink-soft)]">
                  {nl ? 'Laatst' : 'Last'} {stamps.format(lastRun.startedAt)}
                  {isStale(lastRun.startedAt) ? (
                    <span className="ms-2 font-semibold text-[var(--color-warn-ink)]">
                      {nl ? '— langer dan verwacht geleden' : '— longer ago than expected'}
                    </span>
                  ) : null}
                </p>
                {lastRun.error ? (
                  <p className="mt-2 rounded bg-[var(--color-warn-tint)] p-2 text-xs text-[var(--color-warn-ink)]">
                    {lastRun.error}
                  </p>
                ) : (
                  <pre className="mt-2 overflow-x-auto rounded bg-[var(--color-muted-tint)] p-2 text-xs">
                    {JSON.stringify(lastRun.summary, null, 2)}
                  </pre>
                )}
              </>
            ) : null}

            <form action={runJobAction} className="mt-3">
              <input type="hidden" name="job" value={definition.name} />
              <button type="submit" className="wb-button wb-button-secondary">
                {nl ? 'Nu draaien' : 'Run now'}
              </button>
            </form>
          </Card>
        ))}
      </ul>

      <section aria-labelledby="historie">
        <h2 id="historie" className="mb-3 text-xl font-bold">
          {nl ? 'Laatste runs' : 'Recent runs'}
        </h2>
        <ul className="space-y-1 text-sm">
          {recent.map((run) => (
            <li
              key={run.id}
              className="flex flex-wrap items-center gap-3 border-b border-[var(--color-line)] py-1.5"
            >
              <Badge
                tone={run.status === 'succeeded' ? 'ok' : run.status === 'failed' ? 'warn' : 'muted'}
              >
                {run.status}
              </Badge>
              <code className="font-mono text-xs">{run.job}</code>
              <span className="text-xs text-[var(--color-ink-soft)]">
                {stamps.format(run.startedAt)}
              </span>
              {run.finishedAt ? (
                <span className="text-xs tabular-nums text-[var(--color-ink-soft)]">
                  {run.finishedAt.getTime() - run.startedAt.getTime()} ms
                </span>
              ) : null}
              {run.error ? (
                <span className="text-xs text-[var(--color-warn-ink)]">{run.error.slice(0, 90)}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
