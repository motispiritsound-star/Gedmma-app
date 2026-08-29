import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
}) {
  return <Tag className={cn('q-card p-6', className)}>{children}</Tag>
}

export function CardHeader({
  title,
  description,
  action,
  id,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  id?: string
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id={id} className="text-xl font-semibold">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
