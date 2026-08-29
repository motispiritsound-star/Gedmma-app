import { env } from "./env";

type Level = "debug" | "info" | "warn" | "error";

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** Keys whose values must never reach the log stream. */
const REDACT = new Set([
  "password",
  "passwordHash",
  "token",
  "tokenHash",
  "sessionToken",
  "secret",
  "authorization",
  "cookie",
  "email",
  "answer",
  "familyNote",
]);

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACT.has(k) ? "[redacted]" : redact(v, depth + 1);
  }
  return out;
}

function write(level: Level, message: string, context?: Record<string, unknown>): void {
  let minimum: Level = "info";
  try {
    minimum = env().LOG_LEVEL;
  } catch {
    // Logging must never be the reason a process fails to start.
  }
  if (ORDER[level] < ORDER[minimum]) return;

  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...(context ? (redact(context) as Record<string, unknown>) : {}),
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => write("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => write("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => write("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => write("error", m, c),
};
