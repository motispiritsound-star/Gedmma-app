import { maakKaart, BANDEN, bandVan } from '/kaart.js';

const $ = (id) => document.getElementById(id);
const esc = (waarde) => String(waarde ?? '').replace(/[&<>"]/g, (teken) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[teken]);
const euro = (cent) => `€ ${((cent ?? 0) / 100).toFixed(2).replace('.', ',')}`;
const datum = (waarde) => waarde ? new Date(waarde.replace(' ', 'T') + 'Z').toLocaleString('nl-NL',
  { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const ERNST = { kritiek: 'Kritiek', hoog: 'Hoog', middel: 'Middel', laag: 'Laag' };
/** Rechtsvormen die onder de telemarketingregels vallen. */
const NATUURLIJK = ['eenmanszaak', 'vof', 'maatschap', 'cv'];

const staat = {
  ik: null,
  fases: [],
  agenten: [],
  sjablonen: [],
  filters: { zoek: '', plaats: '', fase: '', agent: '', contact: false, belbaar: false, levend: false, achteruit: false, band: '', sort: 'prioriteit' },
  gekozen: null,
  getoond: 100,
  totaal: 0,
  weergave: 'kaart',
  afzender: {},
};

let kaart = null;

// --------------------------------------------------------------------------
async function api(pad, opties = {}) {
  const antwoord = await fetch(pad, {
    ...opties,
    headers: opties.body ? { 'content-type': 'application/json' } : undefined,
  });
  if (antwoord.status === 401) { toonInlogscherm(); throw new Error('Niet ingelogd.'); }
  const inhoud = await antwoord.json().catch(() => ({}));
  if (!antwoord.ok) throw new Error(inhoud.fout ?? `Er ging iets mis (${antwoord.status}).`);
  return inhoud;
}

// --------------------------------------------------------------------------
// Meldingen: kort in beeld rechtsonder, zodat je nooit hoeft te zoeken waar
// het antwoord op je klik staat.
// --------------------------------------------------------------------------
const TEKENS = {
  goed: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.2"/><path d="M6.8 10.3l2.2 2.2 4.2-4.7"/></svg>',
  fout: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.2"/><path d="M10 6.4v4.4M10 13.4h.01"/></svg>',
};

function toon(tekst, soort = 'goed') {
  const melding = document.createElement('div');
  melding.className = `toast ${soort}`;
  melding.innerHTML = `${TEKENS[soort] ?? TEKENS.goed}<span></span>`;
  melding.querySelector('span').textContent = tekst;
  $('toasts').append(melding);
  setTimeout(() => {
    melding.classList.add('weg');
    melding.addEventListener('animationend', () => melding.remove(), { once: true });
  }, 3600);
}

// --------------------------------------------------------------------------
// Inloggen
// --------------------------------------------------------------------------
function toonInlogscherm(geenGebruikers = false) {
  $('inloggen').hidden = false;
  $('app').hidden = true;
  $('i-geenaccount').hidden = !geenGebruikers;
}

$('inlogformulier').addEventListener('submit', async (gebeurtenis) => {
  gebeurtenis.preventDefault();
  $('i-melding').textContent = '';
  try {
    await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('i-email').value, wachtwoord: $('i-wachtwoord').value }),
    });
    $('i-wachtwoord').value = '';
    await start();
  } catch (fout) {
    $('i-melding').textContent = fout.message;
  }
});

$('uitloggen').addEventListener('click', async () => {
  await fetch('/api/uitloggen', { method: 'POST' });
  location.reload();
});

// --------------------------------------------------------------------------
// Opstarten
// --------------------------------------------------------------------------
async function start() {
  const mij = await fetch('/api/mij').then((antwoord) => antwoord.json());
  if (!mij.ingelogd) { toonInlogscherm(mij.geenGebruikers); return; }

  staat.ik = mij.gebruiker;
  $('inloggen').hidden = true;
  $('app').hidden = false;
  $('ik-naam').textContent = mij.gebruiker.naam;
  $('ik-rol').textContent = mij.gebruiker.rol;
  $('ik-avatar').textContent = initialen(mij.gebruiker.naam);
  document.querySelector('[data-weergave="team"]').hidden = mij.gebruiker.rol !== 'eigenaar';
  toonSkelet($('rijen'));

  const [overzicht, sjablonen] = await Promise.all([api('/api/overzicht'), api('/api/sjablonen')]);
  staat.fases = overzicht.fases;
  staat.agenten = overzicht.agenten;
  staat.sjablonen = sjablonen.sjablonen;
  staat.rechtsvormen = overzicht.rechtsvormen;
  staat.benaderbaarheid = overzicht.benaderbaarheid;
  staat.kvk = overzicht.kvk ?? { beschikbaar: false, centPerBevraging: 2 };

  vulKeuzelijsten(overzicht);

  if (!kaart) {
    kaart = maakKaart($('kaart'), {
      onKiezen: kiesLead, onZweven: toonTip, eigenaarId: mij.gebruiker.id,
      onVerschuiven: () => haalKaart(),
    });
    await kaart.laadOmtrek();
  }
  $('kaartnoot').textContent = `${overzicht.cijfers.opKaart} van ${overzicht.cijfers.bedrijven} bedrijven staan op de kaart`;
  zetNieuwsTeller(overzicht.ongelezenNieuws);
  $('nieuws-plaatsen').hidden = mij.gebruiker.rol !== 'eigenaar';
  $('tel-leads').textContent = overzicht.cijfers.gescand.toLocaleString('nl-NL');
  $('tel-mijn').textContent = overzicht.mijnOpenLeads || '';

  await ververs();

  // Wie werk heeft openstaan begint op de werklijst; dat is waar de omzet zit.
  if (mij.gebruiker.rol === 'eigenaar') {
    vandaagWie = 'team';
    for (const knop of $('vandaag-wie').querySelectorAll('.segmentknop')) {
      knop.setAttribute('aria-pressed', String(knop.dataset.wie === 'team'));
    }
  }
  const { druk } = await api(`/api/vandaag${vandaagWie === 'team' ? '?iedereen=1' : ''}`);
  zetWerkTeller(druk);
  if (druk.totaal > 0) await wisselNaar('vandaag');
  else zetPaginakop('kaart');
}

/** De titel boven het werkgebied hoort bij het scherm waar je in staat. */
const PAGINAS = {
  vandaag: ['Vandaag', 'Wat er nu opgevolgd moet worden, het langst wachtende bovenaan.'],
  kaart: ['Kaart & leads', 'Alle gescande bedrijven, de slechtste sites eerst.'],
  mijn: ['Mijn lijst', 'De bedrijven die op jouw naam staan.'],
  team: ['Team & omzet', 'Wat het team doet en wat het oplevert.'],
  nieuws: ['Nieuws', 'Berichten voor iedereen die meewerkt.'],
};

function zetPaginakop(weergave) {
  const [titel, sub] = PAGINAS[weergave] ?? PAGINAS.kaart;
  $('pagina-titel').textContent = titel;
  $('pagina-sub').textContent = sub;
  document.title = `${titel} · Webscan NL`;
}

/** Vier grijze regels terwijl de eerste lijst nog onderweg is. */
function toonSkelet(doel) {
  doel.innerHTML = Array.from({ length: 6 }, () =>
    '<tr class="skelet"><td><span></span></td><td><span></span></td><td><span></span></td></tr>').join('');
}

function vulKeuzelijsten(overzicht) {
  $('f-plaats').innerHTML = '<option value="">Alle plaatsen</option>' +
    overzicht.plaatsen.map((rij) => `<option value="${esc(rij.plaats)}">${esc(rij.plaats)} (${rij.aantal})</option>`).join('');
  $('f-fase').innerHTML = '<option value="">Alle fases</option>' +
    staat.fases.map((fase) => `<option value="${fase.id}">${fase.label}</option>`).join('');
  $('f-agent').innerHTML = '<option value="">Iedereen</option>' +
    '<option value="mij">Van mij</option>' +
    '<option value="collegas">Van collega\'s</option>' +
    '<option value="vrij">Nog niet toegewezen</option>' +
    staat.agenten.map((agent) => `<option value="${agent.id}">${esc(agent.naam)}</option>`).join('');
}

// --------------------------------------------------------------------------
// Filters
// --------------------------------------------------------------------------
function queryVan(extra = {}) {
  const params = new URLSearchParams();
  const zet = (sleutel, waarde) => { if (waarde !== '' && waarde != null && waarde !== false) params.set(sleutel, waarde); };
  zet('zoek', staat.filters.zoek);
  zet('city', staat.filters.plaats);
  zet('fase', staat.filters.fase);
  if (staat.filters.agent === 'vrij') zet('vrij', '1');
  else if (staat.filters.agent === 'mij') zet('agent', staat.ik.id);
  else if (staat.filters.agent === 'collegas') zet('collegas', '1');
  else zet('agent', staat.filters.agent);
  if (staat.filters.contact) zet('metContact', '1');
  if (staat.filters.belbaar) zet('belbaar', '1');
  if (staat.filters.levend) zet('levend', '1');
  if (staat.filters.achteruit) zet('achteruit', '1');
  zet('sort', staat.filters.sort);
  if (staat.filters.band) {
    const band = BANDEN.find((rij) => rij.id === staat.filters.band);
    zet('minScore', band.vanaf);
    zet('maxScore', band.tot);
  }
  for (const [sleutel, waarde] of Object.entries(extra)) zet(sleutel, waarde);
  return params;
}

/**
 * Telt hoeveel bedrijven er per kwaliteitsband zijn, en laat erop filteren.
 * Bij samengevatte vakjes zijn de losse scores er niet, dus tonen we een streepje.
 */
function tekenBanden(punten, totaal) {
  $('bandvak').innerHTML = BANDEN.map((band) => {
    const aantal = punten
      ? punten.filter((punt) => bandVan(punt.score).id === band.id).length.toLocaleString('nl-NL')
      : '–';
    return `<button data-band="${band.id}" aria-pressed="${staat.filters.band === band.id}"
      title="${punten ? '' : `Zoom in of filter om de verdeling over ${(totaal ?? 0).toLocaleString('nl-NL')} bedrijven te zien`}">
      <b>${aantal}</b>
      <span><i class="bol" style="background:${band.kleur}"></i>${band.label}</span>
    </button>`;
  }).join('');
  for (const knop of $('bandvak').querySelectorAll('button')) {
    knop.addEventListener('click', () => {
      staat.filters.band = staat.filters.band === knop.dataset.band ? '' : knop.dataset.band;
      ververs();
    });
  }
}

