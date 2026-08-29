import type { Locale } from '@/lib/i18n';

export interface MapPoint {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  href: string;
}

/**
 * Offline map. Renders the approximate coordinates as an SVG scatter plot over
 * a bounding box, so discovery works with no tile server, no API key and no
 * third-party request carrying the viewer's IP address. Swap for a tile map by
 * feeding geoProvider().tileUrl() into a client component.
 */
export function StaticMap({ points, locale, caption }: { points: MapPoint[]; locale: Locale; caption: string }) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-500">{locale === 'nl' ? 'Geen locaties om te tonen.' : 'No locations to show.'}</p>;
  }

  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const pad = 0.01;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLon = Math.min(...lons) - pad;
  const maxLon = Math.max(...lons) + pad;

  const width = 640;
  const height = 420;
  const x = (lon: number) => ((lon - minLon) / (maxLon - minLon || 1)) * width;
  const y = (lat: number) => height - ((lat - minLat) / (maxLat - minLat || 1)) * height;

  return (
    <figure className="card overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full bg-slate-100"
        role="img"
        aria-label={caption}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />
        {points.map((point) => (
          <g key={point.id}>
            {/* The halo is a reminder that the position is approximate. */}
            <circle cx={x(point.longitude)} cy={y(point.latitude)} r={18} fill="#2f6feb" opacity={0.12} />
            <circle cx={x(point.longitude)} cy={y(point.latitude)} r={6} fill="#1f56c4" />
          </g>
        ))}
      </svg>
      <figcaption className="border-t border-slate-200 px-4 py-3 text-xs text-slate-600">{caption}</figcaption>
      <ol className="max-h-56 divide-y divide-slate-100 overflow-y-auto text-sm">
        {points.map((point) => (
          <li key={point.id} className="px-4 py-2">
            <a className="text-brand-700 hover:underline" href={point.href}>
              {point.title}
            </a>
          </li>
        ))}
      </ol>
    </figure>
  );
}
