import Link from 'next/link'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition ' +
  'duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:cursor-not-allowed disabled:opacity-55 ' +
  'text-center no-underline'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-moss-600 text-white hover:bg-moss-700 active:bg-moss-900 shadow-sm',
  secondary:
    'bg-paper-raised text-ink border border-line-strong hover:border-moss-500 hover:text-moss-700',
  ghost: 'bg-transparent text-moss-700 hover:bg-moss-50',
  danger: 'bg-danger-500 text-white hover:bg-danger-600',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-[0.95rem]',
  lg: 'px-7 py-3.5 text-lg',
}

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
    />
  )
}

/** Shared class list, so a plain `<a>` can be styled as a button when needed. */
export function buttonClassName(
  variant: Variant = 'primary',
  size: Size = 'md',
  fullWidth = false,
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)
}

export type ButtonLinkProps = {
  href: string
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  className?: string
  children: ReactNode
  'aria-label'?: string
  prefetch?: boolean
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      {...rest}
      className={cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
    >
      {children}
    </Link>
  )
}