const PAGINA = 100;

async function ververs({ behoudPagina = false } = {}) {
  if (!behoudPagina) staat.getoond = PAGINA;
  const lijst = await api('/api/leads?' + queryVan({ limit: staat.getoond }));

  staat.totaal = lijst.totaal;
  $('telling').textContent = `${lijst.leads.length} getoond van ${lijst.totaal.toLocaleString('nl-NL')}`;
  $('f-export').href = '/api/export.csv?' + queryVan({ limit: 100000 });
  tekenLijst($('rijen'), $('geen'), lijst.leads, 'kaart');
  tekenMeerKnop();

  if (!staat.gekozen) $('detail').innerHTML = LEEG_PANEEL;

  await haalKaart();
}

function tekenMeerKnop() {
  const meer = $('meer');
  const rest = staat.totaal - Math.min(staat.getoond, staat.totaal);
  meer.hidden = rest <= 0;
  if (rest > 0) meer.textContent = `Nog ${rest.toLocaleString('nl-NL')} tonen`;
}

$('meer').addEventListener('click', async () => {
  staat.getoond += 400;
  await ververs({ behoudPagina: true });
});

/**
 * Haalt de kaartgegevens op. Zodra je inzoomt vraagt hij alleen de bedrijven op
 * die in beeld zijn; op landsniveau krijgt hij samengevatte vakjes, want honderd­
 * duizend losse bolletjes hebben geen zin en zijn zwaar om te versturen.
 */
async function haalKaart() {
  const kader = kaart.zichtbaarKader();
  const extra = { max: 4000 };
  if (kader.schaal > 2.5) {
    Object.assign(extra, {
      noord: kader.noord.toFixed(4), zuid: kader.zuid.toFixed(4),
      oost: kader.oost.toFixed(4), west: kader.west.toFixed(4),
    });
  }

  const gegevens = await api('/api/kaart?' + queryVan(extra));
  if (gegevens.modus === 'vakjes') {
    kaart.zetVakjes(gegevens.vakjes);
    tekenBanden(null, gegevens.totaal);
    $('kaartnoot').textContent = `${gegevens.totaal.toLocaleString('nl-NL')} bedrijven — zoom in voor losse bolletjes`;
  } else {
    kaart.zetPunten(gegevens.punten);
    tekenBanden(gegevens.punten, gegevens.totaal);
    $('kaartnoot').textContent = `${gegevens.punten.length.toLocaleString('nl-NL')} bedrijven in beeld`;
  }
  if (staat.gekozen) kaart.zetGekozen(staat.gekozen);
}

// --------------------------------------------------------------------------
// Lijst
// --------------------------------------------------------------------------
const bolVan = (score) => `<span class="bol bol-${bandVan(score).id}" title="${bandVan(score).label}"></span>`;
/** De score als gekleurd blokje: in één oogopslag rood, oranje of groen. */
const scoreVan = (score) =>
  `<span class="score s-${bandVan(score).id}" title="${bandVan(score).label}">${score ?? '–'}</span>`;
const faseLabel = (id) => staat.fases.find((fase) => fase.id === id)?.label ?? id;
const isMijlpaal = (id) => Boolean(staat.fases.find((fase) => fase.id === id)?.mijlpaal);

/** Hoe levend het bedrijf oogt — los van hoe slecht de site is. */
const LEVEN = [
  { vanaf: 60, id: 'levend', label: 'draait' },
  { vanaf: 35, id: 'onduidelijk', label: 'onduidelijk' },
  { vanaf: 0, id: 'stil', label: 'stil' },
];
const levenVan = (score) => LEVEN.find((rij) => (score ?? 0) >= rij.vanaf) ?? LEVEN[2];

/** Hoeveel de score veranderd is sinds de vorige scan. */
const verschilVan = (lead) =>
  lead.vorige_score === null || lead.score === null ? null : lead.score - lead.vorige_score;

function verschilChip(lead) {
  const verschil = verschilVan(lead);
  if (verschil === null || Math.abs(verschil) < 3) return '';
  const omlaag = verschil < 0;
  return `<span class="verschil ${omlaag ? 'omlaag' : 'omhoog'}"
    title="Was ${lead.vorige_score} bij de vorige scan">${omlaag ? '▼' : '▲'}${Math.abs(verschil)}</span>`;
}

const IKOON = {
  telefoon: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6.4 3.5l1.8 3-1.4 1.6a9 9 0 004.1 4.1l1.6-1.4 3 1.8-.5 2.4c-.2.7-.9 1.1-1.6 1C8.6 15.3 4.7 11.4 3.6 5.6c-.1-.7.3-1.4 1-1.6z"/></svg>',
  mail: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5.5h14v9H3z"/><path d="M3.4 6l6.6 5 6.6-5"/></svg>',
};

const initialen = (naam) => naam.split(/\s+/).filter(Boolean).slice(0, 2)
  .map((deel) => deel[0].toUpperCase()).join('');

/** Laat zien wie er met een bedrijf bezig is — of dat het nog vrij is. */
function agentChip(lead) {
  if (!lead.toegewezen_aan) return '<div class="sub">vrij</div>';
  const ikzelf = lead.toegewezen_aan === staat.ik.id;
  return `<div class="agentchip${ikzelf ? ' ikzelf' : ''}">
    <span class="initialen">${esc(initialen(lead.agent_naam ?? '?'))}</span>${esc(ikzelf ? 'jij' : lead.agent_naam)}
  </div>`;
}

/** Wat er in het rechterpaneel staat zolang je niets hebt aangeklikt. */
const LEEG_PANEEL = `
  <div class="leeg">
    <span class="leegteken" aria-hidden="true">
      <svg viewBox="0 0 20 20"><path d="M2.5 5.5l5-2 5 2 5-2v11l-5 2-5-2-5 2z"/><path d="M7.5 3.5v11M12.5 5.5v11"/></svg>
    </span>
    <b>Kies een bedrijf</b>
    <span class="sub">Klik een bolletje op de kaart of een regel in de lijst aan.<br>
      Groen is een goede site, oranje matig, rood slecht.</span>
  </div>`;

function tekenLijst(tbody, leegVak, leads, welke) {
  leegVak.hidden = leads.length > 0;
  const metActie = welke === 'mijn';

  tbody.innerHTML = leads.map((lead) => {
    const telefoon = lead.contact.phones[0] ?? '';
    const email = lead.contact.emails[0] ?? '';
    const bezetting = !lead.toegewezen_aan ? ''
      : lead.toegewezen_aan === staat.ik.id ? ' van-mij' : ' van-collega';
    const alleenMailen = telefoon && NATUURLIJK.includes(lead.rechtsvorm ?? '') && !lead.bel_toestemming;
    // Eén regel met wat je nodig hebt om contact te leggen: nummer, mailadres,
    // en of bellen wel mag. Wat niet past kapt af in plaats van de rij op te rekken.
    const contactregel = [
      telefoon ? `<span class="merkje${alleenMailen ? ' mag-niet' : ''}" title="${alleenMailen
        ? 'Bellen mag alleen met toestemming' : 'Telefoonnummer'}">${IKOON.telefoon}${esc(telefoon)}</span>` : '',
      email ? `<span class="merkje" title="E-mailadres">${IKOON.mail}${esc(email)}</span>` : '',
      !telefoon && !email ? '<span class="merkje leegje">geen contactgegevens</span>' : '',
    ].join('');

    return `
    <tr class="${bezetting.trim()}" data-id="${lead.id}" tabindex="0" aria-selected="${lead.id === staat.gekozen}">
      <td class="kwaliteit">${scoreVan(lead.score)}${verschilChip(lead)}
          <div class="leven l-${levenVan(lead.leven).id}" title="Levenstekenen: ${lead.leven ?? '?'}/100">${levenVan(lead.leven).label}</div></td>
      <td class="bedrijf">
          <div class="naamregel"><span class="naam">${esc(lead.name)}</span>
            <span class="sub mono plaats">${esc(lead.domain)}${lead.city ? ' · ' + esc(lead.city) : ''}</span></div>
          <div class="tweede">${metActie
            ? `Volgende actie: ${lead.volgende_actie_op ? esc(lead.volgende_actie_op) : 'nog niet ingepland'}`
            : esc(lead.topIssues[0]?.title ?? 'Geen problemen gevonden')}</div>
          <div class="merkjes">${contactregel}</div></td>
      <td class="fasekolom"><span class="fasepil ${lead.fase}">${esc(faseLabel(lead.fase))}</span>
          ${welke === 'kaart' ? agentChip(lead) : ''}</td>
    </tr>`;
  }).join('');

  for (const rij of tbody.querySelectorAll('tr')) {
    const kies = () => kiesLead({ id: Number(rij.dataset.id) });
    rij.addEventListener('click', kies);
    rij.addEventListener('keydown', (gebeurtenis) => {
      if (gebeurtenis.key === 'Enter' || gebeurtenis.key === ' ') { gebeurtenis.preventDefault(); kies(); }
    });
  }
}

// --------------------------------------------------------------------------
// Kaarttip
// --------------------------------------------------------------------------
function toonTip(cluster, x, y) {
  const tip = $('kaarttip');
  if (!cluster) { tip.hidden = true; return; }
  tip.hidden = false;
  tip.style.left = `${Math.min(x + 14, window.innerWidth - 260)}px`;
  tip.style.top = `${y + 16}px`;
  if (cluster.aantal > 1) {
    tip.innerHTML = `<b>${cluster.aantal} bedrijven</b><span class="sub">gemiddeld ${Math.round(cluster.som / cluster.aantal)}/100 — klik om in te zoomen</span>`;
    return;
  }
  const punt = cluster.punt;
  const bezig = !punt.agentId ? 'nog vrij'
    : punt.agentId === staat.ik.id ? 'jij bent hiermee bezig'
    : `${punt.agent} is hiermee bezig`;
  tip.innerHTML = `<b>${esc(punt.naam)}</b><span class="sub">${esc(punt.plaats ?? '')} · score ${punt.score} · ${esc(faseLabel(punt.fase))}<br>${esc(bezig)}</span>`;
}

