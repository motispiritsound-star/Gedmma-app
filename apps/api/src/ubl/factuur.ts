/**
 * UBL 2.1-factuur (EN 16931 / NLCIUS-achtig).
 *
 * Het bestand wordt met de hand opgebouwd omdat het om een vaste, kleine
 * structuur gaat; dat scheelt een afhankelijkheid en maakt precies zichtbaar
 * welke velden er in gaan. Verzending via Peppol vereist een geaccrediteerd
 * access point en komt in fase 3; dit bestand is nu al bruikbaar als bijlage.
 */
export type UblFactuur = {
  documentnummer: string;
  factuurdatum: string;
  vervaldatum: string | null;
  soort: 'factuur' | 'creditnota';
  valuta: string;
  verkoper: {
    naam: string;
    adres: string | null;
    postcode: string | null;
    plaats: string | null;
    land: string;
    btwNummer: string | null;
    kvkNummer: string | null;
    iban: string | null;
  };
  afnemer: {
    naam: string;
    adres: string | null;
    postcode: string | null;
    plaats: string | null;
    land: string;
    btwNummer: string | null;
  };
  regels: {
    nummer: number;
    omschrijving: string;
    aantal: string;
    eenheid: string;
    prijs: string;
    bedragExclusief: string;
    btwTarief: string;
    btwCategorie: string;
  }[];
  btwGroepen: { categorie: string; tarief: string; grondslag: string; btw: string }[];
  totaalExclusief: string;
  totaalBtw: string;
  totaalInclusief: string;
  notitie: string | null;
};

