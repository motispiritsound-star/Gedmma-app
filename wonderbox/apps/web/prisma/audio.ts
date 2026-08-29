import { createHash } from 'node:crypto';

/**
 * Placeholder narration for local development.
 *
 * Real WonderBox audio is recorded by voice actors and uploaded through the
 * studio. For a developer who has just cloned the repository there has to be
 * *something* to press play on, so the seed synthesises a short WAV per node:
 * a soft two-tone chime whose length matches how long the line would take to
 * read aloud. It is obviously not speech, which is the point — nobody will
 * mistake it for finished content.
 */

const SAMPLE_RATE = 8000;
const READING_SPEED_CHARS_PER_SECOND = 14;

export function estimateDurationMs(text: string): number {
  const seconds = Math.max(1.5, Math.min(20, text.length / READING_SPEED_CHARS_PER_SECOND));
  return Math.round(seconds * 1000);
}

/** Renders a 16-bit mono WAV. Deterministic: same text gives the same bytes. */
export function synthesisePlaceholder(text: string, locale: string): Uint8Array {
  const durationMs = estimateDurationMs(text);
  const sampleCount = Math.round((durationMs / 1000) * SAMPLE_RATE);
  const samples = new Int16Array(sampleCount);

  // Two locales get two different base pitches, so a developer can hear at
  // once which language track is playing.
  const base = locale === 'nl' ? 392 : 440;
  const seed = Number.parseInt(createHash('sha256').update(text).digest('hex').slice(0, 6), 16);
  const second = base * (1 + ((seed % 5) + 2) / 12);

  for (let i = 0; i < sampleCount; i += 1) {
    const t = i / SAMPLE_RATE;
    // A gentle envelope so it fades in and out instead of clicking.
    const progress = i / sampleCount;
    const envelope = Math.sin(Math.PI * progress) ** 2;
    const wobble = Math.sin(2 * Math.PI * 0.7 * t) * 0.5 + 0.5;
    const value =
      Math.sin(2 * Math.PI * base * t) * 0.35 * wobble +
      Math.sin(2 * Math.PI * second * t) * 0.2 * (1 - wobble);
    samples[i] = Math.round(value * envelope * 6000);
  }

  return wrapWav(samples);
}

function wrapWav(samples: Int16Array): Uint8Array {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(samples[i] ?? 0, 44 + i * 2);
  }
  return new Uint8Array(buffer);
}
