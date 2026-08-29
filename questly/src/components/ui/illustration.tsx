const CATEGORY_PALETTE: Record<string, { sky: string; land: string; motif: string }> = {
  nature: { sky: "#dff0e2", land: "#2f6b3c", motif: "#7fb98a" },
  science: { sky: "#e2edf6", land: "#2b5d8a", motif: "#82b3d8" },
  movement: { sky: "#fbe9dc", land: "#a8481c", motif: "#e0a179" },
  creativity: { sky: "#f0e6f3", land: "#7a3f86", motif: "#c096ca" },
  cooking: { sky: "#f8ecd9", land: "#96551a", motif: "#d9a86a" },
  practical: { sky: "#e9ecf1", land: "#4a5568", motif: "#98a3b3" },
  entrepreneurship: { sky: "#dff0ef", land: "#1f6a6a", motif: "#79bab7" },
  family: { sky: "#f8e5eb", land: "#a13d5c", motif: "#d992a8" },
  community: { sky: "#e0eff0", land: "#2d6a72", motif: "#86bcc1" },
  history: { sky: "#f5eddb", land: "#79571f", motif: "#c3a768" },
};

const FALLBACK = { sky: "#e7 efe9".replace(" ", ""), land: "#14574a", motif: "#7fada3" };

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Generated cover art. Every quest gets a distinct, calm scene derived from its
 * slug, which keeps the library visually varied without shipping - or hotlinking -
 * a single bitmap. Decorative, so it is hidden from assistive technology.
 */
export function QuestIllustration({
  slug,
  categorySlug,
  className = "",
}: {
  slug: string;
  categorySlug: string;
  className?: string;
}) {
  const palette = CATEGORY_PALETTE[categorySlug] ?? FALLBACK;
  const seed = hash(slug);
  const hillOffset = (seed % 40) - 20;
  const sunX = 60 + (seed % 180);
  const treeCount = 3 + (seed % 4);

  return (
    <svg
      viewBox="0 0 320 180"
      className={className}
      role="presentation"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="320" height="180" fill={palette.sky} />
      <circle cx={sunX} cy={44} r={22} fill={palette.motif} opacity="0.55" />
      <path
        d={`M0 ${132 + hillOffset / 2} Q 80 ${96 + hillOffset} 160 ${126 + hillOffset / 3} T 320 ${118 - hillOffset / 2} V180 H0 Z`}
        fill={palette.motif}
        opacity="0.55"
      />
      <path
        d={`M0 ${150 - hillOffset / 3} Q 100 ${124 - hillOffset} 200 ${148 + hillOffset / 4} T 320 ${140} V180 H0 Z`}
        fill={palette.land}
      />
      {Array.from({ length: treeCount }).map((_, index) => {
        const x = 30 + ((seed >> (index * 3)) % 260);
        const height = 20 + ((seed >> index) % 18);
        return (
          <g key={index} transform={`translate(${x} ${152 - height})`}>
            <rect x="-2" y={height - 6} width="4" height="8" fill={palette.land} opacity="0.8" />
            <path d={`M0 0 L${height / 2} ${height} L${-height / 2} ${height} Z`} fill={palette.land} opacity="0.9" />
          </g>
        );
      })}
    </svg>
  );
}

const AVATAR_EMOJI: Record<string, string> = {
  fox: "🦊",
  owl: "🦉",
  otter: "🦦",
  bear: "🐻",
  hedgehog: "🦔",
  heron: "🪶",
  beetle: "🐞",
  seal: "🦭",
};

export function Avatar({ avatarKey, nickname, size = 40 }: { avatarKey: string; nickname: string; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-brand-soft)]"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      role="img"
      aria-label={nickname}
    >
      <span aria-hidden="true">{AVATAR_EMOJI[avatarKey] ?? "🧭"}</span>
    </span>
  );
}

export const CATEGORY_EMOJI: Record<string, string> = {
  nature: "🌿",
  science: "🔬",
  movement: "🏃",
  creativity: "🎨",
  cooking: "🍳",
  practical: "🔧",
  entrepreneurship: "💡",
  family: "🏡",
  community: "🤝",
  history: "🏛️",
};
