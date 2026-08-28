/**
 * Inline SVG, so the site loads no icon font and no external request. The keys
 * match the Ionicons names the app stores against each trade, and anything
 * unmapped falls back to a generic tool.
 */
const paths: Record<string, string> = {
  'color-palette-outline': 'M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 1.4-3.4 2 2 0 0 1 1.4-3.4H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z M7.5 12.5h.01 M9.5 8.5h.01 M14 7.5h.01 M17 10.5h.01',
  'water-outline': 'M12 3s6 6.4 6 10.5A6 6 0 0 1 6 13.5C6 9.4 12 3 12 3Z',
  'flash-outline': 'M13 2 4 14h6l-1 8 9-12h-6l1-8Z',
  'hammer-outline': 'm14 6 4 4M3 21l7-7M12.5 4.5 19 11l2-2-6.5-6.5-2 2ZM10.5 9.5 5 15l4 4 5.5-5.5',
  'business-outline': 'M4 21V7l8-4 8 4v14M4 21h16M9 21v-5h6v5M8 11h.01M12 11h.01M16 11h.01',
  'snow-outline': 'M12 2v20M4.5 6.5 19.5 17.5M19.5 6.5 4.5 17.5M12 6l-2.5-2.5M12 6l2.5-2.5M12 18l-2.5 2.5M12 18l2.5 2.5',
  'grid-outline': 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  'layers-outline': 'm12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17l9 5 9-5',
  'umbrella-outline': 'M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9ZM12 12v7a2.5 2.5 0 0 0 5 0',
  'sparkles-outline': 'm12 3 1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  'cube-outline': 'm12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10',
  'leaf-outline': 'M20 4C10 4 4 9 4 16a4 4 0 0 0 4 4c7 0 12-6 12-16ZM4 20 14 10',
  'cog-outline': 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.3a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-3-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.2-3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 3 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z',
  'key-outline': 'M14.5 3a6.5 6.5 0 1 0-3.1 12.2L10 17H8v2H6v2H3v-3l7.8-7.8A6.5 6.5 0 0 0 14.5 3ZM16 7h.01',
  'sunny-outline': 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  'pencil-outline': 'M15 4.5 19.5 9 8 20.5H3.5V16L15 4.5Z',
  'laptop-outline': 'M4 5h16v11H4zM2 20h20M9 20l1-4M15 20l-1-4',
  'balloon-outline': 'M12 3a5 5 0 0 1 5 5c0 3.5-2.5 6.5-5 7-2.5-.5-5-3.5-5-7a5 5 0 0 1 5-5ZM12 15v3M10.5 21c0-1 3-1 3-3',
  'school-outline': 'm12 4 10 5-10 5L2 9l10-5ZM6 11.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5',
  'construct-outline': 'm14 6 4 4M3 21l7-7M12.5 4.5 19 11l2-2-6.5-6.5-2 2ZM10.5 9.5 5 15l4 4 5.5-5.5',
  'shield-check': 'M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Zm-1.2 12L8 12.2l1.4-1.4 1.4 1.4 3.8-3.8L16 9.8 10.8 15Z',
  'star': 'm12 3 2.7 5.8 6.3.8-4.7 4.4 1.2 6.3L12 17.3 6.5 20.3l1.2-6.3L3 9.6l6.3-.8L12 3Z',
  check: 'm5 12 5 5 9-11',
  arrow: 'M5 12h14M13 6l6 6-6 6',
};

export function icon(name: string, size = 22): string {
  const d = paths[name] ?? paths['construct-outline']!;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}

/** Filled marks read better at small sizes than a stroked outline. */
export function solidIcon(name: 'shield-check' | 'star' | 'check', size = 18): string {
  const d = paths[name]!;
  const filled = name !== 'check';
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" ${
    filled ? 'fill="currentColor" stroke="none"' : 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"'
  } aria-hidden="true"><path d="${d}"/></svg>`;
}
