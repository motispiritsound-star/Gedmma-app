/**
 * Basisgegevens die in elke installatie gelijk zijn: rechten, ingebouwde rollen
 * en valuta. Dit draait bij elke start en is idempotent.
 */
import pg from 'pg';
import { config } from '../config.ts';
import { bekendeValutas, decimalenVan } from '@gedmma/money';

/** Alle rechten die het systeem kent. `kritiek` betekent extra logging en functiescheiding. */
export const RECHTEN: { sleutel: string; omschrijving: string; kritiek?: boolean }[] = [
  { sleutel: 'administratie.lezen', omschrijving: 'De administratie bekijken' },
  { sleutel: 'administratie.beheren', omschrijving: 'Instellingen van de administratie wijzigen' },
  { sleutel: 'relatie.lezen', omschrijving: 'Klanten en leveranciers bekijken' },
  { sleutel: 'relatie.schrijven', omschrijving: 'Klanten en leveranciers toevoegen en wijzigen' },
  { sleutel: 'verkoop.lezen', omschrijving: 'Verkoopfacturen bekijken' },
  { sleutel: 'verkoop.schrijven', omschrijving: 'Verkoopfacturen maken en wijzigen' },
  { sleutel: 'verkoop.versturen', omschrijving: 'Facturen versturen naar klanten' },
  { sleutel: 'inkoop.lezen', omschrijving: 'Inkoopfacturen en bonnen bekijken' },
  { sleutel: 'inkoop.schrijven', omschrijving: 'Inkoopfacturen en bonnen vastleggen' },
  { sleutel: 'inkoop.goedkeuren', omschrijving: 'Inkoopfacturen goedkeuren', kritiek: true },
  { sleutel: 'uren.lezen', omschrijving: 'Eigen uren en projecten bekijken' },
  { sleutel: 'uren.schrijven', omschrijving: 'Uren schrijven en wijzigen' },
  { sleutel: 'uren.allen.lezen', omschrijving: 'De uren van alle medewerkers bekijken' },
  { sleutel: 'uren.goedkeuren', omschrijving: 'Uren goedkeuren of afkeuren', kritiek: true },
  { sleutel: 'project.beheren', omschrijving: 'Projecten aanmaken en wijzigen' },
  { sleutel: 'bank.lezen', omschrijving: 'Banktransacties bekijken' },
  { sleutel: 'bank.schrijven', omschrijving: 'Banktransacties importeren en koppelen' },
  { sleutel: 'bank.koppelen', omschrijving: 'Een bankrekening koppelen', kritiek: true },
  { sleutel: 'betaling.voorbereiden', omschrijving: 'Betalingen klaarzetten', kritiek: true },
  { sleutel: 'betaling.goedkeuren', omschrijving: 'Betalingen goedkeuren', kritiek: true },
  { sleutel: 'journaal.aanmaken', omschrijving: 'Boekingen aanmaken' },
  { sleutel: 'journaal.definitief', omschrijving: 'Boekingen definitief maken', kritiek: true },
  { sleutel: 'journaal.storneren', omschrijving: 'Een tegenboeking maken', kritiek: true },
  { sleutel: 'periode.sluiten', omschrijving: 'Een periode blokkeren of sluiten', kritiek: true },
  { sleutel: 'periode.heropenen', omschrijving: 'Een gesloten periode heropenen', kritiek: true },
  { sleutel: 'rapport.lezen', omschrijving: 'Rapportages bekijken' },
  { sleutel: 'rapport.exporteren', omschrijving: 'Rapportages exporteren of downloaden', kritiek: true },
  { sleutel: 'document.lezen', omschrijving: 'Documenten bekijken' },
  { sleutel: 'document.schrijven', omschrijving: 'Documenten uploaden' },
  {
    sleutel: 'document.gevoelig.lezen',
    omschrijving: 'Als gevoelig geclassificeerde documenten inzien',
    kritiek: true,
  },
  { sleutel: 'gebruiker.beheren', omschrijving: 'Gebruikers en rollen beheren', kritiek: true },
  { sleutel: 'accountant.toegang', omschrijving: 'Accountantstoegang verlenen', kritiek: true },
  { sleutel: 'audit.lezen', omschrijving: 'De audit trail inzien', kritiek: true },
  { sleutel: 'privacy.beheren', omschrijving: 'Privacyverzoeken en -instellingen beheren', kritiek: true },
  { sleutel: 'ai.beheren', omschrijving: 'AI-functies aan- of uitzetten', kritiek: true },
];

const ALLE = RECHTEN.map((r) => r.sleutel);
const ALLEEN_LEZEN = ALLE.filter(
  (s) => s.endsWith('.lezen') && s !== 'audit.lezen' && s !== 'document.gevoelig.lezen',
);

