import { CategoryIcon } from '@/components/ui/Icons'

/**
 * Quests ship without photography. Instead every quest gets a generated
 * landscape built from its category colour and a deterministic hash of its
 * image key, so the library looks varied without a single network request or a
 * stock photo licence.
 */

const GRADIENTS: Record<string, [string, string, string]> = {
  moss: ['#dff0e7', '#a9d3c2', '#1f6f5c'],
  ember: ['#fbe6d2', '#f0a765', '#a2530f'],
  dusk: ['#e2ebf4', '#8fa9c4', '#2c4760'],
  berry: ['#f7e2e9', '#dda3b6', '#8a2f49'],
  sun: ['#fbf0cf', '#e6c766', '#8f6a06'],
}

function hash(value: string): number {
  let total = 0
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) % 100000
  }
  return total
}

export function QuestIllustration({
  imageKey,
  colorToken,
  icon,
  height = 132,
}: {
  imageKey: string
  colorToken: string
  icon: string
  height?: number
}) {
  const [light, mid, dark] = GRADIENTS[colorToken] ?? GRADIENTS.moss!
  const seed = hash(imageKey)
  const peak = 30 + (seed % 25)
  const second = 45 + ((seed >> 3) % 20)
  const sunX = 20 + (seed % 60)

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 240 100" preserveAspectRatio="none" className="h-full w-full">
        <rect width="240" height="100" fill={light} />
        <circle cx={sunX * 2.4} cy="26" r="13" fill={mid} opacity="0.55" />
        <path d={`M0 100 L0 ${100 - second} L60 ${100 - peak} L110 ${100 - second} L165 ${100 - peak - 8} L240 ${100 - second + 6} L240 100 Z`} fill={mid} opacity="0.75" />
        <path d={`M0 100 L0 ${100 - second / 2} L70 ${100 - peak / 1.6} L140 ${100 - second / 1.7} L200 ${100 - peak / 2} L240 ${100 - second / 2.2} L240 100 Z`} fill={dark} opacity="0.85" />
      </svg>
      <span
        className="absolute right-4 bottom-3 flex size-10 items-center justify-center rounded-full bg-paper-raised/90 shadow-sm"
        style={{ color: dark }}
      >
        <CategoryIcon icon={icon} size={22} />
      </span>
    </div>
  )
}
