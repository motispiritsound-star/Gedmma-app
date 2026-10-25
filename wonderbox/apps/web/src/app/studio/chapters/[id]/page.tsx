import { notFound } from 'next/navigation';
import { Badge, Card, Notice, PageHeading } from '../../../../components/ui.tsx';
import { prisma } from '../../../../lib/db.ts';
import { requirePermissionPage } from '../../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../../lib/ui/locale.ts';
import { missingLocales, text, toLocalised } from '../../../../lib/i18n/localised.ts';
import { publishedChapterVersion, versionsFor } from '../../../../server/content.ts';
import { saveNodeTextAction, submitVersionAction } from '../../../../server/actions/studio.ts';

/**
 * The chapter editor.
 *
 * The node list doubles as the graph view: every node shows where each of its
 * choices leads, which is enough to spot a dead end or an unreachable branch
 * without drawing an actual diagram.
 */
export default async function ChapterEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage('content.read', '/studio');
  const { id } = await params;
  const { locale, t } = await requestTranslator();

  const chapter = await prisma.chapter.findUnique({
    where: { id },
    include: {
      journey: { include: { boxProduct: { include: { translations: true } } } },
      experiments: true,
      nodes: {
        orderBy: { orderIndex: 'asc' },
        include: {
          choices: { orderBy: { orderIndex: 'asc' }, include: { target: { select: { key: true } } } },
          audioAssets: { select: { locale: true, durationMs: true } },
          safetyInstruction: true,
        },
      },
    },
  });
  if (!chapter) notFound();

  const [versions, liveVersion] = await Promise.all([
    versionsFor('Chapter', chapter.id),
    publishedChapterVersion(chapter.id),
  ]);

  const reachable = new Set<string>([chapter.entryNodeKey]);
  for (const node of chapter.nodes) {
    for (const choice of node.choices) {
      if (choice.target?.key) reachable.add(choice.target.key);
    }
  }
  const orphans = chapter.nodes.filter((node) => !reachable.has(node.key));
  const latestDraft = versions.find((version) => version.state === 'DRAFT');

  return (
    <>
      <PageHeading
        title={text(chapter.title, locale, chapter.key)}
        description={
          chapter.journey.boxProduct.translations.find((entry) => entry.locale === locale)?.name ??
          chapter.journey.boxProduct.sku
        }
        action={
          liveVersion ? (
            <Badge tone="ok">
              {t('studio.version')} {liveVersion} · live
            </Badge>
          ) : (
            <Badge tone="caution">{locale === 'nl' ? 'Niet gepubliceerd' : 'Not published'}</Badge>
          )
        }
      />

      {orphans.length > 0 ? (
        <Notice tone="warn" title={locale === 'nl' ? 'Onbereikbare nodes' : 'Unreachable nodes'}>
          {orphans.map((node) => node.key).join(', ')} —{' '}
          {locale === 'nl'
            ? 'geen enkele keuze wijst hierheen, dus een kind komt hier nooit.'
            : 'no choice points here, so a child will never reach it.'}
        </Notice>
      ) : null}

      {latestDraft ? (
        <Notice>
          <form action={submitVersionAction} className="flex items-center gap-3">
            <input type="hidden" name="versionId" value={latestDraft.id} />
            <span>
              {t('studio.version')} {latestDraft.version} · {latestDraft.state}
            </span>
            <button type="submit" className="wb-button wb-button-primary">
              {t('studio.submit')}
            </button>
          </form>
        </Notice>
      ) : null}

      <ol className="space-y-4">
        {chapter.nodes.map((node) => {
          const copy = toLocalised(node.text);
          const gaps = missingLocales(node.text);
          const audioLocales = node.audioAssets.map((asset) => asset.locale);
          return (
            <Card key={node.id} as="li">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <code className="rounded bg-[oklch(95%_0.005_260)] px-2 py-0.5 text-xs font-bold">
                  {node.key}
                </code>
                <Badge tone="muted">{node.kind}</Badge>
                {node.key === chapter.entryNodeKey ? <Badge>entry</Badge> : null}
                {node.isTerminal ? <Badge tone="ok">terminal</Badge> : null}
                {node.safetyInstruction ? (
                  <Badge tone="warn">{node.safetyInstruction.code}</Badge>
                ) : null}
                {gaps.length > 0 ? (
                  <Badge tone="caution">
                    {t('studio.translationGaps')}: {gaps.join(', ')}
                  </Badge>
                ) : null}
                <span className="text-xs text-[var(--color-ink-soft)]">
                  audio: {audioLocales.length > 0 ? audioLocales.join(', ') : '—'}
                </span>
              </div>

              <form action={saveNodeTextAction} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="nodeId" value={node.id} />
                <div>
                  <label className="wb-label" htmlFor={`nl-${node.id}`}>
                    Nederlands
                  </label>
                  <textarea
                    id={`nl-${node.id}`}
                    name="nl"
                    rows={4}
                    defaultValue={copy.nl ?? ''}
                    className="wb-input font-normal"
                  />
                </div>
                <div>
                  <label className="wb-label" htmlFor={`en-${node.id}`}>
                    English
                  </label>
                  <textarea
                    id={`en-${node.id}`}
                    name="en"
                    rows={4}
                    defaultValue={copy.en ?? ''}
                    className="wb-input font-normal"
                  />
                </div>
                <div className="flex items-end gap-3 sm:col-span-2">
                  <div className="w-40">
                    <label className="wb-label" htmlFor={`pause-${node.id}`}>
                      {locale === 'nl' ? 'Pauze (seconden)' : 'Pause (seconds)'}
                    </label>
                    <input
                      id={`pause-${node.id}`}
                      name="pauseSeconds"
                      type="number"
                      min={0}
                      max={300}
                      defaultValue={node.pauseSeconds ?? 0}
                      className="wb-input"
                    />
                  </div>
                  <button type="submit" className="wb-button wb-button-secondary">
                    {t('common.save')}
                  </button>
                </div>
              </form>

              {node.choices.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-line)] pt-3 text-xs">
                  {node.choices.map((choice) => (
                    <li
                      key={choice.id}
                      className="rounded-full bg-[oklch(96%_0.005_260)] px-2.5 py-1"
                    >
                      <strong>{text(choice.label, locale, choice.key)}</strong>{' '}
                      <span aria-hidden="true">→</span>{' '}
                      {choice.isRepeat
                        ? locale === 'nl'
                          ? 'zelfde node'
                          : 'same node'
                        : choice.isSlower
                          ? locale === 'nl'
                            ? 'zelfde node, langzamer'
                            : 'same node, slower'
                          : (choice.target?.key ??
                            (locale === 'nl' ? 'einde hoofdstuk' : 'end of chapter'))}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          );
        })}
      </ol>

      <section className="mt-8" aria-labelledby="versions">
        <h2 id="versions" className="mb-3 text-xl font-bold">
          {t('studio.version')}
        </h2>
        <ul className="space-y-1 text-sm">
          {versions.map((version) => (
            <li key={version.id} className="flex flex-wrap items-center gap-2">
              <Badge tone={version.state === 'PUBLISHED' ? 'ok' : 'muted'}>{version.state}</Badge>
              <span>v{version.version}</span>
              <span className="text-[var(--color-ink-soft)]">{version.createdBy}</span>
              {version.source === 'AI_DRAFT' ? <Badge tone="caution">AI draft</Badge> : null}
              <span className="text-[var(--color-ink-soft)]">
                {version.approvals} {locale === 'nl' ? 'goedkeuring(en)' : 'approval(s)'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
