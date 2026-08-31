// Alles wat een kind doet blijft op het apparaat zelf staan (localStorage).
// Er gaat niets naar een server. Dat is bewust: geen accounts, geen data van
// kinderen ergens anders.

const SLEUTEL = 'noer.v1';

const leegVoortgang = () => ({
  xp: 0,
  badges: [],
  reeks: { huidig: 0, langste: 0, laatsteDag: null },
  lessen: {},      // lesId -> { sterren, goed, fout, af }
  soeras: {},      // soeraId -> { ayaGeleerd: [], af, sterren }
  themas: {},      // themaId -> { goed, fout, gekend: [] }
  letters: {},     // letterId -> { goed, fout }
  dagen: {},       // 'YYYY-MM-DD' -> { seconden, goed, fout }
  foutlozeLessen: 0,
});

const leegStaat = () => ({ profielen: [], actief: null, voortgang: {}, ouder: { pin: null } });

function lees() {
  try {
    const rauw = localStorage.getItem(SLEUTEL);
    if (!rauw) return leegStaat();
    const staat = JSON.parse(rauw);
    return { ...leegStaat(), ...staat };
  } catch {
    return leegStaat();
  }
}

let staat = lees();
const luisteraars = new Set();

function bewaar() {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(staat));
  } catch {
    // Vol of geblokkeerd (privé-venster): de app blijft werken, alleen
    // onthoudt hij deze sessie niets.
  }
  for (const fn of luisteraars) fn(staat);
}

export const opAndering = (fn) => { luisteraars.add(fn); return () => luisteraars.delete(fn); };

export const alleProfielen = () => staat.profielen;
export const actiefProfiel = () => staat.profielen.find((p) => p.id === staat.actief) || null;

export function maakProfiel({ naam, leeftijd, avatar, kleur }) {
  const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  staat.profielen.push({ id, naam, leeftijd, avatar, kleur, aangemaakt: new Date().toISOString() });
  staat.voortgang[id] = leegVoortgang();
  staat.actief = id;
  bewaar();
  return id;
}

export function kiesProfiel(id) {
  if (!staat.profielen.some((p) => p.id === id)) return false;
  staat.actief = id;
  bewaar();
  return true;
}

export function verwijderProfiel(id) {
  staat.profielen = staat.profielen.filter((p) => p.id !== id);
  delete staat.voortgang[id];
  if (staat.actief === id) staat.actief = staat.profielen[0]?.id ?? null;
  bewaar();
}

export function wijzigProfiel(id, velden) {
  const p = staat.profielen.find((x) => x.id === id);
  if (!p) return;
  Object.assign(p, velden);
  bewaar();
}

export function voortgang(profielId = staat.actief) {
  if (!profielId) return leegVoortgang();
  if (!staat.voortgang[profielId]) staat.voortgang[profielId] = leegVoortgang();
  return { ...leegVoortgang(), ...staat.voortgang[profielId] };
}

/** Past de voortgang van het actieve profiel aan via een functie. */
export function pasAan(fn) {
  const id = staat.actief;
  if (!id) return;
  const v = voortgang(id);
  fn(v);
  staat.voortgang[id] = v;
  bewaar();
}

export const vandaag = () => new Date().toISOString().slice(0, 10);

const dagVerschil = (a, b) =>
  Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

/** Werkt de dagreeks bij. Geeft terug of de reeks vandaag nieuw is opgehoogd. */
export function tikDagreeks() {
  let nieuw = false;
  pasAan((v) => {
    const dag = vandaag();
    if (v.reeks.laatsteDag === dag) return;
    const gat = v.reeks.laatsteDag ? dagVerschil(v.reeks.laatsteDag, dag) : null;
    v.reeks.huidig = gat === 1 ? v.reeks.huidig + 1 : 1;
    v.reeks.laatsteDag = dag;
    v.reeks.langste = Math.max(v.reeks.langste, v.reeks.huidig);
    nieuw = true;
  });
  return nieuw;
}

/** Telt oefentijd op bij vandaag. */
export function telTijd(seconden) {
  if (seconden <= 0) return;
  pasAan((v) => {
    const d = (v.dagen[vandaag()] ||= { seconden: 0, goed: 0, fout: 0 });
    d.seconden += seconden;
  });
}

/** Legt één antwoord vast: goed of fout, eventueel gekoppeld aan een letter. */
export function telAntwoord({ goed, letterId = null, themaId = null }) {
  pasAan((v) => {
    const d = (v.dagen[vandaag()] ||= { seconden: 0, goed: 0, fout: 0 });
    d[goed ? 'goed' : 'fout'] += 1;
    if (letterId) {
      const l = (v.letters[letterId] ||= { goed: 0, fout: 0 });
      l[goed ? 'goed' : 'fout'] += 1;
    }
    if (themaId) {
      const t = (v.themas[themaId] ||= { goed: 0, fout: 0, gekend: [] });
      t[goed ? 'goed' : 'fout'] += 1;
    }
  });
}

export function bewaarLes(lesId, { sterren, goed, fout }) {
  pasAan((v) => {
    const l = (v.lessen[lesId] ||= { sterren: 0, goed: 0, fout: 0, af: false });
    l.sterren = Math.max(l.sterren, sterren);
    l.goed += goed;
    l.fout += fout;
    if (sterren >= 2) l.af = true;
    if (fout === 0 && goed > 0) v.foutlozeLessen += 1;
  });
}

export function bewaarAya(soeraId, ayaNr) {
  pasAan((v) => {
    const s = (v.soeras[soeraId] ||= { ayaGeleerd: [], af: false, sterren: 0 });
    if (!s.ayaGeleerd.includes(ayaNr)) s.ayaGeleerd.push(ayaNr);
  });
}

export function bewaarSoera(soeraId, { af = false, sterren = 0 } = {}) {
  pasAan((v) => {
    const s = (v.soeras[soeraId] ||= { ayaGeleerd: [], af: false, sterren: 0 });
    s.af = s.af || af;
    s.sterren = Math.max(s.sterren, sterren);
  });
}

export function bewaarWoord(themaId, index) {
  pasAan((v) => {
    const t = (v.themas[themaId] ||= { goed: 0, fout: 0, gekend: [] });
    if (!t.gekend.includes(index)) t.gekend.push(index);
  });
}

export const ouderInstelling = () => staat.ouder;
export function zetOuderPin(pin) { staat.ouder.pin = pin; bewaar(); }

/** Alles wissen — staat in het ouderscherm, achter een bevestiging. */
export function wisAlles() { staat = leegStaat(); bewaar(); }
