const colors = {
  gray: '\x1b[90m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', reset: '\x1b[0m',
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (color: keyof typeof colors, text: string) =>
  useColor ? `${colors[color]}${text}${colors.reset}` : text;

export const log = {
  info: (msg: string) => console.log(msg),
  step: (msg: string) => console.log(paint('cyan', '→ ') + msg),
  ok: (msg: string) => console.log(paint('green', '✓ ') + msg),
  warn: (msg: string) => console.warn(paint('yellow', '! ') + msg),
  error: (msg: string) => console.error(paint('red', '✗ ') + msg),
  dim: (msg: string) => console.log(paint('gray', msg)),
};

/** Eenvoudige voortgangsteller op één regel. */
export function progress(total: number, label = 'verwerkt') {
  let done = 0;
  const started = Date.now();
  return {
    tick(extra = ''): void {
      done += 1;
      if (!process.stdout.isTTY) {
        if (done % 25 === 0 || done === total) console.log(`  ${done}/${total} ${label}`);
        return;
      }
      const elapsed = (Date.now() - started) / 1000;
      const rate = done / Math.max(elapsed, 0.001);
      const eta = rate > 0 ? Math.round((total - done) / rate) : 0;
      const line = `  ${done}/${total} ${label} · ${rate.toFixed(1)}/s · ETA ${eta}s ${extra}`;
      process.stdout.write('\r' + line.slice(0, 110).padEnd(110));
    },
    done(): void {
      if (process.stdout.isTTY) process.stdout.write('\n');
    },
  };
}
