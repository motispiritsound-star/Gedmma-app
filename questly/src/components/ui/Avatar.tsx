import { cn } from '@/lib/cn'

/**
 * Child avatars. Eight animals, drawn inline from simple primitives so nothing
 * is fetched and no photograph of a real child is ever needed.
 *
 * Each animal is built as a filled silhouette with the face punched out in the
 * background colour. Recognition at 28px comes from the silhouette - the ears,
 * the antlers, the beak - not from detail, so every animal has a distinct
 * outline before any face is added.
 */

type Palette = { bg: string; fg: string; soft: string }

const PALETTES: Record<string, Palette> = {
  fox: { bg: '#F6E0CE', fg: '#A2530F', soft: '#F9EFE4' },
  owl: { bg: '#E3E9F2', fg: '#2C4760', soft: '#F1F4F9' },
  otter: { bg: '#DCEBE4', fg: '#175A4A', soft: '#EDF5F1' },
  hedgehog: { bg: '#F3E3D2', fg: '#7D3F0B', soft: '#FAF1E8' },
  badger: { bg: '#E7E4E0', fg: '#3A3A38', soft: '#F5F3F1' },
  heron: { bg: '#DDE9F0', fg: '#2C5566', soft: '#EFF5F8' },
  squirrel: { bg: '#F7E2DC', fg: '#8A2F49', soft: '#FCF0EC' },
  deer: { bg: '#EFE6D4', fg: '#6B5312', soft: '#F8F3E8' },
}