/** Ingebouwde rollen. Zie docs/security.md voor de bedoeling per rol. */
export const ROLLEN: { sleutel: string; naam: string; omschrijving: string; rechten: string[] }[] = [
  {
    sleutel: 'owner',
    naam: 'Eigenaar',
    omschrijving: 'Mag alles binnen de organisatie.',
    rechten: ALLE,
  },
  {
    sleutel: 'admin',
    naam: 'Beheerder',
    omschrijving: 'Mag alles behalve de organisatie opheffen.',
    rechten: ALLE,
  },
  {
    sleutel: 'bookkeeper',
    naam: 'Boekhouder',
    omschrijving: 'Boekt, maakt definitief en rapporteert. Geen gebruikersbeheer.',
    rechten: ALLE.filter(
      (s) =>
        ![
          'gebruiker.beheren',
          'accountant.toegang',
          'periode.heropenen',
          'privacy.beheren',
          'ai.beheren',
          'betaling.goedkeuren',
        ].includes(s),
    ),
  },
  {
    sleutel: 'accountant',
    naam: 'Accountant',
    omschrijving: 'Als boekhouder, plus perioden heropenen. Toegang heeft een einddatum.',
    rechten: ALLE.filter(
      (s) => !['gebruiker.beheren', 'privacy.beheren', 'ai.beheren', 'betaling.goedkeuren'].includes(s),
    ),
  },
  {
    sleutel: 'employee',
    naam: 'Medewerker',
    omschrijving: 'Legt bonnen, uren en declaraties vast. Geen toegang tot het grootboek.',
    rechten: [
      'administratie.lezen',
      'relatie.lezen',
      'inkoop.lezen',
      'inkoop.schrijven',
      'document.lezen',
      'document.schrijven',
      // Een medewerker schrijft zijn eigen uren, maar ziet die van collega's
      // niet en keurt niets goed.
      'uren.lezen',
      'uren.schrijven',
    ],
  },
  {
    sleutel: 'viewer',
    naam: 'Meekijker',
    omschrijving: 'Alleen lezen. Geen export, geen wijzigingen.',
    rechten: ALLEEN_LEZEN,
  },
  {
    sleutel: 'support',
    naam: 'Support',
    omschrijving: 'Geen standaardtoegang. Werkt alleen via impersonatie met toestemming en tijdslimiet.',
    rechten: ['administratie.lezen', 'relatie.lezen', 'verkoop.lezen', 'inkoop.lezen', 'bank.lezen'],
  },
];

/** Rechten die support ook tijdens impersonatie nooit krijgt. */
export const SUPPORT_VERBODEN = [
  'betaling.goedkeuren',
  'betaling.voorbereiden',
  'gebruiker.beheren',
  'rapport.exporteren',
  'privacy.beheren',
  'accountant.toegang',
  'document.gevoelig.lezen',
];

export async function seedBasisgegevens(): Promise<void> {
  const pool = new pg.Pool({ connectionString: config.database.migratieUrl, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const recht of RECHTEN) {
      await client.query(
        `INSERT INTO permission (sleutel, omschrijving, kritiek) VALUES ($1, $2, $3)
         ON CONFLICT (sleutel) DO UPDATE SET omschrijving = EXCLUDED.omschrijving, kritiek = EXCLUDED.kritiek`,
        [recht.sleutel, recht.omschrijving, recht.kritiek ?? false],
      );
    }

    for (const rol of ROLLEN) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO role (sleutel, naam, omschrijving, organization_id, ingebouwd)
         VALUES ($1, $2, $3, NULL, true)
         ON CONFLICT (sleutel) WHERE organization_id IS NULL
         DO UPDATE SET naam = EXCLUDED.naam, omschrijving = EXCLUDED.omschrijving
         RETURNING id`,
        [rol.sleutel, rol.naam, rol.omschrijving],
      );
      const rolId = rows[0]?.id;
      if (!rolId) throw new Error(`Rol ${rol.sleutel} kon niet worden aangemaakt.`);
      await client.query('DELETE FROM role_permission WHERE role_id = $1', [rolId]);
      for (const recht of rol.rechten) {
        await client.query('INSERT INTO role_permission (role_id, permission_sleutel) VALUES ($1, $2)', [
          rolId,
          recht,
        ]);
      }
    }

    for (const code of bekendeValutas()) {
      await client.query(
        `INSERT INTO currency (code, naam, decimalen) VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE SET decimalen = EXCLUDED.decimalen`,
        [code, code, decimalenVan(code)],
      );
    }

    await client.query('COMMIT');
  } catch (fout) {
    await client.query('ROLLBACK');
    throw fout;
  } finally {
    client.release();
    await pool.end();
  }
}
