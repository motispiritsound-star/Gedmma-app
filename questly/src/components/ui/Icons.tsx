import type { SVGProps } from 'react'

/**
 * Inline icon set. Every icon is decorative by default (`aria-hidden`), because
 * the surrounding text always carries the meaning.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconCompass = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5z" />
  </Base>
)

export const IconLeaf = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 20c0-8 5-14 16-15 1 11-5 16-13 16H4z" />
    <path d="M9 15c2-3 5-5 8-6" />
  </Base>
)

export const IconFlask = (props: IconProps) => (
  <Base {...props}>
    <path d="M10 3h4M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3" />
    <path d="M7.5 14h9" />
  </Base>
)

export const IconRun = (props: IconProps) => (
  <Base {...props}>
    <circle cx="15" cy="4.5" r="1.8" />
    <path d="M13 20l-1.5-5L8 12l1-5 4 1.5 2 2.5 3 .8" />
    <path d="M8 12l-3 2M11.5 15L9 20" />
  </Base>
)

export const IconBrush = (props: IconProps) => (
  <Base {...props}>
    <path d="M14 3.5 20.5 10 12 18.5H5.5V12z" />
    <path d="M9 15.5 3.5 21" />
  </Base>
)

export const IconPot = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 9h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
    <path d="M2 9h20M9 5.5c0-1 1-1.5 1.5-2.5M14 5.5c0-1 1-1.5 1.5-2.5" />
  </Base>
)

export const IconTool = (props: IconProps) => (
  <Base {...props}>
    <path d="M14.5 6a3.5 3.5 0 0 1 4.9 4.2L21 12l-2 2-1.8-1.6A3.5 3.5 0 0 1 13 7.5z" />
    <path d="m12.5 9.5-8 8a2.1 2.1 0 0 0 3 3l8-8" />
  </Base>
)

export const IconCoins = (props: IconProps) => (
  <Base {...props}>
    <ellipse cx="12" cy="6.5" rx="7" ry="3" />
    <path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
  </Base>
)

export const IconHeart = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 20s-7-4.4-7-9.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7 2.8C19 15.6 12 20 12 20z" />
  </Base>
)

export const IconHands = (props: IconProps) => (
  <Base {...props}>
    <path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12" />
    <path d="M11 11.5V5a1.5 1.5 0 0 1 3 0v6.5" />
    <path d="M14 12V7.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6H9.5a5 5 0 0 1-4.4-2.6L3 14.5a1.6 1.6 0 0 1 2.6-1.8L8 15" />
  </Base>
)

export const IconScroll = (props: IconProps) => (
  <Base {...props}>
    <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H17a2 2 0 0 1 2 2v12a2.5 2.5 0 0 1-2.5 2.5H7" />
    <path d="M5 5.5V17a2.5 2.5 0 0 0 2.5 2.5M9 8h7M9 12h7M9 16h4" />
  </Base>
)

export const IconClock = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3 1.8" />
  </Base>
)

export const IconUsers = (props: IconProps) => (
  <Base {...props}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 20a5.5 5.5 0 0 0-2.2-4.4" />
  </Base>
)

export const IconShield = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6z" />
    <path d="m9 12 2 2 4-4" />
  </Base>
)

export const IconStar = (props: IconProps) => (
  <Base {...props}>
    <path d="m12 3.8 2.5 5.2 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z" />
  </Base>
)

export const IconCalendar = (props: IconProps) => (
  <Base {...props}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
  </Base>
)

export const IconHome = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10.5V20h12v-9.5" />
  </Base>
)

export const IconBook = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M19 18v3H6.5" />
  </Base>
)

export const IconChart = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 20h16M7 20v-6M12 20V7M17 20v-9" />
  </Base>
)

export const IconSettings = (props: IconProps) => (
  <Base {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.2M12 18.8V21M4.9 7.5l1.9 1.1M17.2 15.4l1.9 1.1M4.9 16.5l1.9-1.1M17.2 8.6l1.9-1.1" />
  </Base>
)

export const IconCheck = (props: IconProps) => (
  <Base {...props}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Base>
)

export const IconWarning = (props: IconProps) => (
  <Base {...props}>
    <path d="M12 4 2.8 20h18.4z" />
    <path d="M12 10v4.5M12 17.5v.01" />
  </Base>
)

export const IconLock = (props: IconProps) => (
  <Base {...props}>
    <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
  </Base>
)

export const IconSpeaker = (props: IconProps) => (
  <Base {...props}>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
    <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Base>
)

export const IconChip = (props: IconProps) => (
  <Base {...props}>
    <rect x="7" y="7" width="10" height="10" rx="2" />
    <path d="M10 3.5v3M14 3.5v3M10 17.5v3M14 17.5v3M3.5 10h3M3.5 14h3M17.5 10h3M17.5 14h3" />
  </Base>
)

export const CATEGORY_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  leaf: IconLeaf,
  flask: IconFlask,
  run: IconRun,
  brush: IconBrush,
  pot: IconPot,
  tool: IconTool,
  coins: IconCoins,
  heart: IconHeart,
  hands: IconHands,
  scroll: IconScroll,
  chip: IconChip,
  compass: IconCompass,
}

export function CategoryIcon({ icon, ...props }: IconProps & { icon: string }) {
  const Component = CATEGORY_ICONS[icon] ?? IconCompass
  return <Component {...props} />
}
