import { getEnv } from '@/env'
import { validationError } from '@/lib/errors'

/**
 * Upload validation.
 *
 * Content type is decided by the file's magic bytes, not by the browser's
 * `Content-Type` header - a mislabelled or hostile file is rejected before it
 * ever reaches storage.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

const EXTENSIONS: Record<AllowedImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function extensionFor(type: AllowedImageType): string {
  return EXTENSIONS[type]
}

/** Returns the sniffed type, or null when the bytes are not an allowed image. */
export function sniffImageType(buffer: Buffer): AllowedImageType | null {
  if (buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

export type ValidatedUpload = {
  buffer: Buffer
  contentType: AllowedImageType
  extension: string
  sizeBytes: number
}

export function validateImageUpload(buffer: Buffer): ValidatedUpload {
  const maxBytes = getEnv().MEDIA_MAX_UPLOAD_BYTES
  if (buffer.length === 0) throw validationError('The file is empty.')
  if (buffer.length > maxBytes) {
    throw validationError(`Images may be at most ${Math.round(maxBytes / 1024 / 1024)} MB.`)
  }
  const contentType = sniffImageType(buffer)
  if (!contentType) {
    throw validationError('Only JPEG, PNG and WebP images are accepted.')
  }
  return { buffer, contentType, extension: extensionFor(contentType), sizeBytes: buffer.length }
}
