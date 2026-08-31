import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { CategoryIcon, IconClock, IconLock, IconShield, IconUsers } from '@/components/ui/Icons'
import { QuestIllustration } from '@/components/QuestIllustration'
import { fill, type Dictionary, type Locale } from '@/modules/localisation'
import { formatDuration } from '@/modules/localisation/format'
import { ageRangeLabel, difficultyLabel, settingLabel } from '@/modules/quests/labels'
import type { QuestCardView } from '@/modules/quests/types'

/**
 * The quest card. Everything a family needs to decide "is this one for us?"
 * without opening it: age band, time, category, difficulty, where, how many
 * people, skills, and whether an adult has to be involved.
 */
export function QuestCard({
  quest,
  locale,
  d,
  reasons,
  footer,
}: {
  quest: QuestCardView
  locale: Locale
  d: Dictionary
  reasons?: string[]
  footer?: React.ReactNode
}) {
  return (
    <article className="q-card group flex h-full flex-col overflow-hidden transition hover:shadow-[var(--shadow-lifted)]">
      <QuestIllustration
        imageKey={quest.imageKey}
        colorToken={quest.category.colorToken}
        icon={quest.category.icon}
      />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="moss" icon={<CategoryIcon icon={quest.category.icon} size={14} />}>
            {quest.category.name}
          </Badge>
          {quest.isPremium ? (
            <Badge tone="sun" icon={<IconLock size={13} />}>
              {d.common.premium}
            </Badge>
          ) : (
            <Badge tone="neutral">{d.common.free}</Badge>
          )}
          {quest.locked ? (
            <Badge tone="ember" icon={<IconLock size={13} />}>
              {d.quest.premiumOnly}
            </Badge>
          ) : null}
        </div>

        <h3 className="text-lg leading-snug font-semibold">
          <Link
            href={`/quests/${quest.slug}`}
            aria-label={fill(d.a11y.openQuest, { title: quest.title })}
            className="after:absolute after:inset-0 after:content-[''] hover:text-moss-700"
          >
            {quest.title}
          </Link>
        </h3>

        <p className="text-sm text-ink-soft">{quest.shortDescription}</p>

        <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 pt-2 text-sm text-ink-soft">
          <div className="flex items-center gap-1.5">
            <IconClock size={16} aria-hidden="true" />
            <dt className="q-visually-hidden">{d.quest.duration}</dt>
            <dd>{formatDuration(quest.durationMinutes, locale)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <IconUsers size={16} aria-hidden="true" />
            <dt className="q-visually-hidden">{d.quest.participants}</dt>
            <dd>
              {quest.minParticipants}
              {quest.maxParticipants > quest.minParticipants ? `-${quest.maxParticipants}` : ''}{' '}
              {d.quest.people}
            </dd>
          </div>
          <div>
            <dt className="q-visually-hidden">{d.quest.ageBand}</dt>
            <dd>{ageRangeLabel(quest.ageBands, locale)}</dd>
          </div>
          <div>
            <dt className="q-visually-hidden">{d.quest.difficulty}</dt>
            <dd>{difficultyLabel(quest.difficulty, locale)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="q-visually-hidden">{d.quest.setting}</dt>
            <dd>{settingLabel(quest.setting, locale)}</dd>
          </div>
        </dl>

        {quest.requiresAdult || quest.hasSafetyWarnings ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-ember-700">
            <IconShield size={15} aria-hidden="true" />
            {quest.requiresAdult ? d.quest.safetyAdult : d.quest.safety}
          </p>
        ) : null}

        {reasons?.length ? (
          <div className="relative z-10 rounded-xl bg-moss-50 p-3">
            <p className="text-xs font-semibold tracking-wide text-moss-700 uppercase">
              {d.home.whyRecommended}
            </p>
            <ul className="mt-1 space-y-0.5 text-sm text-moss-700">
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {footer ? <div className="relative z-10 pt-1">{footer}</div> : null}
      </div>
    </article>
  )
}
