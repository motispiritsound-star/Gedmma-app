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

/** Morocco's bounding box, including the southern provinces. */
export const moroccoCoordinatesSchema = coordinatesSchema.refine(
  ({ lat, lng }) => lat >= 20.5 && lat <= 36.2 && lng >= -17.5 && lng <= -0.8,
  { message: 'coordinates_outside_morocco' },
);

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
