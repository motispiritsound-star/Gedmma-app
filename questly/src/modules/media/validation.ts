import { AppError } from "@/lib/errors";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

const EXTENSIONS: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Sniffs the declared type from the file's own bytes. A browser-supplied
 * Content-Type is a hint, not evidence, so the magic bytes decide.
 */
export function sniffImageType(bytes: Buffer): AllowedImageType | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}

export function extensionFor(type: AllowedImageType): string {
  return EXTENSIONS[type];
}

export function validateUpload(bytes: Buffer, maxBytes: number): AllowedImageType {
  if (bytes.byteLength === 0) throw new AppError("The file is empty.", "empty_file", 400);
  if (bytes.byteLength > maxBytes) {
    throw new AppError(`Images may be at most ${Math.round(maxBytes / 1024 / 1024)} MB.`, "file_too_large", 413);
  }
  const type = sniffImageType(bytes);
  if (!type) throw new AppError("Only JPEG, PNG and WebP images are accepted.", "unsupported_type", 415);
  return type;
}
