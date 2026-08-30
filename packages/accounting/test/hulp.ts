import { Money, Rate } from '@gedmma/money';
import type { BtwCode } from '../src/index.ts';
import type { Rekeningregister, Systeemrol } from '../src/index.ts';

/** Een klein rekeningregister voor tests: rol -> id/code, zonder database. */
export const rekeningen: Record<Systeemrol, { id: string; code: string }> = {
  debiteuren: { id: 'r-1300', code: '1300' },
  crediteuren: { id: 'r-1600', code: '1600' },
  bank: { id: 'r-1100', code: '1100' },
  kas: { id: 'r-1000', code: '1000' },
  btw_af_te_dragen_hoog: { id: 'r-1500', code: '1500' },
  btw_af_te_dragen_laag: { id: 'r-1505', code: '1505' },
  btw_af_te_dragen_overig: { id: 'r-1508', code: '1508' },
  btw_verlegd_af_te_dragen: { id: 'r-1510', code: '1510' },
  btw_te_vorderen: { id: 'r-1520', code: '1520' },
  btw_afrekening: { id: 'r-1590', code: '1590' },
  betalingsverschillen: { id: 'r-4990', code: '4990' },
  koersverschillen: { id: 'r-4980', code: '4980' },
  onverdeeld_resultaat: { id: 'r-0590', code: '0590' },
  tussenrekening_bank: { id: 'r-1190', code: '1190' },
  nog_te_ontvangen_facturen: { id: 'r-1620', code: '1620' },
  prive_opnamen: { id: 'r-0510', code: '0510' },
  kapitaal: { id: 'r-0500', code: '0500' },
};

export const register: Rekeningregister = {
  vindRol(rol) {
    const gevonden = rekeningen[rol];
    if (!gevonden) throw new Error(`Systeemrol ${rol} ontbreekt in het rekeningschema.`);
    return gevonden;
  },
};

function btw(overschrijf: Partial<BtwCode> & Pick<BtwCode, 'id' | 'code' | 'naam'>): BtwCode {
  return {
    soort: 'beide',
    tarief: Rate.tariefVanProcent('0'),
    vak: null,
    verlegd: false,
    icLevering: false,
    geldigVanaf: '2019-01-01',
    geldigTot: null,
    btwRekeningId: null,
    ...overschrijf,
  };
}

export const VK21 = btw({ id: 'b-vk21', code: 'VK-21', naam: 'Verkoop 21%', soort: 'verkoop', tarief: Rate.tariefVanProcent('21'), vak: '1a' });
export const VK9 = btw({ id: 'b-vk9', code: 'VK-9', naam: 'Verkoop 9%', soort: 'verkoop', tarief: Rate.tariefVanProcent('9'), vak: '1b' });
export const VK0 = btw({ id: 'b-vk0', code: 'VK-0', naam: 'Verkoop 0%', soort: 'verkoop', vak: '1e' });
export const VKVERLEGD = btw({ id: 'b-vkverlegd', code: 'VK-VERLEGD', naam: 'Verkoop btw verlegd', soort: 'verkoop', vak: '1e', verlegd: true });
export const VKICL = btw({ id: 'b-vkicl', code: 'VK-ICL', naam: 'Levering binnen de EU', soort: 'verkoop', vak: '3b', icLevering: true });
export const IN21 = btw({ id: 'b-in21', code: 'IN-21', naam: 'Inkoop 21%', soort: 'inkoop', tarief: Rate.tariefVanProcent('21'), vak: '5b' });
export const IN9 = btw({ id: 'b-in9', code: 'IN-9', naam: 'Inkoop 9%', soort: 'inkoop', tarief: Rate.tariefVanProcent('9'), vak: '5b' });
export const INVERLEGD = btw({
  id: 'b-inverlegd',
  code: 'IN-VERLEGD',
  naam: 'Inkoop btw verlegd naar mij',
  soort: 'inkoop',
  tarief: Rate.tariefVanProcent('21'),
  vak: '2a',
  verlegd: true,
});
export const INGEEN = btw({ id: 'b-ingeen', code: 'IN-GEEN', naam: 'Inkoop zonder btw', soort: 'inkoop' });

export const eur = (tekst: string) => Money.vanTekst(tekst, 'EUR');
