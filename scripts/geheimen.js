#!/usr/bin/env node
/**
 * `npm run geheimen` — genereert de geheimen voor een nieuwe omgeving.
 *
 * Elke omgeving heeft eigen geheimen. Kopieer de uitvoer naar het .env-bestand
 * op de server en bewaar hem verder nergens: hij hoort niet in dit repository,
 * niet in een chat en niet in een e-mail.
 *
 * Let op: PASSWORD_PEPPER en DATA_ENCRYPTION_KEY wijzigen ná ingebruikname
 * maakt bestaande wachtwoorden en versleutelde gegevens onbruikbaar. Genereer
 * ze één keer, bij het opzetten.
 */
import { randomBytes } from 'node:crypto';

/** Een wachtwoord uit het alfabet dat overal veilig is in een verbindings-URL. */
function wachtwoord(lengte = 32) {
  const alfabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const ruw = randomBytes(lengte);
  let uit = '';
  for (const byte of ruw) uit += alfabet[byte % alfabet.length];
  return uit;
}

const regels = [
  '# Gegenereerd met `npm run geheimen`. Bewaar dit bestand alleen op de server.',
  `DB_WACHTWOORD=${wachtwoord()}`,
  `DB_APP_WACHTWOORD=${wachtwoord()}`,
  `PASSWORD_PEPPER=${randomBytes(32).toString('base64url')}`,
  `DATA_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}`,
];

process.stdout.write(`${regels.join('\n')}\n`);
