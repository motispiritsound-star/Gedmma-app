import { getEnv } from '@/env'

/**
 * Minimal structured logger. Emits one JSON object per line on stdout/stderr so
 * a log shipper can parse it without a regex. Values that could carry personal
 * data are redacted by key name.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<Level | 'silent', number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
}

const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'tokenhash',
  'sessiontoken',
  'secret',
  'authorization',
  'cookie',
  'email',
  'apikey',
])

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[deep]'
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => redact(item, depth + 1))
  if (value instanceof Error) return { name: value.name, message: value.message }
  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = REDACTED_KEYS.has(key.toLowerCase()) ? '[redacted]' : redact(item, depth + 1)
  }
  return out
}

function threshold(): number {
  try {
    return LEVEL_ORDER[getEnv().LOG_LEVEL]
  } catch {
    return LEVEL_ORDER.info
  }
}

function emit(level: Level, message: string, context?: Record<string, unknown>): void {
  if (LEVEL_ORDER[level] < threshold()) return
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(context ? (redact(context) as Record<string, unknown>) : {}),
  })
  if (level === 'error' || level === 'warn') console.error(line)
  else console.log(line)
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('error', message, context),
}