/** Each animal draws itself with `fg` on the disc's `bg`. */
const GLYPHS: Record<string, (p: Palette) => React.JSX.Element> = {
  fox: ({ bg, fg, soft }) => (
    <>
      <path d="M5.2 4.4 9.4 8.6 5.6 10.4Z" fill={fg} />
      <path d="M18.8 4.4 14.6 8.6 18.4 10.4Z" fill={fg} />
      <path d="M12 20.6 6.3 14.2C5.4 12.4 6 9.6 8.2 8.6c1.6-.8 6-.8 7.6 0 2.2 1 2.8 3.8 1.9 5.6Z" fill={fg} />
      <path d="M12 20.6 9.5 17.8c1.6-.7 3.4-.7 5 0Z" fill={soft} />
      <circle cx="9.5" cy="12.4" r="1" fill={bg} />
      <circle cx="14.5" cy="12.4" r="1" fill={bg} />
      <circle cx="12" cy="16.2" r=".85" fill={bg} />
    </>
  ),

  owl: ({ bg, fg }) => (
    <>
      <path d="M6.2 4.2 9.6 7.4 5.9 8.4Z" fill={fg} />
      <path d="M17.8 4.2 14.4 7.4 18.1 8.4Z" fill={fg} />
      <path d="M12 5.6c3.9 0 6.5 3 6.5 7.2S15.9 20.4 12 20.4 5.5 17 5.5 12.8 8.1 5.6 12 5.6Z" fill={fg} />
      <circle cx="9.5" cy="11.6" r="2.2" fill={bg} />
      <circle cx="14.5" cy="11.6" r="2.2" fill={bg} />
      <circle cx="9.5" cy="11.6" r=".95" fill={fg} />
      <circle cx="14.5" cy="11.6" r=".95" fill={fg} />
      <path d="M12 13.4 13.1 15.6h-2.2Z" fill={bg} />
    </>
  ),

  otter: ({ bg, fg }) => (
    <>
      <circle cx="7.6" cy="7.8" r="2.1" fill={fg} />
      <circle cx="16.4" cy="7.8" r="2.1" fill={fg} />
      <path d="M12 6.6c4 0 6.6 2.9 6.6 6.9S16 20.6 12 20.6 5.4 17.5 5.4 13.5 8 6.6 12 6.6Z" fill={fg} />
      <circle cx="9.7" cy="12.1" r=".95" fill={bg} />
      <circle cx="14.3" cy="12.1" r=".95" fill={bg} />
      <ellipse cx="12" cy="16.1" rx="3.1" ry="2.2" fill={bg} />
      <ellipse cx="12" cy="14.9" rx="1.15" ry=".85" fill={fg} />
    </>
  ),

  hedgehog: ({ fg, soft }) => (
    <>
      <path d="M3.6 17.8 5.4 8.2l2 4 1.8-5.4 1.9 4.8 2-5.2 1.9 5.2 1.8-4.4 1.6 4.6 2 3.4Z" fill={fg} />
      <path d="M12.4 18.8c-2.4 0-4.3-1.5-4.3-3.6 0-2 1.9-3.5 4.3-3.5 1.6 0 3 .6 4.7 2.2l2.9 2.7c.4.4.1 1.1-.5 1.1Z" fill={soft} />
      <path d="M18.4 15.9a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" fill={fg} />
      <circle cx="13.4" cy="15" r=".85" fill={fg} />
    </>
  ),

  badger: ({ bg, fg }) => (
    <>
      <path d="M6.4 8.6 8.4 10.9 5.6 11.6Z" fill={fg} />
      <path d="M17.6 8.6 15.6 10.9 18.4 11.6Z" fill={fg} />
      <path d="M12 6.8c3.8 0 6.3 2.9 6.3 6.9S15.8 20.6 12 20.6 5.7 17.7 5.7 13.7 8.2 6.8 12 6.8Z" fill={fg} />
      <path d="M12 6.9c.9 0 1.7.1 2.4.4l-1 12.9c-.9.2-1.9.2-2.8 0l-1-12.9c.7-.3 1.5-.4 2.4-.4Z" fill={bg} />
      <circle cx="9.4" cy="12.6" r=".95" fill={bg} />
      <circle cx="14.6" cy="12.6" r=".95" fill={bg} />
      <ellipse cx="12" cy="17.4" rx="1.15" ry=".9" fill={fg} />
    </>
  ),

  heron: ({ bg, fg }) => (
    <>
      <path d="M11.2 21.4c-.6-3.4-.6-6.2.4-8.4.5-1.1 1.2-2 2-2.7l1.5 1.6c-.7.6-1.2 1.2-1.6 2-.7 1.6-.7 4 0 7.1Z" fill={fg} />
      <path d="M11.9 6.6 6.4 5.2l5.2-.6Z" fill={fg} />
      <path d="M12.4 8.2 7 8.4l5.2-1.6Z" fill={fg} />
      <circle cx="14.2" cy="8.4" r="2.9" fill={fg} />
      <path d="M16.6 7.2 22.4 9.4l-5.8 1.6Z" fill={fg} />
      <circle cx="14.9" cy="7.7" r=".85" fill={bg} />
    </>
  ),

  squirrel: ({ bg, fg, soft }) => (
    <>
      <path d="M16.6 20.8c3.6-.6 5.2-4.6 4-8-1-2.8-3.6-4.2-5.4-3.2-1.5.8-1.7 2.7-.6 3.6.8.7 1.8.4 2.1-.4.5 2.2-.4 4.4-2.6 5.4Z" fill={fg} />
      <path d="M5.6 6.4 8.9 8.6 6.1 10Z" fill={fg} />
      <path d="M12.9 6.2 12 10.1l3-1.5Z" fill={fg} />
      <path d="M9.6 8.4c3.3 0 5.6 2.5 5.6 6.1s-2.3 6.3-5.6 6.3S4 18.1 4 14.5s2.3-6.1 5.6-6.1Z" fill={fg} />
      <circle cx="7.9" cy="13.4" r=".95" fill={bg} />
      <circle cx="12" cy="13.4" r=".95" fill={bg} />
      <ellipse cx="9.9" cy="16.9" rx="2.4" ry="1.8" fill={soft} />
      <ellipse cx="9.9" cy="15.9" rx=".95" ry=".7" fill={fg} />
    </>
  ),

  deer: ({ bg, fg, soft }) => (
    <>
      <path d="M8.7 8.2 6.9 5.9 4.4 5.4l2.2.4.7 1-2.6-.5 1.9 1.4 1.3 1.6Z" fill={fg} />
      <path d="M15.3 8.2 17.1 5.9l2.5-.5-2.2.4-.7 1 2.6-.5-1.9 1.4-1.3 1.6Z" fill={fg} />
      <ellipse cx="5.9" cy="11.5" rx="1.5" ry="2.4" transform="rotate(-24 5.9 11.5)" fill={fg} />
      <ellipse cx="18.1" cy="11.5" rx="1.5" ry="2.4" transform="rotate(24 18.1 11.5)" fill={fg} />
      <path d="M12 7.9c2.7 0 4.4 2 4.4 5.1 0 3.6-1.9 7.6-4.4 7.6s-4.4-4-4.4-7.6c0-3.1 1.7-5.1 4.4-5.1Z" fill={fg} />
      <circle cx="10.1" cy="12.4" r=".95" fill={bg} />
      <circle cx="13.9" cy="12.4" r=".95" fill={bg} />
      <ellipse cx="12" cy="17.6" rx="1.7" ry="1.4" fill={soft} />
      <ellipse cx="12" cy="17" rx=".95" ry=".7" fill={fg} />
    </>
  ),
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
  const palette = PALETTES[avatarKey] ?? PALETTES.fox!
  const draw = GLYPHS[avatarKey] ?? GLYPHS.fox!

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full', className)}
      style={{ width: size, height: size, backgroundColor: palette.bg }}
    >
      <svg
        width={size * 0.78}
        height={size * 0.78}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        {draw(palette)}
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
