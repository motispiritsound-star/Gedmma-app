import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CompanionPlayer } from '../../../../components/companion-player.tsx';
import { prisma } from '../../../../lib/db.ts';
import { requireFamilyPage } from '../../../../lib/auth/guard.ts';
import { requestTranslator } from '../../../../lib/ui/locale.ts';
import { requireBoxOwnership } from '../../../../server/activation.ts';
import { publishedChapterVersion } from '../../../../server/content.ts';
import { resumePoint } from '../../../../server/progress.ts';

export default async function ChapterPlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ boxId: string; chapterId: string }>;
  searchParams: Promise<{ child?: string }>;
}) {
  const { boxId, chapterId } = await params;
  const { child } = await searchParams;
  const actor = await requireFamilyPage('/play');
  const { locale, t } = await requestTranslator();

  const box = await requireBoxOwnership(boxId, actor.familyId);
  if (!box) notFound();

  // Same gate as the API. A chapter without a published version does not exist
  // as far as a child is concerned.
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, journey: { boxProductId: box.boxProductId } },
    select: { id: true },
  });
  if (!chapter) notFound();
  if ((await publishedChapterVersion(chapterId)) === null) notFound();

  const childProfile = child
    ? await prisma.childProfile.findFirst({
        where: { id: child, familyId: actor.familyId },
      })
    : await prisma.childProfile.findFirst({
        where: { familyId: actor.familyId },
        orderBy: { createdAt: 'asc' },
      });

  const accessibility = (childProfile?.accessibility ?? {}) as {
    narrationSpeed?: string;
    extraPauseSeconds?: number;
  };

  const resume = await resumePoint(box.id);
  const initialNodeId = resume?.chapterId === chapterId ? resume.nodeId : null;

  return (
    <>
      <p className="mb-4">
        <Link href={`/play/${box.id}`} className="text-sm underline">
          ← {t('play.chapters')}
        </Link>
      </p>
      <CompanionPlayer
        activatedBoxId={box.id}
        chapterId={chapterId}
        locale={locale}
        childProfileId={childProfile?.id ?? null}
        initialNodeId={initialNodeId}
        defaultSlow={accessibility.narrationSpeed === 'slow'}
        extraPauseSeconds={accessibility.extraPauseSeconds ?? 0}
        copy={{
          play: t('play.play'),
          pause: t('play.pause'),
          repeat: t('play.repeat'),
          slower: t('play.slower'),
          download: t('play.download'),
          downloaded: t('play.downloaded'),
          offline: t('play.offline'),
          chapterDone: t('play.chapterDone'),
          loading: t('common.loading'),
          error: t('common.error'),
          resume: t('play.resume'),
          back: t('common.back'),
        }}
      />
    </>
  );
}