// --------------------------------------------------------------------------
// Detailpaneel
// --------------------------------------------------------------------------
async function kiesLead(punt) {
  staat.gekozen = punt.id;
  kaart?.zetGekozen(punt.id);
  for (const rij of document.querySelectorAll('tbody tr[data-id]')) {
    rij.setAttribute('aria-selected', String(Number(rij.dataset.id) === punt.id));
  }
  const lead = await api(`/api/leads/${punt.id}`);
  const doel = staat.weergave === 'mijn' ? $('mijn-detail')
    : staat.weergave === 'vandaag' ? $('vandaag-detail') : $('detail');
  tekenDetail(doel, lead);
  if (lead.lat && lead.lon && staat.weergave === 'kaart') kaart?.zetGekozen(lead.id);
}

const SOCIAL_LABEL = { facebook:'Facebook', instagram:'Instagram', linkedin:'LinkedIn',
  youtube:'YouTube', x:'X', tiktok:'TikTok' };

/** Alles wat we van dit bedrijf weten om contact te leggen, op één plek. */
function contactblok(lead) {
  const contact = lead.contact;
  const telefoonlinks = contact.phones.map((nummer) =>
    `<a class="knop klein" href="tel:${esc(nummer.replace(/[^0-9+]/g, ''))}">${esc(nummer)}</a>`).join(' ');
  const maillinks = contact.emails.map((adres) =>
    `<a class="knop klein" href="mailto:${esc(adres)}">${esc(adres)}</a>`).join(' ');
  const socials = Object.entries(contact.socials ?? {})
    .map(([naam, href]) => `<a class="knop klein" href="${esc(href)}" target="_blank" rel="noopener">${SOCIAL_LABEL[naam] ?? naam}</a>`)
    .join(' ');

  const regels = [];
  if (contact.adres) {
    regels.push(['Adres', [contact.adres.adres, `${contact.adres.postcode} ${contact.adres.plaats}`.trim()]
      .filter(Boolean).join(', ')]);
  }
  if (contact.openingstijden) regels.push(['Open', contact.openingstijden]);
  if (contact.kvk) regels.push(['KvK', contact.kvk]);
  if (contact.btw) regels.push(['Btw', contact.btw]);

  const niets = contact.phones.length === 0 && contact.emails.length === 0;

  return `<div class="deel contactvak">
    <span class="label-klein">Contactgegevens</span>
    ${niets ? '<p class="sub" style="margin:0 0 8px">Niets gevonden op de site — probeer het contactformulier of zoek het op in het KVK-register.</p>' : ''}
    ${telefoonlinks ? `<div class="rij">${telefoonlinks}</div>` : ''}
    ${maillinks ? `<div class="rij">${maillinks}</div>` : ''}
    ${contact.whatsapp ? `<div class="rij"><a class="knop klein" href="https://wa.me/${esc(contact.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a></div>` : ''}
    ${regels.length > 0 ? `<dl class="gegevens">${regels.map(([naam, waarde]) =>
      `<dt>${esc(naam)}</dt><dd>${esc(waarde)}</dd>`).join('')}</dl>` : ''}
    ${socials ? `<div class="rij">${socials}</div>` : ''}
    <p class="sub" style="margin:8px 0 0">
      ${contact.vanEerdereScan
        ? `Deze gegevens komen uit de scan van ${esc(datum(contact.vanEerdereScan))}; de site geeft nu niets meer prijs.`
        : `${contact.heeftFormulier ? 'Er is een contactformulier op de site. ' : ''}${contact.bron ? 'Ook de contactpagina is bekeken.' : 'Alleen de homepage is bekeken.'}`}
    </p>
  </div>`;
}

const kwesties = (lijst) => lijst.map((kwestie) => `
  <div class="kwestie i-${kwestie.severity}">
    <i></i><b>${esc(kwestie.title)}</b>
    <p><span class="ernst">${ERNST[kwestie.severity]}</span> — ${esc(kwestie.advies)}</p>
  </div>`).join('');

function tekenDetail(doel, lead) {
  const oordeel = lead.report?.verdict ?? { categories: [], issues: [], label: '' };
  const band = bandVan(lead.score ?? 0);
  const isEigenaar = staat.ik.rol === 'eigenaar';
  const vanMij = lead.toegewezen_aan === staat.ik.id;
  const vrij = lead.toegewezen_aan === null;
  const magWerken = isEigenaar || vanMij || vrij;

  doel.innerHTML = `
    <div class="paneelkop">
      <div>
        <h2>${esc(lead.name)}</h2>
        <div class="sub mono"><a href="${esc(lead.website)}" target="_blank" rel="noopener">${esc(lead.domain)}</a></div>
        <div class="sub">${esc(lead.city ?? '')}${lead.branch ? ' · ' + esc(lead.branch) : ''}</div>
      </div>
      <div class="groot">
        <b style="color:${band.kleur}">${lead.score ?? '–'}</b>
        <span>${esc(band.label)} · ${esc(lead.grade ?? '')}</span>
      </div>
    </div>

    <div class="rij">
      <span class="fasepil ${lead.fase}">${esc(faseLabel(lead.fase))}</span>
      ${lead.klant_status === 'actief' ? `<span class="fasepil klant">klant · ${euro(lead.maandbedrag_cent)}/mnd</span>` : ''}
    </div>

    ${lead.toegewezen_aan && !vanMij
      ? `<div class="banner bezet"><span>👤</span><div><b>${esc(lead.agent_naam)} is hiermee bezig</b><br>
          ${lead.toegewezen_op ? `Opgepakt op ${esc(datum(lead.toegewezen_op))}. ` : ''}Bel dit bedrijf niet zonder overleg.
          ${isEigenaar ? 'Als eigenaar kun je de lead hieronder aan iemand anders geven.' : ''}</div></div>`
      : vanMij
      ? '<div class="banner"><span>✋</span><div><b>Jij bent hiermee bezig.</b> Niemand anders kan deze lead oppakken.</div></div>'
      : ''}

    ${isMijlpaal(lead.fase)
      ? '<div class="banner mijlpaal"><span>🎯</span><div><b>Opdracht binnen.</b> Je mag de site kosteloos herbouwen en op onze hosting zetten. Vanaf hier is het uitvoeren.</div></div>'
      : ''}

    ${lead.geblokkeerd
      ? `<div class="banner verboden"><span>⛔</span><div><b>Niet benaderen.</b>
          ${esc(lead.geblokkeerd_reden ?? 'Dit bedrijf heeft zich afgemeld.')} Bel en mail dit bedrijf niet meer.</div></div>`
      : !lead.bellen.mag
      ? `<div class="banner verboden"><span>📵</span><div><b>Bellen mag niet.</b> ${esc(lead.bellen.reden)}
          ${lead.bellen.route ? `<br>${esc(lead.bellen.route)}` : ''}</div></div>`
      : lead.bel_toestemming
      ? `<div class="banner toegestaan"><span>☎️</span><div><b>Bellen mag.</b> Toestemming vastgelegd
          ${lead.toestemming_via ? `via ${esc(lead.toestemming_via)}` : ''} op ${esc(datum(lead.toestemming_op))}.</div></div>`
      : ''}

    ${vrij ? '<div class="rij"><button class="knop sterk" data-actie="claim">Deze neem ik</button></div>' : ''}

    ${verschilVan(lead) !== null && Math.abs(verschilVan(lead)) >= 3
      ? `<div class="banner ${verschilVan(lead) < 0 ? 'verboden' : 'toegestaan'}">
          <span>${verschilVan(lead) < 0 ? '📉' : '📈'}</span>
          <div><b>${verschilVan(lead) < 0 ? 'Achteruitgegaan' : 'Vooruitgegaan'} sinds de vorige scan.</b>
          Van ${lead.vorige_score} naar ${lead.score}, gemeten op ${esc(datum(lead.vorige_scan_op))}.
          ${verschilVan(lead) < 0 ? 'Dat is een goede aanleiding om te bellen.' : 'Mogelijk heeft iemand anders hem al opgepakt.'}</div></div>`
      : ''}

    ${contactblok(lead)}
    ${isEigenaar ? `<div class="rij">
      <select class="veld" data-actie="toewijzen">
        <option value="">— toewijzen aan —</option>
        ${staat.agenten.map((agent) => `<option value="${agent.id}" ${agent.id === lead.toegewezen_aan ? 'selected' : ''}>${esc(agent.naam)}</option>`).join('')}
      </select></div>` : ''}

    ${magWerken ? `
    <div class="deel">
      <span class="label-klein">Wat heb je gedaan?</span>
      <div class="rij">
        ${['gebeld', 'voicemail', 'mail', 'afspraak', 'notitie'].map((soort) => {
          const telefonisch = soort === 'gebeld' || soort === 'voicemail';
          const uit = (telefonisch && !lead.bellen.mag) || (soort === 'mail' && !lead.mailen.mag);
          return `<button class="knop" data-log="${soort}" ${uit ? 'disabled title="' + esc(telefonisch ? lead.bellen.reden : lead.mailen.reden) + '"' : ''}>${soort[0].toUpperCase() + soort.slice(1)}</button>`;
        }).join('')}
      </div>
      <textarea class="klein" id="d-notitie" placeholder="Notitie bij deze stap (optioneel)"></textarea>
      <div class="rij">
        <select class="veld" data-actie="fase">
          ${staat.fases.map((fase) => `<option value="${fase.id}" ${fase.id === lead.fase ? 'selected' : ''}>${fase.label} — ${fase.uitleg}</option>`).join('')}
        </select>
      </div>
      <div class="rij">
        <label class="sub" for="d-actie">Terugbellen op</label>
        <input class="veld" id="d-actie" type="date" value="${esc(lead.volgende_actie_op ?? '')}">
        <button class="knop" data-actie="volgende">Vastleggen</button>
      </div>
    </div>` : ''}

    ${lead.report?.leven ? `<div class="deel">
      <span class="label-klein">Draait dit bedrijf nog?</span>
      <div class="meter">
        <span class="meter-naam">${esc(lead.report.leven.label)}</span>
        <span class="meter-waarde">${lead.report.leven.score}/100</span>
        <span class="meter-spoor"><i class="meter-vul" style="width:${lead.report.leven.score}%"></i></span>
      </div>
      <div class="meter">
        <span class="meter-naam">Prioriteit als lead</span>
        <span class="meter-waarde">${lead.prioriteit ?? '–'}/100</span>
        <span class="meter-spoor"><i class="meter-vul" style="width:${lead.prioriteit ?? 0}%"></i></span>
      </div>
      <p class="sub" style="margin:2px 0 8px">${esc(lead.report.prioriteit?.uitleg ?? '')}</p>
      <ul class="tekens">
        ${lead.report.leven.tekens.slice(0, 4).map((teken) => `<li class="ja">${esc(teken.tekst)}</li>`).join('')}
        ${lead.report.leven.twijfels.slice(0, 3).map((teken) => `<li class="nee">${esc(teken.tekst)}</li>`).join('')}
      </ul>
    </div>` : ''}

    <div class="deel">
      <span class="label-klein">Score per onderdeel</span>
      ${(oordeel.categories ?? []).map((categorie) => `
        <div class="meter">
          <span class="meter-naam">${esc(categorie.label)}</span>
          <span class="meter-waarde">${categorie.score}/${categorie.max}</span>
          <span class="meter-spoor"><i class="meter-vul" style="width:${Math.round((categorie.score / categorie.max) * 100)}%"></i></span>
        </div>`).join('')}
    </div>

    <div class="deel">
      <span class="label-klein">Gevonden problemen (${(oordeel.issues ?? []).length})</span>
      ${kwesties((oordeel.issues ?? []).filter((kwestie) => kwestie.severity !== 'laag'))}
      ${(oordeel.issues ?? []).some((kwestie) => kwestie.severity === 'laag')
        ? `<details class="rest"><summary>Nog ${(oordeel.issues ?? []).filter((k) => k.severity === 'laag').length} kleine punten</summary>
           ${kwesties(oordeel.issues.filter((kwestie) => kwestie.severity === 'laag'))}</details>` : ''}
    </div>

    ${magWerken ? `
    <div class="deel">
      <span class="label-klein">Mail versturen</span>
      <select class="veld" id="d-sjabloon" style="width:100%">
        ${staat.sjablonen.map((sjabloon) => `<option value="${sjabloon.id}">${esc(sjabloon.naam)}</option>`).join('')}
      </select>
      <p class="sub" id="d-wanneer" style="margin:5px 0 0"></p>
      <div class="rij">
        <input class="veld" id="a-bedrijf" placeholder="Jouw bedrijf" style="flex:1" value="${esc(staat.afzender.bedrijf ?? '')}">
        <input class="veld" id="a-telefoon" placeholder="Telefoon" style="width:130px" value="${esc(staat.afzender.telefoon ?? '')}">
      </div>
      <input class="veld" id="d-onderwerp" style="width:100%;margin-top:7px" readonly>
      <textarea id="d-mail" spellcheck="false" style="margin-top:7px"></textarea>
      <div class="rij">
        <a class="knop sterk" id="d-open" href="#" target="_blank" rel="noopener">Open in mailprogramma</a>
        <button class="knop" data-actie="kopieer">Kopieer</button>
        <button class="knop" data-actie="verstuurd">Verstuurd — leg vast</button>
      </div>
    </div>

    <div class="deel">
      <span class="label-klein">Mag je benaderen?</span>
      <div class="rij">
        <select class="veld" id="d-rechtsvorm" style="flex:1">
          <option value="">Rechtsvorm onbekend</option>
          ${staat.rechtsvormen.map((vorm) => `<option value="${vorm.id}" ${vorm.id === lead.rechtsvorm ? 'selected' : ''}>${esc(vorm.label)}${vorm.natuurlijkPersoon ? ' — bellen alleen met toestemming' : ''}</option>`).join('')}
        </select>
      </div>
      ${staat.kvk.beschikbaar ? `<div class="rij">
        <button class="knop klein" data-actie="verrijken">Ophalen bij de KVK
          (${(staat.kvk.centPerBevraging / 100).toFixed(2).replace('.', ',')} euro)</button>
        <span class="sub" id="d-kvk">${lead.kvk_number ? 'KVK ' + esc(lead.kvk_number) : ''}</span>
      </div>` : ''}
      ${lead.bel_toestemming
        ? '<div class="rij"><button class="knop" data-actie="toestemming-intrekken">Toestemming intrekken</button></div>'
        : `<div class="rij">
            <select class="veld" id="d-via" style="width:150px">
              <option value="mailreactie">per mail</option>
              <option value="formulier">via formulier</option>
              <option value="schriftelijk">schriftelijk</option>
              <option value="telefonisch bevestigd">telefonisch bevestigd</option>
            </select>
            <input class="veld" id="d-bewijs" placeholder="Waar blijkt het uit?" style="flex:1">
            <button class="knop" data-actie="toestemming">Toestemming vastleggen</button>
          </div>`}
      <div class="rij">
        ${lead.geblokkeerd
          ? (isEigenaar ? '<button class="knop" data-actie="deblokkeren">Blokkade opheffen</button>' : '')
          : '<button class="knop gevaarlijk" data-actie="blokkeren">Wil niet benaderd worden</button>'}
      </div>
    </div>

    <div class="deel">
      <span class="label-klein">Klant maken</span>
      <div class="rij">
        <input class="veld" id="d-bedrag" type="number" min="0" step="0.5" placeholder="Per maand (€)"
               style="width:150px" value="${lead.maandbedrag_cent ? (lead.maandbedrag_cent / 100).toFixed(2) : ''}">
        <select class="veld" id="d-klantstatus">
          <option value="actief">Betalend</option><option value="proef">Proefperiode</option>
        </select>
        <button class="knop sterk" data-actie="klant">Vastleggen</button>
      </div>
    </div>

    <div class="deel">
      <span class="label-klein">Testimonial ${lead.testimonial_sterren ? `(${lead.testimonial_sterren}★ ontvangen)` : ''}</span>
      <textarea class="klein" id="d-testimonial" placeholder="Wat zei de klant?"></textarea>
      <div class="rij">
        <select class="veld" id="d-sterren">
          ${[5, 4, 3, 2, 1].map((aantal) => `<option value="${aantal}">${'★'.repeat(aantal)}</option>`).join('')}
        </select>
        <label class="schakel"><input type="checkbox" id="d-publiceerbaar" checked> mag ik publiceren</label>
        <button class="knop" data-actie="testimonial">Opslaan</button>
      </div>
    </div>` : ''}

    <div class="deel">
      <span class="label-klein">Geschiedenis (${lead.geschiedenis.length})</span>
      ${lead.geschiedenis.length === 0 ? '<p class="sub" style="margin:0">Nog niets vastgelegd.</p>' : `
        <div class="geschiedenis">${lead.geschiedenis.map((gebeurtenis) => `
          <div class="gebeurtenis">
            <time>${datum(gebeurtenis.op)}</time>
            <div>${esc(gebeurtenis.soort)}${gebeurtenis.uitkomst ? ' → ' + esc(gebeurtenis.uitkomst) : ''}
              ${gebeurtenis.notitie ? `<div class="sub">${esc(gebeurtenis.notitie)}</div>` : ''}
              <div class="wie">${esc(gebeurtenis.gebruiker_naam ?? 'systeem')}</div>
            </div>
          </div>`).join('')}</div>`}
    </div>

    <p class="melding" data-melding></p>`;

  koppelDetailKnoppen(doel, lead);
  if (magWerken) haalMail(doel, lead.id);
}

function koppelDetailKnoppen(doel, lead) {
  const melding = doel.querySelector('[data-melding]');
  // Alles wat je doet bevestigt zichzelf rechtsonder; het paneel zelf blijft rustig.
  const zeg = (tekst, goed = true) => {
    toon(tekst, goed ? 'goed' : 'fout');
    if (melding) melding.textContent = '';
  };
  const notitie = () => doel.querySelector('#d-notitie')?.value.trim() || undefined;

  const post = async (pad, body, bericht) => {
    try {
      await api(pad, { method: 'POST', body: JSON.stringify(body) });
      zeg(bericht);
      const vers = await api(`/api/leads/${lead.id}`);
      tekenDetail(doel, vers);
      ververs();
    } catch (fout) { zeg(fout.message, false); }
  };

  doel.querySelector('[data-actie="claim"]')?.addEventListener('click', () =>
    post(`/api/leads/${lead.id}/claim`, {}, 'Deze lead staat nu op jouw naam.'));

  doel.querySelector('[data-actie="toewijzen"]')?.addEventListener('change', (gebeurtenis) =>
    post(`/api/leads/${lead.id}/toewijzen`, { agentId: Number(gebeurtenis.target.value) || null }, 'Toegewezen.'));

  for (const knop of doel.querySelectorAll('[data-log]')) {
    knop.addEventListener('click', () =>
      post(`/api/leads/${lead.id}/activiteit`, { soort: knop.dataset.log, notitie: notitie() }, 'Vastgelegd.'));
  }

  doel.querySelector('[data-actie="fase"]')?.addEventListener('change', (gebeurtenis) =>
    post(`/api/leads/${lead.id}/fase`, { fase: gebeurtenis.target.value, notitie: notitie() }, 'Fase bijgewerkt.'));

  doel.querySelector('[data-actie="volgende"]')?.addEventListener('click', () =>
    post(`/api/leads/${lead.id}/volgende-actie`, { datum: doel.querySelector('#d-actie').value || null }, 'Ingepland.'));

  doel.querySelector('#d-rechtsvorm')?.addEventListener('change', (gebeurtenis) =>
    post(`/api/leads/${lead.id}/rechtsvorm`, { rechtsvorm: gebeurtenis.target.value }, 'Rechtsvorm vastgelegd.'));

  doel.querySelector('[data-actie="verrijken"]')?.addEventListener('click', async (gebeurtenis) => {
    const knop = gebeurtenis.target;
    knop.disabled = true;
    knop.textContent = 'Bezig bij de KVK…';
    try {
      const uitkomst = await api(`/api/leads/${lead.id}/verrijken`, { method: 'POST' });
      zeg(uitkomst.rechtsvorm
        ? `KVK ${uitkomst.kvkNummer}: ${uitkomst.rechtsvormTekst}. ${uitkomst.bellen.mag ? 'Bellen mag.' : uitkomst.bellen.reden}`
        : (uitkomst.reden ?? 'Niets gevonden bij de KVK.'), Boolean(uitkomst.rechtsvorm));
      const vers = await api(`/api/leads/${lead.id}`);
      tekenDetail(doel, vers);
      ververs();
    } catch (fout) {
      zeg(fout.message, false);
      knop.disabled = false;
      knop.textContent = 'Ophalen bij de KVK';
    }
  });

  doel.querySelector('[data-actie="toestemming"]')?.addEventListener('click', () =>
    post(`/api/leads/${lead.id}/toestemming`, {
      via: doel.querySelector('#d-via').value,
      bewijs: doel.querySelector('#d-bewijs').value,
    }, 'Toestemming vastgelegd — je mag nu bellen.'));

  doel.querySelector('[data-actie="toestemming-intrekken"]')?.addEventListener('click', () =>
    post(`/api/leads/${lead.id}/toestemming`, { intrekken: true }, 'Toestemming ingetrokken.'));

  doel.querySelector('[data-actie="blokkeren"]')?.addEventListener('click', () => {
    const reden = prompt('Waarom mag dit bedrijf niet meer benaderd worden?', 'op eigen verzoek');
    if (reden === null) return;
    post(`/api/leads/${lead.id}/blokkeren`, { reden }, 'Dit bedrijf wordt niet meer benaderd.');
  });

  doel.querySelector('[data-actie="deblokkeren"]')?.addEventListener('click', () =>
    post(`/api/leads/${lead.id}/blokkeren`, { opheffen: true }, 'Blokkade opgeheven.'));

  doel.querySelector('[data-actie="klant"]')?.addEventListener('click', () =>
    post(`/api/leads/${lead.id}/klant`, {
      maandbedrag: Number(doel.querySelector('#d-bedrag').value),
      status: doel.querySelector('#d-klantstatus').value,
    }, 'Klant vastgelegd.'));

  doel.querySelector('[data-actie="testimonial"]')?.addEventListener('click', () =>
    post(`/api/leads/${lead.id}/testimonial`, {
      tekst: doel.querySelector('#d-testimonial').value,
      sterren: Number(doel.querySelector('#d-sterren').value),
      publiceerbaar: doel.querySelector('#d-publiceerbaar').checked,
    }, 'Testimonial opgeslagen.'));

  for (const veld of ['#a-bedrijf', '#a-telefoon']) {
    doel.querySelector(veld)?.addEventListener('change', () => {
      staat.afzender.bedrijf = doel.querySelector('#a-bedrijf').value;
      staat.afzender.telefoon = doel.querySelector('#a-telefoon').value;
      haalMail(doel, lead.id);
    });
  }

  doel.querySelector('#d-sjabloon')?.addEventListener('change', () => {
    staat.sjabloon = doel.querySelector('#d-sjabloon').value;
    haalMail(doel, lead.id);
  });

  doel.querySelector('[data-actie="kopieer"]')?.addEventListener('click', async () => {
    const onderwerp = doel.querySelector('#d-onderwerp').value;
    await navigator.clipboard.writeText(`Onderwerp: ${onderwerp}\n\n${doel.querySelector('#d-mail').value}`);
    zeg('Onderwerp en tekst staan op je klembord.');
  });

  doel.querySelector('[data-actie="verstuurd"]')?.addEventListener('click', async () => {
    const gekozen = staat.sjablonen.find((sjabloon) => sjabloon.id === doel.querySelector('#d-sjabloon').value);
    await post(`/api/leads/${lead.id}/activiteit`,
      { soort: 'mail', uitkomst: gekozen?.naam, notitie: doel.querySelector('#d-onderwerp').value },
      'Mail vastgelegd in de geschiedenis.');
    if (gekozen?.naFase && gekozen.naFase !== lead.fase) {
      await api(`/api/leads/${lead.id}/fase`, { method: 'POST', body: JSON.stringify({ fase: gekozen.naFase }) })
        .catch(() => {});
      const vers = await api(`/api/leads/${lead.id}`);
      tekenDetail(doel, vers);
      ververs();
    }
  });
}

async function haalMail(doel, id) {
  const veld = doel.querySelector('#d-mail');
  if (!veld) return;
  const keuze = doel.querySelector('#d-sjabloon');

  const params = new URLSearchParams();
  if (staat.sjabloon) params.set('sjabloon', staat.sjabloon);
  if (staat.afzender.bedrijf) params.set('bedrijf', staat.afzender.bedrijf);
  if (staat.afzender.telefoon) params.set('telefoon', staat.afzender.telefoon);

  try {
    const mail = await api(`/api/leads/${id}/mail?${params}`);
    keuze.value = mail.sjabloon;
    staat.sjabloon = mail.sjabloon;
    doel.querySelector('#d-onderwerp').value = mail.onderwerp;
    veld.value = mail.tekst;

    const gekozen = staat.sjablonen.find((sjabloon) => sjabloon.id === mail.sjabloon);
    doel.querySelector('#d-wanneer').textContent =
      (gekozen?.wanneer ?? '') + (mail.sjabloon === mail.voorgesteld ? ' · voorgesteld op basis van de scan' : '');

    const openen = doel.querySelector('#d-open');
    if (mail.mailto) {
      openen.href = mail.mailto;
      openen.removeAttribute('aria-disabled');
      openen.textContent = 'Open in mailprogramma';
    } else {
      openen.href = '#';
      openen.setAttribute('aria-disabled', 'true');
      openen.textContent = 'Geen e-mailadres — bel of gebruik het formulier';
    }
  } catch (fout) {
    veld.value = fout.message;
  }
}

// --------------------------------------------------------------------------
// Weergaven
// --------------------------------------------------------------------------
for (const knop of $('tabs').querySelectorAll('.tab')) {
  knop.addEventListener('click', () => wisselNaar(knop.dataset.weergave));
}

async function wisselNaar(weergave) {
  staat.weergave = weergave;
  zetPaginakop(weergave);
  for (const knop of $('tabs').querySelectorAll('.tab')) {
    knop.setAttribute('aria-pressed', String(knop.dataset.weergave === weergave));
  }
  for (const naam of ['vandaag', 'kaart', 'mijn', 'team', 'nieuws']) $(`weergave-${naam}`).hidden = naam !== weergave;

  if (weergave === 'vandaag') await toonVandaag();
  if (weergave === 'kaart') { kaart?.hermeet(); await ververs(); }
  if (weergave === 'mijn') await toonMijnLijst();
  if (weergave === 'team') await toonTeam();
  if (weergave === 'nieuws') await toonNieuws();
}

async function toonMijnLijst() {
  const overzicht = await api('/api/overzicht');
  const mijn = await api(`/api/leads?agent=${staat.ik.id}&sort=actie&limit=300`);

  $('mijn-tegels').innerHTML = [
    { waarde: overzicht.mijnOpenLeads, tekst: 'leads op jouw naam' },
    { waarde: overzicht.opdrachten.totaal, tekst: 'opdrachten binnen', klem: true },
    { waarde: overzicht.opdrachten.laatste30Dagen, tekst: 'in de laatste 30 dagen', klem: true },
    { waarde: overzicht.opdrachten.omgezet, tekst: 'daarvan betaalt inmiddels' },
  ].map((tegel) => `<div class="tegel${tegel.klem ? ' klem' : ''}"><b>${esc(tegel.waarde)}</b><span>${tegel.tekst}</span></div>`).join('');

  $('mijn-trechter').innerHTML = overzicht.trechter
    .filter((stap) => stap.aantal > 0)
    .map((stap) => `<button class="trechterstap${isMijlpaal(stap.fase) ? ' mijlpaal' : ''}" data-fase="${stap.fase}"
        aria-pressed="${staat.filters.fase === stap.fase}"><b>${stap.aantal}</b><span>${esc(stap.label)}</span></button>`).join('')
    || '<p class="sub">Nog geen leads toegewezen.</p>';

  for (const knop of $('mijn-trechter').querySelectorAll('.trechterstap')) {
    knop.addEventListener('click', async () => {
      const fase = knop.dataset.fase;
      const lijst = await api(`/api/leads?agent=${staat.ik.id}&fase=${fase}&sort=actie&limit=300`);
      tekenLijst($('mijn-rijen'), $('mijn-geen'), lijst.leads, 'mijn');
      for (const andere of $('mijn-trechter').querySelectorAll('.trechterstap')) {
        andere.setAttribute('aria-pressed', String(andere === knop));
      }
    });
  }
  tekenLijst($('mijn-rijen'), $('mijn-geen'), mijn.leads, 'mijn');
  // Het paneel hoort bij het scherm waar je in staat: had je al een bedrijf
  // open, teken dat hier opnieuw; zo niet, dan de uitleg.
  if (staat.gekozen) await kiesLead({ id: staat.gekozen });
  else $('mijn-detail').innerHTML = LEEG_PANEEL;
}

async function toonTeam() {
  const gegevens = await api('/api/team');
  const overzicht = await api('/api/overzicht');
  await vulAanbod();
  tekenPrognose(gegevens.prognose);

  $('omzettegels').innerHTML = [
    { waarde: overzicht.opdrachten.totaal, tekst: 'opdrachten binnen', klem: true },
    { waarde: overzicht.opdrachten.laatste30Dagen, tekst: 'opdrachten laatste 30 dagen', klem: true },
    { waarde: gegevens.omzet.actieveKlanten, tekst: 'betalende klanten' },
    { waarde: euro(gegevens.omzet.mrrCent), tekst: 'per maand', klem: true },
    { waarde: euro(gegevens.omzet.jaaromzetCent), tekst: 'op jaarbasis' },
    { waarde: euro(gegevens.omzet.gemiddeldeKlantCent), tekst: 'gemiddeld per klant' },
  ].map((tegel) => `<div class="tegel${tegel.klem ? ' klem' : ''}"><b>${esc(tegel.waarde)}</b><span>${tegel.tekst}</span></div>`).join('');

  $('team-rijen').innerHTML = gegevens.team.map((regel) => `
    <tr>
      <td><div class="naam">${esc(regel.naam)}</div><div class="sub">${esc(regel.rol)}</div></td>
      <td class="mono">${regel.open}</td>
      <td class="mono">${regel.gebeld_7d}</td>
      <td class="mono">${regel.afspraken}</td>
      <td class="mono"><b>${regel.opdrachten}</b>${regel.opdrachten_30d ? ` <span class="sub">+${regel.opdrachten_30d}</span>` : ''}</td>
      <td class="mono">${regel.klanten}</td>
      <td class="mono">${euro(regel.mrr_cent)}</td>
      <td class="mono" title="Eenmalig per opdracht plus een deel van de hosting, elke maand">
        ${euro(regel.provisie?.eenmaligCent ?? 0)}
        <span class="sub">+ ${euro(regel.provisie?.perMaandCent ?? 0)}/mnd</span></td>
      <td class="mono">${regel.testimonials}</td>
    </tr>`).join('');

  const grootste = Math.max(...overzicht.trechter.map((stap) => stap.aantal), 1);
  $('team-trechter').innerHTML = overzicht.trechter.map((stap) => `
    <div class="meter">
      <span class="meter-naam">${isMijlpaal(stap.fase) ? '🎯 ' : ''}${esc(stap.label)}</span>
      <span class="meter-waarde">${stap.aantal}</span>
      <span class="meter-spoor"><i class="meter-vul" style="width:${Math.round((stap.aantal / grootste) * 100)}%"></i></span>
    </div>`).join('');
}

/**
 * Wat de pijplijn waard is. De kans per fase komt uit je eigen historie zodra
 * die genoeg zegt; tot dan staan er startwaarden, en dat staat er ook bij.
 */
function tekenPrognose(prognose) {
  if (!prognose) return;
  const doel = prognose.doelMrrCent;
  const gehaald = doel > 0 ? Math.min(100, Math.round((prognose.huidigeMrrCent / doel) * 100)) : 0;
  $('doel').value = doel > 0 ? (doel / 100).toFixed(0) : '';

  const tegels = [
    { waarde: euro(prognose.huidigeMrrCent), tekst: 'nu per maand binnen', klem: true },
    { waarde: euro(prognose.verwachteMrrCent), tekst: `verwacht uit de pijplijn (${prognose.verwachteKlanten.toFixed(1)} klanten)` },
    { waarde: euro(prognose.pijplijnJaarCent), tekst: 'die pijplijn over een jaar' },
    { waarde: prognose.voorraad.aantal.toLocaleString('nl-NL'), tekst: 'nog onaangeraakt op de plank' },
  ];
  if (doel > 0) {
    tegels.push({ waarde: `${gehaald}%`, tekst: `van je doel (${euro(doel)})`, klem: true });
    tegels.push({ waarde: prognose.opdrachtenNodig, tekst: 'opdrachten nog nodig' });
  }

  $('prognose').innerHTML = `
    <div class="tegels binnenin">${tegels.map((tegel) => `
      <div class="tegel${tegel.klem ? ' klem' : ''}"><b>${esc(tegel.waarde)}</b><span>${esc(tegel.tekst)}</span></div>`).join('')}
    </div>
    ${doel > 0 ? `<div class="doelbalk"><i style="width:${gehaald}%"></i></div>` : ''}
    <table class="prognosetabel">
      <thead><tr>
        <th scope="col">Fase</th><th scope="col">Leads</th><th scope="col">Wordt klant</th>
        <th scope="col">Verwacht</th><th scope="col">Per maand</th>
      </tr></thead>
      <tbody>
        ${prognose.fases.filter((rij) => rij.aantal > 0).map((rij) => `
          <tr class="${rij.fase === 'nieuw' ? 'voorraadrij' : ''}">
            <td>${esc(rij.label)}${rij.fase === 'nieuw' ? '<span class="sub"> — voorraad, telt niet mee</span>' : ''}</td>
            <td class="mono">${rij.aantal.toLocaleString('nl-NL')}</td>
            <td class="mono">${Math.round(rij.kans * 100)}%
              <span class="sub">${rij.bron === 'gemeten' ? `gemeten (${rij.waargenomen})` : 'startwaarde'}</span></td>
            <td class="mono">${rij.verwachteKlanten.toFixed(1)}</td>
            <td class="mono">${euro(rij.verwachteMrrCent)}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <p class="sub" style="margin:10px 14px 14px">Zodra je van een fase ${25} of meer leads hebt gehad,
      rekent de prognose met je eigen conversie in plaats van met de startwaarde.</p>`;
}

$('doel-formulier').addEventListener('submit', async (gebeurtenis) => {
  gebeurtenis.preventDefault();
  try {
    await api('/api/doel', { method: 'PUT', body: JSON.stringify({ doel: Number($('doel').value) }) });
    toon('Doel vastgelegd.');
    await toonTeam();
  } catch (fout) { toon(fout.message, 'fout'); }
});

$('provisie-formulier').addEventListener('submit', async (gebeurtenis) => {
  gebeurtenis.preventDefault();
  const velden = Object.fromEntries(new FormData(gebeurtenis.target));
  try {
    await api('/api/instellingen', { method: 'PUT', body: JSON.stringify(velden) });
    toon('Provisie opgeslagen.');
    await toonTeam();
  } catch (fout) { toon(fout.message, 'fout'); }
});

/** Het aanbod dat in alle mailsjablonen terechtkomt. */
async function vulAanbod() {
  const { aanbod, voorbeeld, provisie } = await api('/api/instellingen');
  if (provisie) {
    $('p-opdracht').value = (provisie.perOpdrachtCent / 100).toFixed(0);
    $('p-mrr').value = provisie.mrrPercentage;
  }
  const formulier = $('aanbod-formulier');
  formulier.soort.value = aanbod.soort;
  formulier.startbedrag.value = (aanbod.startbedragCent / 100).toFixed(2);
  formulier.maandbedrag.value = (aanbod.maandbedragCent / 100).toFixed(2);
  formulier.inbegrepen.value = aanbod.inbegrepen;
  formulier.bedrijfsnaam.value = aanbod.bedrijfsnaam;
  formulier.telefoon.value = aanbod.telefoon;
  toonAanbodVoorbeeld(aanbod, voorbeeld);
}

function toonAanbodVoorbeeld(aanbod, voorbeeld) {
  const maanden = Math.max(1, Math.round(24000 / Math.max(aanbod.maandbedragCent, 1)));
  $('aanbod-voorbeeld').innerHTML = `Zo staat het in de mail:<br><em>"${esc(voorbeeld)}"</em>` +
    (aanbod.soort === 'gratis'
      ? `<br><br>Bij een gratis herbouw van zes uur verdien je die pas na ongeveer
         <b>${maanden} maanden</b> hosting terug, exclusief provisie.`
      : '');
}

$('aanbod-formulier').addEventListener('submit', async (gebeurtenis) => {
  gebeurtenis.preventDefault();
  const velden = Object.fromEntries(new FormData(gebeurtenis.target));
  try {
    const { aanbod, voorbeeld } = await api('/api/instellingen', {
      method: 'PUT', body: JSON.stringify(velden),
    });
    toonAanbodVoorbeeld(aanbod, voorbeeld);
    toon('Opgeslagen — alle sjablonen gebruiken dit nu.');
  } catch (fout) {
    toon(fout.message, 'fout');
  }
});

$('nieuwe-gebruiker').addEventListener('submit', async (gebeurtenis) => {
  gebeurtenis.preventDefault();
  const formulier = new FormData(gebeurtenis.target);
  try {
    const nieuw = await api('/api/team', { method: 'POST', body: JSON.stringify(Object.fromEntries(formulier)) });
    toon(`${nieuw.gebruiker.naam} kan nu inloggen.`);
    gebeurtenis.target.reset();
    await toonTeam();
  } catch (fout) {
    toon(fout.message, 'fout');
  }
});

// --------------------------------------------------------------------------
// Vandaag: de werklijst
// --------------------------------------------------------------------------
// Een agent begint bij zijn eigen werk; de eigenaar heeft zelden leads op naam
// staan en wil zien waar het bij het team blijft liggen.
let vandaagWie = 'ik';

function zetWerkTeller(druk) {
  const teller = $('vandaag-teller');
  teller.hidden = !druk?.teLaat;
  teller.textContent = druk?.teLaat > 99 ? '99+' : String(druk?.teLaat ?? 0);
}

/** Hoe dringend, in gewone taal. */
const WANNEER = {
  'te-laat': (dagen) => dagen === 1 ? '1 dag te laat' : `${dagen} dagen te laat`,
  vandaag: () => 'Vandaag',
  binnenkort: () => 'Binnenkort',
};

async function toonVandaag() {
  const iedereen = vandaagWie === 'team' && staat.ik.rol === 'eigenaar';
  $('vandaag-wie').hidden = staat.ik.rol !== 'eigenaar';
  const { regels, druk } = await api(`/api/vandaag${iedereen ? '?iedereen=1' : ''}`);
  zetWerkTeller(druk);

  $('vandaag-tegels').innerHTML = [
    { waarde: druk.teLaat, tekst: 'te laat opgevolgd', klem: druk.teLaat > 0 },
    { waarde: druk.vandaag, tekst: 'vandaag aan de beurt' },
    { waarde: druk.totaal, tekst: 'openstaand in totaal' },
  ].map((tegel) => `<div class="tegel${tegel.klem ? ' klem' : ''}"><b>${esc(tegel.waarde)}</b><span>${tegel.tekst}</span></div>`).join('');

  $('vandaag-telling').textContent = `${regels.length} van ${druk.totaal} getoond`;
  $('vandaag-geen').hidden = regels.length > 0;

  $('vandaag-rijen').innerHTML = regels.map((regel) => `
    <tr data-id="${regel.id}" tabindex="0" aria-selected="${regel.id === staat.gekozen}">
      <td class="wanneer"><span class="stip ${regel.urgentie}"></span>
        <span class="wanneer-tekst">${esc(WANNEER[regel.urgentie](regel.dagenTeLaat))}</span>
        <div class="sub">${esc(regel.faseLabel)}</div></td>
      <td class="bedrijf">
        <div class="naamregel"><span class="naam">${esc(regel.name)}</span>
          <span class="sub mono plaats">${esc(regel.domain)}${regel.city ? ' · ' + esc(regel.city) : ''}</span></div>
        <div class="tweede"><b>${esc(regel.wat)}</b> — ${esc(regel.waarom)}</div>
        ${iedereen && regel.agent_naam ? `<div class="merkjes"><span class="merkje">${esc(regel.agent_naam)}</span></div>` : ''}
      </td>
      <td class="doen">
        ${regel.telefoon ? `<a class="knop klein" href="tel:${esc(regel.telefoon.replace(/[^0-9+]/g, ''))}">Bellen</a>` : ''}
        ${regel.sjabloon ? `<button class="knop klein sterk" data-mail="${esc(regel.sjabloon)}">Mail opstellen</button>` : ''}
      </td>
    </tr>`).join('');

  for (const rij of $('vandaag-rijen').querySelectorAll('tr')) {
    const id = Number(rij.dataset.id);
    rij.addEventListener('click', (gebeurtenis) => {
      if (gebeurtenis.target.closest('a')) return;
      const sjabloon = gebeurtenis.target.closest('[data-mail]')?.dataset.mail;
      if (sjabloon) staat.sjabloon = sjabloon;
      kiesLead({ id });
    });
    rij.addEventListener('keydown', (gebeurtenis) => {
      if (gebeurtenis.key === 'Enter' || gebeurtenis.key === ' ') { gebeurtenis.preventDefault(); kiesLead({ id }); }
    });
  }

  if (staat.gekozen) await kiesLead({ id: staat.gekozen });
  else $('vandaag-detail').innerHTML = LEEG_WERK;
}

const LEEG_WERK = `
  <div class="leeg">
    <span class="leegteken" aria-hidden="true">
      <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l2.6 1.6"/></svg>
    </span>
    <b>Kies een regel</b>
    <span class="sub">De mail staat dan klaar in het sjabloon dat bij deze stap hoort.</span>
  </div>`;

for (const knop of $('vandaag-wie').querySelectorAll('.segmentknop')) {
  knop.addEventListener('click', async () => {
    vandaagWie = knop.dataset.wie;
    for (const ander of $('vandaag-wie').querySelectorAll('.segmentknop')) {
      ander.setAttribute('aria-pressed', String(ander === knop));
    }
    await toonVandaag();
  });
}

// --------------------------------------------------------------------------
// Nieuws
// --------------------------------------------------------------------------
const SOORT_LABEL = { bericht: 'Bericht', update: 'Verandering', resultaat: 'Resultaat', 'let-op': 'Let op' };

function zetNieuwsTeller(aantal) {
  const teller = $('nieuws-teller');
  teller.hidden = !aantal;
  teller.textContent = aantal > 99 ? '99+' : String(aantal ?? 0);
}

/** Datum als "vandaag", "gisteren" of gewoon de dag zelf. */
function wanneer(tijdstip) {
  const toen = new Date(`${tijdstip.replace(' ', 'T')}Z`);
  const dagen = Math.floor((Date.now() - toen.getTime()) / 86400000);
  if (dagen <= 0) return `vandaag ${toen.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`;
  if (dagen === 1) return 'gisteren';
  if (dagen < 7) return `${dagen} dagen geleden`;
  return toen.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function toonNieuws() {
  const { items, ongelezen } = await api('/api/nieuws');
  zetNieuwsTeller(ongelezen);
  $('nieuws-geen').hidden = items.length > 0;

  const eigenaar = staat.ik.rol === 'eigenaar';
  $('nieuws-lijst').innerHTML = items.map((item) => `
    <article class="nieuwsitem${item.gelezen ? '' : ' ongelezen'}" data-id="${item.id}">
      <div class="regel">
        <h3>${item.vastgezet ? '📌 ' : ''}${esc(item.titel)}
          <span class="soortpil ${esc(item.soort)}">${esc(SOORT_LABEL[item.soort] ?? item.soort)}</span>
          ${item.gelezen ? '' : '<span class="soortpil">nieuw</span>'}</h3>
        <span class="sub">${esc(wanneer(item.gemaakt_op))}</span>
      </div>
      <div class="sub">${esc(item.door_naam ?? 'onbekend')}</div>
      <p>${esc(item.tekst)}</p>
      ${eigenaar ? `<div class="knoppen">
        <button class="knop klein" data-doe="vast">${item.vastgezet ? 'Losmaken' : 'Vastzetten'}</button>
        <button class="knop klein" data-doe="weg">Weghalen</button>
      </div>` : ''}
    </article>`).join('');

  for (const blok of $('nieuws-lijst').querySelectorAll('.nieuwsitem')) {
    const id = Number(blok.dataset.id);
    const item = items.find((rij) => rij.id === id);
    blok.querySelector('[data-doe="vast"]')?.addEventListener('click', async () => {
      await api(`/api/nieuws/${id}/vastzetten`, { method: 'POST', body: JSON.stringify({ vast: !item.vastgezet }) });
      await toonNieuws();
    });
    blok.querySelector('[data-doe="weg"]')?.addEventListener('click', async () => {
      await api(`/api/nieuws/${id}`, { method: 'DELETE' });
      await toonNieuws();
    });
  }

  // Wie het scherm openslaat heeft het gezien; de teller loopt daarna leeg.
  if (ongelezen > 0) {
    await api('/api/nieuws/gelezen', { method: 'POST' });
    zetNieuwsTeller(0);
  }
}

$('nieuws-alles-gelezen').addEventListener('click', async () => {
  await api('/api/nieuws/gelezen', { method: 'POST' });
  await toonNieuws();
});

$('nieuws-formulier').addEventListener('submit', async (gebeurtenis) => {
  gebeurtenis.preventDefault();
  const formulier = gebeurtenis.target;
  const velden = Object.fromEntries(new FormData(formulier));
  try {
    await api('/api/nieuws', {
      method: 'POST',
      body: JSON.stringify({ ...velden, vastgezet: formulier.vastgezet.checked }),
    });
    formulier.reset();
    toon('Geplaatst — het team ziet het meteen.');
    $('nieuws-melding').textContent = '';
    await toonNieuws();
  } catch (fout) {
    toon(fout.message, 'fout');
  }
});

// --------------------------------------------------------------------------
// Bediening
// --------------------------------------------------------------------------
const koppelFilter = (id, sleutel, gebeurtenisNaam = 'change') => {
  $(id).addEventListener(gebeurtenisNaam, () => {
    staat.filters[sleutel] = $(id).type === 'checkbox' ? $(id).checked : $(id).value;
    tekenChips();
    ververs();
  });
};
koppelFilter('f-zoek', 'zoek', 'change');
koppelFilter('f-plaats', 'plaats');
koppelFilter('f-fase', 'fase');
koppelFilter('f-agent', 'agent');
koppelFilter('f-contact', 'contact');
koppelFilter('f-belbaar', 'belbaar');
koppelFilter('f-levend', 'levend');
koppelFilter('f-achteruit', 'achteruit');
koppelFilter('f-sort', 'sort');

function wisFilters() {
  staat.filters = { zoek: '', plaats: '', fase: '', agent: '', contact: false, belbaar: false, levend: false, achteruit: false, band: '', sort: 'prioriteit' };
  for (const id of ['f-zoek', 'f-plaats', 'f-fase', 'f-agent']) $(id).value = '';
  for (const id of ['f-contact', 'f-belbaar', 'f-levend', 'f-achteruit']) $(id).checked = false;
  $('f-sort').value = 'prioriteit';
  tekenChips();
  ververs();
}
$('f-wis').addEventListener('click', wisFilters);

$('k-in').addEventListener('click', () => kaart.zoomKnop(1.5));
$('k-uit').addEventListener('click', () => kaart.zoomKnop(1 / 1.5));
$('k-herstel').addEventListener('click', () => kaart.herstel());

// --------------------------------------------------------------------------
// Actieve filters als wisbare chips
// --------------------------------------------------------------------------
const KRUIS = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 6l8 8M14 6l-8 8"/></svg>';

/** Welke filters staan aan, en hoe heet dat in gewone taal? */
function actieveFilters() {
  const uit = [];
  const tekst = (id, waarde) => $(id).querySelector(`option[value="${CSS.escape(waarde)}"]`)?.textContent ?? waarde;
  if (staat.filters.zoek) uit.push({ sleutel: 'zoek', label: `"${staat.filters.zoek}"` });
  if (staat.filters.plaats) uit.push({ sleutel: 'plaats', label: tekst('f-plaats', staat.filters.plaats) });
  if (staat.filters.fase) uit.push({ sleutel: 'fase', label: tekst('f-fase', staat.filters.fase) });
  if (staat.filters.agent) uit.push({ sleutel: 'agent', label: tekst('f-agent', staat.filters.agent) });
  if (staat.filters.contact) uit.push({ sleutel: 'contact', label: 'Heeft contactgegevens' });
  if (staat.filters.belbaar) uit.push({ sleutel: 'belbaar', label: 'Mag ik bellen' });
  if (staat.filters.levend) uit.push({ sleutel: 'levend', label: 'Draait nog' });
  if (staat.filters.achteruit) uit.push({ sleutel: 'achteruit', label: 'Achteruitgegaan' });
  if (staat.filters.band) uit.push({ sleutel: 'band', label: BANDEN.find((rij) => rij.id === staat.filters.band)?.label ?? '' });
  return uit;
}

const VELD_VAN = { zoek: 'f-zoek', plaats: 'f-plaats', fase: 'f-fase', agent: 'f-agent',
  contact: 'f-contact', belbaar: 'f-belbaar', levend: 'f-levend', achteruit: 'f-achteruit' };

function tekenChips() {
  const actief = actieveFilters();
  $('f-chips').innerHTML = actief.map((rij) => `
    <span class="chip">${esc(rij.label)}
      <button data-wis="${rij.sleutel}" aria-label="Filter ${esc(rij.label)} weghalen">${KRUIS}</button></span>`).join('')
    + (actief.length > 1 ? '<button class="knop klein" data-wis="alles">Alles wissen</button>' : '');

  const aantal = $('f-aantal');
  const inPaneel = actief.filter((rij) => rij.sleutel !== 'zoek' && rij.sleutel !== 'band').length;
  aantal.hidden = inPaneel === 0;
  aantal.textContent = inPaneel;

  for (const knop of $('f-chips').querySelectorAll('[data-wis]')) {
    knop.addEventListener('click', () => {
      const sleutel = knop.dataset.wis;
      if (sleutel === 'alles') { wisFilters(); return; }
      staat.filters[sleutel] = typeof staat.filters[sleutel] === 'boolean' ? false : '';
      const veld = VELD_VAN[sleutel];
      if (veld) { const el = $(veld); if (el.type === 'checkbox') el.checked = false; else el.value = ''; }
      tekenChips();
      ververs();
    });
  }
}

// --------------------------------------------------------------------------
// Uitklapmenu's voor filters en sortering
// --------------------------------------------------------------------------
function koppelPop(knopId, paneelId) {
  const knop = $(knopId);
  const paneel = $(paneelId);
  const sluit = () => { paneel.hidden = true; knop.setAttribute('aria-expanded', 'false'); };
  knop.addEventListener('click', (gebeurtenis) => {
    gebeurtenis.stopPropagation();
    const open = paneel.hidden;
    for (const ander of document.querySelectorAll('.popkaart')) ander.hidden = true;
    for (const ander of document.querySelectorAll('.popvak .knop')) ander.setAttribute('aria-expanded', 'false');
    paneel.hidden = !open;
    knop.setAttribute('aria-expanded', String(open));
  });
  paneel.addEventListener('click', (gebeurtenis) => gebeurtenis.stopPropagation());
  return sluit;
}
const sluitFilters = koppelPop('f-open', 'f-paneel');
const sluitSort = koppelPop('s-open', 's-paneel');
document.addEventListener('click', () => { sluitFilters(); sluitSort(); });

/** De sorteerkeuzes als knoppen; het select-veld eronder blijft de bron. */
function tekenSorteerkeuzes() {
  const veld = $('f-sort');
  $('s-keuzes').innerHTML = [...veld.options].map((optie) => `
    <button class="popkeuze" data-waarde="${esc(optie.value)}" aria-pressed="${optie.value === veld.value}">
      ${esc(optie.textContent)}
      <svg class="vink" viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 10.5l3.5 3.5 7.5-8"/></svg>
    </button>`).join('');
  $('s-label').textContent = veld.selectedOptions[0].textContent;

  for (const knop of $('s-keuzes').querySelectorAll('.popkeuze')) {
    knop.addEventListener('click', () => {
      veld.value = knop.dataset.waarde;
      veld.dispatchEvent(new Event('change'));
      tekenSorteerkeuzes();
      sluitSort();
    });
  }
}
tekenSorteerkeuzes();

// --------------------------------------------------------------------------
// Licht of donker
// --------------------------------------------------------------------------
const THEMAS = ['systeem', 'licht', 'donker'];
function zetThema(keuze) {
  if (keuze === 'systeem') delete document.documentElement.dataset.thema;
  else document.documentElement.dataset.thema = keuze;
  try { localStorage.setItem('webscan-thema', keuze); } catch { /* privémodus: dan onthouden we het niet */ }
  $('thema').title = { systeem: 'Volgt je systeem', licht: 'Lichte weergave', donker: 'Donkere weergave' }[keuze];
  kaart?.hermeet?.();
}
let themaKeuze = 'systeem';
try { themaKeuze = localStorage.getItem('webscan-thema') ?? 'systeem'; } catch { /* geen opslag */ }
zetThema(THEMAS.includes(themaKeuze) ? themaKeuze : 'systeem');
$('thema').addEventListener('click', () => {
  themaKeuze = THEMAS[(THEMAS.indexOf(themaKeuze) + 1) % THEMAS.length];
  zetThema(themaKeuze);
  toon(`Weergave: ${{ systeem: 'volgt je systeem', licht: 'licht', donker: 'donker' }[themaKeuze]}`);
});

// --------------------------------------------------------------------------
// Menu op smalle schermen
// --------------------------------------------------------------------------
const zetMenu = (open) => {
  $('app').classList.toggle('menu-open', open);
  $('zij-scherm').hidden = !open;
};
$('menu-open').addEventListener('click', () => zetMenu(true));
$('menu-dicht').addEventListener('click', () => zetMenu(false));
$('zij-scherm').addEventListener('click', () => zetMenu(false));
for (const knop of $('tabs').querySelectorAll('.tab')) knop.addEventListener('click', () => zetMenu(false));

// --------------------------------------------------------------------------
// Snel zoeken (⌘K of /)
// --------------------------------------------------------------------------
const palet = $('palet');
let paletRijen = [];
let paletKeuze = 0;
let paletTijd = null;

function openPalet() {
  if (palet.open) return;
  palet.showModal();
  $('palet-veld').value = '';
  vulPalet('');
  $('palet-veld').focus();
}

const SCHERMEN = [
  { weergave: 'vandaag', naam: 'Vandaag' },
  { weergave: 'kaart', naam: 'Kaart & leads' },
  { weergave: 'mijn', naam: 'Mijn lijst' },
  { weergave: 'team', naam: 'Team & omzet' },
  { weergave: 'nieuws', naam: 'Nieuws' },
];

async function vulPalet(zoek) {
  const schermen = SCHERMEN
    .filter((rij) => !zoek || rij.naam.toLowerCase().includes(zoek.toLowerCase()))
    .filter((rij) => rij.weergave !== 'team' || staat.ik.rol === 'eigenaar')
    .map((rij) => ({ soort: 'scherm', naam: rij.naam, extra: 'Ga naar', doe: () => wisselNaar(rij.weergave) }));

  let leads = [];
  if (zoek.trim().length >= 2) {
    try {
      const uitkomst = await api(`/api/leads?zoek=${encodeURIComponent(zoek)}&limit=7&sort=prioriteit`);
      leads = uitkomst.leads.map((lead) => ({
        soort: 'lead', naam: lead.name,
        extra: [lead.city, `score ${lead.score}`].filter(Boolean).join(' · '),
        doe: async () => { await wisselNaar('kaart'); kiesLead({ id: lead.id }); },
      }));
    } catch { /* zoeken mag stilletjes mislukken */ }
  }

  paletRijen = [...leads, ...schermen];
  paletKeuze = 0;
  tekenPalet();
}

function tekenPalet() {
  if (paletRijen.length === 0) {
    $('palet-lijst').innerHTML = '<p class="palet-leeg">Niets gevonden.</p>';
    return;
  }
  let vorige = null;
  $('palet-lijst').innerHTML = paletRijen.map((rij, index) => {
    const kop = rij.soort !== vorige
      ? `<div class="palet-groep">${rij.soort === 'lead' ? 'Bedrijven' : 'Schermen'}</div>` : '';
    vorige = rij.soort;
    return `${kop}<button class="palet-rij" data-index="${index}" data-actief="${index === paletKeuze ? 'ja' : 'nee'}">
      ${esc(rij.naam)}<span class="sub">${esc(rij.extra)}</span></button>`;
  }).join('');

  for (const knop of $('palet-lijst').querySelectorAll('.palet-rij')) {
    knop.addEventListener('click', () => kiesPalet(Number(knop.dataset.index)));
  }
}

async function kiesPalet(index) {
  const rij = paletRijen[index];
  palet.close();
  await rij?.doe();
}

$('palet-veld').addEventListener('input', (gebeurtenis) => {
  clearTimeout(paletTijd);
  const waarde = gebeurtenis.target.value;
  paletTijd = setTimeout(() => vulPalet(waarde), 140);
});
$('palet-veld').addEventListener('keydown', (gebeurtenis) => {
  if (gebeurtenis.key === 'ArrowDown' || gebeurtenis.key === 'ArrowUp') {
    gebeurtenis.preventDefault();
    const stap = gebeurtenis.key === 'ArrowDown' ? 1 : -1;
    paletKeuze = (paletKeuze + stap + paletRijen.length) % Math.max(paletRijen.length, 1);
    tekenPalet();
    $('palet-lijst').querySelector('[data-actief="ja"]')?.scrollIntoView({ block: 'nearest' });
  }
  if (gebeurtenis.key === 'Enter') { gebeurtenis.preventDefault(); kiesPalet(paletKeuze); }
});
$('open-palet').addEventListener('click', openPalet);
palet.addEventListener('click', (gebeurtenis) => { if (gebeurtenis.target === palet) palet.close(); });
// Na het sluiten hoort de aandacht terug bij de zoekknop; blijft hij in het
// zoekveld hangen, dan zou de eerstvolgende sneltoets verloren gaan.
palet.addEventListener('close', () => $('open-palet').focus());

// --------------------------------------------------------------------------
// Sneltoetsen
// --------------------------------------------------------------------------
const sneltoetsen = $('sneltoetsen');
for (const knop of sneltoetsen.querySelectorAll('[data-sluit]')) {
  knop.addEventListener('click', () => sneltoetsen.close());
}
$('toon-sneltoetsen').addEventListener('click', () => sneltoetsen.showModal());
sneltoetsen.addEventListener('click', (gebeurtenis) => { if (gebeurtenis.target === sneltoetsen) sneltoetsen.close(); });

let wachtOpG = false;

/** Rijen van de lijst die nu in beeld staat, om met j/k door te lopen. */
const zichtbareRijen = () => {
  const tabel = { mijn: 'mijn-rijen', vandaag: 'vandaag-rijen' }[staat.weergave] ?? 'rijen';
  return [...$(tabel).querySelectorAll('tr[data-id]')];
};

function loopDoorLijst(stap) {
  const rijen = zichtbareRijen();
  if (rijen.length === 0) return;
  const nu = rijen.findIndex((rij) => Number(rij.dataset.id) === staat.gekozen);
  const volgende = rijen[Math.min(Math.max(nu + stap, 0), rijen.length - 1)] ?? rijen[0];
  volgende.scrollIntoView({ block: 'nearest' });
  kiesLead({ id: Number(volgende.dataset.id) });
}

document.addEventListener('keydown', (gebeurtenis) => {
  // Alleen tekstvelden slikken sneltoetsen op; een vinkje of knop niet, anders
  // werkt het toetsenbord niet meer zodra je één filter hebt aangeklikt.
  const doel = gebeurtenis.target;
  const inVeld = doel.isContentEditable || doel.tagName === 'TEXTAREA' || doel.tagName === 'SELECT'
    || (doel.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit'].includes(doel.type));
  const toets = gebeurtenis.key;

  if ((gebeurtenis.metaKey || gebeurtenis.ctrlKey) && toets.toLowerCase() === 'k') {
    gebeurtenis.preventDefault(); openPalet(); return;
  }
  if (toets === 'Escape' && !palet.open && !sneltoetsen.open) {
    if (!$('f-paneel').hidden || !$('s-paneel').hidden) { sluitFilters(); sluitSort(); return; }
    if (staat.gekozen) { staat.gekozen = null; ververs({ behoudPagina: true }); }
    return;
  }
  if (inVeld || $('app').hidden || gebeurtenis.metaKey || gebeurtenis.ctrlKey || gebeurtenis.altKey) return;

  if (wachtOpG) {
    wachtOpG = false;
    const naar = { v: 'vandaag', k: 'kaart', m: 'mijn', t: 'team', n: 'nieuws' }[toets.toLowerCase()];
    if (naar && !(naar === 'team' && staat.ik.rol !== 'eigenaar')) { gebeurtenis.preventDefault(); wisselNaar(naar); }
    return;
  }

  switch (toets) {
    case '/': gebeurtenis.preventDefault(); openPalet(); break;
    case '?': gebeurtenis.preventDefault(); sneltoetsen.showModal(); break;
    case 'g': case 'G': wachtOpG = true; setTimeout(() => { wachtOpG = false; }, 1200); break;
    case 'j': case 'J': gebeurtenis.preventDefault(); loopDoorLijst(1); break;
    case 'k': case 'K': gebeurtenis.preventDefault(); loopDoorLijst(-1); break;
    case 'f': case 'F': gebeurtenis.preventDefault(); $('f-open').click(); break;
    case 'c': case 'C':
      if (staat.gekozen) document.querySelector('[data-actie="claim"]')?.click();
      break;
    default: break;
  }
});

start();