function esc(waarde: string | null | undefined): string {
  if (waarde === null || waarde === undefined) return '';
  return waarde
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Btw-categorie volgens UNTDID 5305:
 *   S  = standaardtarief, AE = btw verlegd, K = intracommunautair,
 *   G  = uitvoer, E = vrijgesteld, Z = nultarief.
 */
export function btwCategorieVan(code: { verlegd: boolean; icLevering: boolean; tarief: string; vak: string | null }): string {
  if (code.verlegd) return 'AE';
  if (code.icLevering) return 'K';
  if (code.vak === '3a') return 'G';
  if (Number(code.tarief) === 0) return 'Z';
  return 'S';
}

const REDEN_VRIJSTELLING: Record<string, string> = {
  AE: 'Btw verlegd',
  K: 'Intracommunautaire levering',
  G: 'Uitvoer buiten de EU',
  Z: 'Nultarief',
  E: 'Vrijgesteld van btw',
};

export function maakUbl(factuur: UblFactuur): string {
  const type = factuur.soort === 'creditnota' ? 'CreditNote' : 'Invoice';
  const typeCode = factuur.soort === 'creditnota' ? '381' : '380';
  const regelTag = factuur.soort === 'creditnota' ? 'CreditNoteLine' : 'InvoiceLine';
  const aantalTag = factuur.soort === 'creditnota' ? 'CreditedQuantity' : 'InvoicedQuantity';

  const regels = factuur.regels
    .map(
      (regel) => `  <cac:${regelTag}>
    <cbc:ID>${regel.nummer}</cbc:ID>
    <cbc:${aantalTag} unitCode="${esc(regel.eenheid === 'stuk' ? 'C62' : 'C62')}">${esc(regel.aantal)}</cbc:${aantalTag}>
    <cbc:LineExtensionAmount currencyID="${esc(factuur.valuta)}">${esc(regel.bedragExclusief)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${esc(regel.omschrijving)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>${esc(regel.btwCategorie)}</cbc:ID>
        <cbc:Percent>${(Number(regel.btwTarief) * 100).toFixed(2)}</cbc:Percent>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${esc(factuur.valuta)}">${esc(regel.prijs)}</cbc:PriceAmount>
    </cac:Price>
  </cac:${regelTag}>`,
    )
    .join('\n');

  const btwGroepen = factuur.btwGroepen
    .map(
      (groep) => `    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${esc(factuur.valuta)}">${esc(groep.grondslag)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${esc(factuur.valuta)}">${esc(groep.btw)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${esc(groep.categorie)}</cbc:ID>
        <cbc:Percent>${(Number(groep.tarief) * 100).toFixed(2)}</cbc:Percent>${
          REDEN_VRIJSTELLING[groep.categorie]
            ? `\n        <cbc:TaxExemptionReason>${esc(REDEN_VRIJSTELLING[groep.categorie])}</cbc:TaxExemptionReason>`
            : ''
        }
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<${type} xmlns="urn:oasis:names:specification:ubl:schema:xsd:${type}-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>${esc(factuur.documentnummer)}</cbc:ID>
  <cbc:IssueDate>${esc(factuur.factuurdatum)}</cbc:IssueDate>${
    factuur.vervaldatum ? `\n  <cbc:DueDate>${esc(factuur.vervaldatum)}</cbc:DueDate>` : ''
  }
  <cbc:${factuur.soort === 'creditnota' ? 'CreditNoteTypeCode' : 'InvoiceTypeCode'}>${typeCode}</cbc:${
    factuur.soort === 'creditnota' ? 'CreditNoteTypeCode' : 'InvoiceTypeCode'
  }>${factuur.notitie ? `\n  <cbc:Note>${esc(factuur.notitie)}</cbc:Note>` : ''}
  <cbc:DocumentCurrencyCode>${esc(factuur.valuta)}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${esc(factuur.verkoper.naam)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(factuur.verkoper.adres)}</cbc:StreetName>
        <cbc:CityName>${esc(factuur.verkoper.plaats)}</cbc:CityName>
        <cbc:PostalZone>${esc(factuur.verkoper.postcode)}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${esc(factuur.verkoper.land)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>${
        factuur.verkoper.btwNummer
          ? `\n      <cac:PartyTaxScheme>
        <cbc:CompanyID>${esc(factuur.verkoper.btwNummer)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>`
          : ''
      }
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(factuur.verkoper.naam)}</cbc:RegistrationName>${
          factuur.verkoper.kvkNummer
            ? `\n        <cbc:CompanyID schemeID="0106">${esc(factuur.verkoper.kvkNummer)}</cbc:CompanyID>`
            : ''
        }
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${esc(factuur.afnemer.naam)}</cbc:Name></cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${esc(factuur.afnemer.adres)}</cbc:StreetName>
        <cbc:CityName>${esc(factuur.afnemer.plaats)}</cbc:CityName>
        <cbc:PostalZone>${esc(factuur.afnemer.postcode)}</cbc:PostalZone>
        <cac:Country><cbc:IdentificationCode>${esc(factuur.afnemer.land)}</cbc:IdentificationCode></cac:Country>
      </cac:PostalAddress>${
        factuur.afnemer.btwNummer
          ? `\n      <cac:PartyTaxScheme>
        <cbc:CompanyID>${esc(factuur.afnemer.btwNummer)}</cbc:CompanyID>
        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
      </cac:PartyTaxScheme>`
          : ''
      }
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${esc(factuur.afnemer.naam)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>${
    factuur.verkoper.iban
      ? `\n  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cbc:PaymentID>${esc(factuur.documentnummer)}</cbc:PaymentID>
    <cac:PayeeFinancialAccount><cbc:ID>${esc(factuur.verkoper.iban)}</cbc:ID></cac:PayeeFinancialAccount>
  </cac:PaymentMeans>`
      : ''
  }
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${esc(factuur.valuta)}">${esc(factuur.totaalBtw)}</cbc:TaxAmount>
${btwGroepen}
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${esc(factuur.valuta)}">${esc(factuur.totaalExclusief)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${esc(factuur.valuta)}">${esc(factuur.totaalExclusief)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${esc(factuur.valuta)}">${esc(factuur.totaalInclusief)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${esc(factuur.valuta)}">${esc(factuur.totaalInclusief)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${regels}
</${type}>
`;
}
