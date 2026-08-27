/** Parser voor RFC4180-achtige CSV (komma of puntkomma als scheidingsteken). */
export function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, '');
  const delimiter = guessDelimiter(clean);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]!;
    if (quoted) {
      if (char === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (char === delimiter) { row.push(field); field = ''; continue; }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && clean[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);

  const header = rows.shift();
  if (!header) return [];
  const keys = header.map((key) => key.trim().toLowerCase());
  return rows.map((cells) => {
    const record: Record<string, string> = {};
    keys.forEach((key, index) => { record[key] = (cells[index] ?? '').trim(); });
    return record;
  });
}

function guessDelimiter(text: string): string {
  const firstLine = text.slice(0, text.indexOf('\n') === -1 ? text.length : text.indexOf('\n'));
  return (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return '';
  const keys = columns ?? [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (value: unknown): string => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))];
  return lines.join('\n') + '\n';
}
