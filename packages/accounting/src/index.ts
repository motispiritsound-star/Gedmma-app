/**
 * @gedmma/accounting — de rekenkern van de boekhouding.
 *
 * Alles in dit pakket is puur: geen database, geen netwerk, geen tijd. Daardoor
 * is elke regel property-based testbaar en is het gedrag bij een gegeven invoer
 * altijd hetzelfde.
 */
export { BoekhoudFout, type BoekhoudFoutCode } from './fouten.ts';
export {
  bouwPost,
  keerPostOm,
  debet,
  credit,
  isBalansrekening,
  BALANSSOORTEN,
  RESULTAATSOORTEN,
  type RekeningSoort,
  type ConceptRegel,
  type ConceptPost,
  type GeldigePost,
  type GeldigeRegel,
} from './journaalpost.ts';
export {
  berekenFactuur,
  isGeldigOp,
  eisGeldigeBtwCode,
  vakOmschrijving,
  AANGIFTE_VAKKEN,
  type BtwCode,
  type FactuurRegelInvoer,
  type BerekendeRegel,
  type BtwGroep,
  type FactuurTotalen,
  type BtwVakRegel,
} from './btw.ts';
export {
  SCHEMA_SJABLONEN,
  sjabloonVoor,
  type SchemaSjabloon,
  type RekeningSjabloon,
  type Systeemrol,
} from './rekeningschema.ts';
export {
  boekVerkoopfactuur,
  boekInkoopfactuur,
  boekBanktransactie,
  boekKoersverschil,
  naarAdministratievaluta,
  type Rekeningregister,
  type VerkoopfactuurBoeking,
  type InkoopfactuurBoeking,
  type BanktransactieBoeking,
  type Aflettering,
  type DirecteBoeking,
} from './boekingspatronen.ts';
export {
  controleerFactuurvereisten,
  eisFactuurvereisten,
  type FactuurGegevens,
  type Vereistenprobleem,
} from './factuurvereisten.ts';
