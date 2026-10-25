import { Badge, Card, EmptyState, Notice, PageHeading } from '../../../components/ui.tsx';
import { prisma } from '../../../lib/db.ts';
import { currentActor } from '../../../lib/auth/session.ts';
import { requirePermissionPage } from '../../../lib/auth/guard.ts';
import { can } from '../../../lib/auth/roles.ts';
import { requestTranslator } from '../../../lib/ui/locale.ts';
import { decideVersionAction, publishVersionAction } from '../../../server/actions/studio.ts';

const ERRORS: Record<string, [string, string]> = {
  selfApproval: [
    'Je kunt je eigen concept niet goedkeuren. Vraag een collega.',
    'You cannot approve your own draft. Ask a colleague.',
  ],
  noHumanApproval: [
    'Publiceren kan alleen na een goedkeuring door een ander mens.',
    'Publishing requires an approval by another human first.',
  ],
  notApproved: ['Deze versie is nog niet goedgekeurd.', 'This version has not been approved yet.'],
  notInReview: ['Deze versie staat niet in review.', 'This version is not in review.'],
};

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requirePermissionPage('content.read', '/studio/approvals');
  const actor = await currentActor();
  const { error } = await searchParams;
  const { locale, t } = await requestTranslator();

  const [inReview, approved] = await Promise.all([
    prisma.contentVersion.findMany({
      where: { state: 'IN_REVIEW' },
      include: { createdBy: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.contentVersion.findMany({
      where: { state: 'APPROVED' },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvals: { include: { reviewer: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const mayApprove = can(actor?.roles ?? [], 'content.approve');
  const mayPublish = can(actor?.roles ?? [], 'content.publish');
  const message = error ? ERRORS[error] : undefined;

  return (
    <>
      <PageHeading
        title={t('studio.approvals')}
        description={
          locale === 'nl'
            ? 'Een versie kan alleen gepubliceerd worden door iemand anders dan de auteur. AI-concepten zijn hierop geen uitzondering.'
            : 'A version can only be published by someone other than its author. AI drafts are no exception.'
        }
      />
      {message ? <Notice tone="warn">{locale === 'nl' ? message[0] : message[1]}</Notice> : null}

      <h2 className="mb-3 text-xl font-bold">
        {locale === 'nl' ? 'In review' : 'In review'} ({inReview.length})
      </h2>
      {inReview.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <ul className="mb-8 space-y-3">
          {inReview.map((version) => (
            <Card key={version.id} as="li">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge>{version.entityType}</Badge>
                <span className="font-mono text-xs">{version.entityId}</span>
                <span>v{version.version}</span>
                {version.source === 'AI_DRAFT' ? (
                  <Badge tone="caution">AI · {version.aiModel ?? version.aiProvider}</Badge>
                ) : null}
                <span className="text-sm text-[var(--color-ink-soft)]">
                  {version.createdBy.displayName}
                </span>
              </div>
              {version.notes ? <p className="mb-3 text-sm">{version.notes}</p> : null}

              {mayApprove ? (
                version.createdById === actor?.id ? (
                  <p className="text-sm text-[var(--color-warn-ink)]">
                    {locale === 'nl'
                      ? 'Je bent zelf de auteur — een collega moet dit beoordelen.'
                      : 'You are the author — a colleague has to review this.'}
                  </p>
                ) : (
                  <form action={decideVersionAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="versionId" value={version.id} />
                    <div className="min-w-56 flex-1">
                      <label className="wb-label" htmlFor={`comment-${version.id}`}>
                        {locale === 'nl' ? 'Opmerking' : 'Comment'}
                      </label>
                      <input id={`comment-${version.id}`} name="comment" className="wb-input" />
                    </div>
                    <button
                      type="submit"
                      name="decision"
                      value="APPROVED"
                      className="wb-button wb-button-primary"
                    >
                      {t('studio.approve')}
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="REJECTED"
                      className="wb-button wb-button-secondary"
                    >
                      {t('studio.reject')}
                    </button>
                  </form>
                )
              ) : (
                <p className="text-sm text-[var(--color-ink-soft)]">
                  {locale === 'nl'
                    ? 'Alleen een goedkeurder kan hierover beslissen.'
                    : 'Only an approver can decide on this.'}
                </p>
              )}
            </Card>
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-xl font-bold">
        {locale === 'nl' ? 'Goedgekeurd, klaar om te publiceren' : 'Approved, ready to publish'} (
        {approved.length})
      </h2>
      {approved.length === 0 ? (
        <EmptyState>{t('common.none')}</EmptyState>
      ) : (
        <ul className="space-y-3">
          {approved.map((version) => (
            <Card key={version.id} as="li">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="ok">APPROVED</Badge>
                <span className="font-mono text-xs">{version.entityId}</span>
                <span>v{version.version}</span>
                <span className="text-sm text-[var(--color-ink-soft)]">
                  {version.approvals
                    .map((approval) => approval.reviewer.displayName)
                    .join(', ')}
                </span>
              </div>
              {mayPublish ? (
                <form action={publishVersionAction}>
                  <input type="hidden" name="versionId" value={version.id} />
                  <button type="submit" className="wb-button wb-button-primary">
                    {t('studio.publish')}
                  </button>
                </form>
              ) : null}
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
