import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { toCsv } from '../util/csv.ts';
import { queryLeads, type LeadFilter } from './leads.ts';

const COLUMNS = [
  'bedrijf', 'website', 'domein', 'plaats', 'branche', 'score', 'beoordeling',
  'status', 'telefoon', 'email', 'belangrijkste_problemen', 'gescand_op', 'opvolging',
];

/** Schrijft de gefilterde leads naar CSV of JSON, klaar voor je CRM of mailmerge. */
export async function exportLeads(
  path: string,
  filter: LeadFilter,
  format: 'csv' | 'json' = 'csv',
): Promise<number> {
  const leads = queryLeads({ limit: 100_000, ...filter });
  await mkdir(dirname(path), { recursive: true });

  if (format === 'json') {
    await writeFile(path, JSON.stringify(leads, null, 2), 'utf8');
    return leads.length;
  }

  const rows = leads.map((lead) => ({
    bedrijf: lead.name,
    website: lead.website,
    domein: lead.domain,
    plaats: lead.city ?? '',
    branche: lead.branch ?? '',
    score: lead.score ?? '',
    beoordeling: lead.grade ?? '',
    status: lead.scan_status ?? '',
    telefoon: lead.contact.phones.join(' / '),
    email: lead.contact.emails.join(' / '),
    belangrijkste_problemen: lead.topIssues.map((entry) => entry.title).join(' | '),
    gescand_op: lead.scanned_at ?? '',
    opvolging: lead.outreach_status,
  }));

  await writeFile(path, toCsv(rows, COLUMNS), 'utf8');
  return rows.length;
}
