import { z } from 'zod';
import { SUPPORTED_LOCALES } from '../locales.js';

export const localeSchema = z.enum(SUPPORTED_LOCALES);

export const idSchema = z.string().cuid2().or(z.string().uuid()).or(z.string().min(10));

export const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9-]+$/, 'slug_invalid');

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * A coarse sanity check, not a border. The box around the European Netherlands
 * necessarily takes in the Belgian and German border regions — no rectangle can
 * exclude Antwerp while still containing Maastricht and Zeeland. It exists to
 * catch coordinates from another continent, which is what a mis-set device
 * locale or a copy-paste error actually produces; the city a customer picks is
 * what places the job.
 */
export const netherlandsCoordinatesSchema = coordinatesSchema.refine(
  ({ lat, lng }) => lat >= 50.7 && lat <= 53.6 && lng >= 3.3 && lng <= 7.3,
  { message: 'coordinates_outside_netherlands' },
);

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
