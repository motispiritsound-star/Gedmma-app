import { cn } from '@/lib/cn'

/**
 * Child avatars. Eight friendly animals, drawn inline so nothing is fetched and
 * no image of a real child is ever needed. The nickname is rendered next to the
 * avatar everywhere it appears, so the drawing is decorative.
 */

const PALETTE: Record<string, { bg: string; fg: string }> = {
  fox: { bg: '#F6E0CE', fg: '#A2530F' },
  owl: { bg: '#E3E9F2', fg: '#2C4760' },
  otter: { bg: '#DCEBE4', fg: '#175A4A' },
  hedgehog: { bg: '#F3E3D2', fg: '#7D3F0B' },
  badger: { bg: '#E7E4E0', fg: '#3A3A38' },
  heron: { bg: '#DDE9F0', fg: '#2C5566' },
  squirrel: { bg: '#F7E2DC', fg: '#8A2F49' },
  deer: { bg: '#EFE6D4', fg: '#6B5312' },
}

const GLYPHS: Record<string, string> = {
  fox: 'M12 5.5 8 3.2l.6 4.1A7 7 0 0 0 5 13.3C5 17 8.1 19.8 12 19.8s7-2.8 7-6.5a7 7 0 0 0-3.6-6l.6-4.1z',
  owl: 'M6 8.5a6 6 0 0 1 12 0v5a6 6 0 0 1-12 0zM4.5 5.5 7 8M19.5 5.5 17 8',
  otter: 'M12 4.2c3.8 0 6.5 3 6.5 7s-2.7 8.6-6.5 8.6S5.5 15.2 5.5 11.2s2.7-7 6.5-7zM9 6.2 7.6 4M15 6.2 16.4 4',
  hedgehog: 'M4.5 16.5c0-4.6 3.4-8 7.5-8s7.5 3.4 7.5 8zM12 8.5 10.5 4M16 10 17.5 5.6M8 10 6.5 5.6',
  badger: 'M5.5 10a6.5 6.5 0 0 1 13 0v3.5a6.5 6.5 0 0 1-13 0zM12 4.5v10',
  heron: 'M13.5 4.2a2.4 2.4 0 1 1-2.6 3.9L10 13l-4.5 6.5M11 8.2 20 6.6M10 13c3.6 0 6.5 2.6 6.5 6.5',
  squirrel: 'M9 19.5c-3 0-5-2.3-5-5.5S6.4 8 9.6 8h3.2M13 8.2A4.2 4.2 0 1 1 9 4M13 8c4 1 6 4.5 6 8.5 0 1.5-.4 2.6-1.2 3',
  deer: 'M12 9.5a5 5 0 0 1 5 5v5H7v-5a5 5 0 0 1 5-5zM9 8 6.5 4.5 4 5.5M15 8l2.5-3.5L20 5.5',
}

export function Avatar({
  avatarKey,
  size = 40,
  className,
}: {
  avatarKey: string
  size?: number
  className?: string
}) {
  const palette = PALETTE[avatarKey] ?? PALETTE.fox!
  const glyph = GLYPHS[avatarKey] ?? GLYPHS.fox!
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full', className)}
      style={{ width: size, height: size, backgroundColor: palette.bg }}
    >
      <svg
        width={size * 0.62}
        height={size * 0.62}
        viewBox="0 0 24 24"
        fill="none"
        stroke={palette.fg}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d={glyph} />
      </svg>
    </span>
  )
}

export const AVATAR_LABELS: Record<string, { en: string; nl: string }> = {
  fox: { en: 'Fox', nl: 'Vos' },
  owl: { en: 'Owl', nl: 'Uil' },
  otter: { en: 'Otter', nl: 'Otter' },
  hedgehog: { en: 'Hedgehog', nl: 'Egel' },
  badger: { en: 'Badger', nl: 'Das' },
  heron: { en: 'Heron', nl: 'Reiger' },
  squirrel: { en: 'Squirrel', nl: 'Eekhoorn' },
  deer: { en: 'Deer', nl: 'Hert' },
}
