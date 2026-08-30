import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { db } from './index.ts';

export type Rol = 'eigenaar' | 'agent';

export type Gebruiker = {
  id: number;
  naam: string;
  email: string;
  rol: Rol;
  actief: number;
  aangemaakt_op: string;
};

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/** scrypt met een eigen salt per wachtwoord; formaat: scrypt$<salt>$<hash>. */
export function hashWachtwoord(wachtwoord: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(wachtwoord.normalize('NFKC'), salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function controleerWachtwoord(wachtwoord: string, opgeslagen: string): boolean {
  const [soort, saltDeel, hashDeel] = opgeslagen.split('$');
  if (soort !== 'scrypt' || !saltDeel || !hashDeel) return false;
  const salt = Buffer.from(saltDeel, 'base64url');
  const verwacht = Buffer.from(hashDeel, 'base64url');
  const gevonden = scryptSync(wachtwoord.normalize('NFKC'), salt, verwacht.length, SCRYPT);
  return verwacht.length === gevonden.length && timingSafeEqual(verwacht, gevonden);
}

export function maakGebruiker(input: { naam: string; email: string; wachtwoord: string; rol?: Rol }): Gebruiker {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error(`"${input.email}" is geen geldig e-mailadres.`);
  if (input.wachtwoord.length < 10) throw new Error('Kies een wachtwoord van minstens 10 tekens.');
  if (db().prepare('SELECT 1 FROM gebruikers WHERE email = ?').get(email)) {
    throw new Error(`Er bestaat al een gebruiker met ${email}.`);
  }

  db().prepare('INSERT INTO gebruikers (naam, email, wachtwoord, rol) VALUES (?, ?, ?, ?)')
    .run(input.naam.trim(), email, hashWachtwoord(input.wachtwoord), input.rol ?? 'agent');
  return gebruikerOpEmail(email)!;
}

const zonderWachtwoord = 'id, naam, email, rol, actief, aangemaakt_op';

export const gebruikerOpEmail = (email: string): (Gebruiker & { wachtwoord: string }) | null =>
  (db().prepare('SELECT * FROM gebruikers WHERE email = ?').get(email.trim().toLowerCase()) ?? null) as never;

export const gebruiker = (id: number): Gebruiker | null =>
  (db().prepare(`SELECT ${zonderWachtwoord} FROM gebruikers WHERE id = ?`).get(id) ?? null) as never;

export const gebruikers = (): Gebruiker[] =>
  db().prepare(`SELECT ${zonderWachtwoord} FROM gebruikers ORDER BY rol, naam`).all() as never;

export function wijzigWachtwoord(id: number, nieuw: string): void {
  if (nieuw.length < 10) throw new Error('Kies een wachtwoord van minstens 10 tekens.');
  db().prepare('UPDATE gebruikers SET wachtwoord = ? WHERE id = ?').run(hashWachtwoord(nieuw), id);
  db().prepare('DELETE FROM sessies WHERE gebruiker_id = ?').run(id); // alle apparaten uitloggen
}

export function zetActief(id: number, actief: boolean): void {
  db().prepare('UPDATE gebruikers SET actief = ? WHERE id = ?').run(actief ? 1 : 0, id);
  if (!actief) db().prepare('DELETE FROM sessies WHERE gebruiker_id = ?').run(id);
}

// --- sessies ---------------------------------------------------------------

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/** Logt in en geeft het sessietoken terug. Geeft null bij verkeerde gegevens. */
export function login(email: string, wachtwoord: string, dagenGeldig = 14): string | null {
  const rij = gebruikerOpEmail(email);
  if (!rij || !rij.actief) return null;
  if (!controleerWachtwoord(wachtwoord, rij.wachtwoord)) return null;

  const token = randomBytes(32).toString('base64url');
  db().prepare("INSERT INTO sessies (token, gebruiker_id, verloopt_op) VALUES (?, ?, datetime('now', ?))")
    .run(hashToken(token), rij.id, `+${dagenGeldig} days`);
  return token;
}

export function sessieGebruiker(token: string | undefined): Gebruiker | null {
  if (!token) return null;
  const rij = db().prepare(`
    SELECT g.${zonderWachtwoord.split(', ').join(', g.')}
    FROM sessies s JOIN gebruikers g ON g.id = s.gebruiker_id
    WHERE s.token = ? AND s.verloopt_op > datetime('now') AND g.actief = 1
  `).get(hashToken(token));
  return (rij ?? null) as never;
}

export function logUit(token: string | undefined): void {
  if (token) db().prepare('DELETE FROM sessies WHERE token = ?').run(hashToken(token));
}

export function ruimSessiesOp(): number {
  const result = db().prepare("DELETE FROM sessies WHERE verloopt_op <= datetime('now')").run();
  return Number(result.changes ?? 0);
}
