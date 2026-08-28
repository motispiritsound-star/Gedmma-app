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
  filters: { zoek: '', plaats: '', fase: '', agent: '', contact: false, belbaar: false, levend: false, band: '', sort: 'prioriteit' },
  gekozen: null,
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
  $('ik-naam').textContent = `${mij.gebruiker.naam} · ${mij.gebruiker.rol}`;
  document.querySelector('[data-weergave="team"]').hidden = mij.gebruiker.rol !== 'eigenaar';

  const [overzicht, sjablonen] = await Promise.all([api('/api/overzicht'), api('/api/sjablonen')]);
  staat.fases = overzicht.fases;
  staat.agenten = overzicht.agenten;
  staat.sjablonen = sjablonen.sjablonen;
  staat.rechtsvormen = overzicht.rechtsvormen;
  staat.benaderbaarheid = overzicht.benaderbaarheid;

  vulKeuzelijsten(overzicht);

  if (!kaart) {
    kaart = maakKaart($('kaart'), { onKiezen: kiesLead, onZweven: toonTip, eigenaarId: mij.gebruiker.id });
    await kaart.laadOmtrek();
  }
  $('kaartnoot').textContent = `${overzicht.cijfers.opKaart} van ${overzicht.cijfers.bedrijven} bedrijven staan op de kaart`;

  await ververs();
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
  zet('sort', staat.filters.sort);
  if (staat.filters.band) {
    const band = BANDEN.find((rij) => rij.id === staat.filters.band);
    zet('minScore', band.vanaf);
    zet('maxScore', band.tot);
  }
  for (const [sleutel, waarde] of Object.entries(extra)) zet(sleutel, waarde);
  return params;
}

/** Telt hoeveel bedrijven er per kwaliteitsband zijn, en laat erop filteren. */
function tekenBanden(punten) {
  $('bandvak').innerHTML = BANDEN.map((band) => {
    const aantal = punten.filter((punt) => bandVan(punt.score).id === band.id).length;
    return `<button data-band="${band.id}" aria-pressed="${staat.filters.band === band.id}">
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

async function ververs() {
  const [lijst, kaartData] = await Promise.all([
    api('/api/leads?' + queryVan({ limit: 300 })),
    api('/api/kaart?' + queryVan({ limit: 6000 })),
  ]);
  $('telling').textContent = `${lijst.leads.length} getoond van ${lijst.totaal}`;
  $('f-export').href = '/api/export.csv?' + queryVan({ limit: 100000 });
  tekenLijst($('rijen'), $('geen'), lijst.leads, 'kaart');
  tekenBanden(kaartData.punten);
  kaart.zetPunten(kaartData.punten);
  if (staat.gekozen) kaart.zetGekozen(staat.gekozen);
  if (!staat.gekozen) $('detail').innerHTML =
    '<div class="leeg">Klik een bolletje op de kaart of een regel in de lijst aan.<br>' +
    'Groen is een goede site, oranje matig, rood slecht.</div>';
}

// --------------------------------------------------------------------------
// Lijst
// --------------------------------------------------------------------------
const bolVan = (score) => `<span class="bol bol-${bandVan(score).id}" title="${bandVan(score).label}"></span>`;
const faseLabel = (id) => staat.fases.find((fase) => fase.id === id)?.label ?? id;
const isMijlpaal = (id) => Boolean(staat.fases.find((fase) => fase.id === id)?.mijlpaal);

/** Hoe levend het bedrijf oogt — los van hoe slecht de site is. */
const LEVEN = [
  { vanaf: 60, id: 'levend', label: 'draait' },
  { vanaf: 35, id: 'onduidelijk', label: 'onduidelijk' },
  { vanaf: 0, id: 'stil', label: 'stil' },
];
const levenVan = (score) => LEVEN.find((rij) => (score ?? 0) >= rij.vanaf) ?? LEVEN[2];

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

function tekenLijst(tbody, leegVak, leads, welke) {
  leegVak.hidden = leads.length > 0;
  const metActie = welke === 'mijn';

  tbody.innerHTML = leads.map((lead) => {
    const contact = lead.contact.phones[0] ?? lead.contact.emails[0] ?? '';
    const bezetting = !lead.toegewezen_aan ? ''
      : lead.toegewezen_aan === staat.ik.id ? ' van-mij' : ' van-collega';
    return `
    <tr class="${bezetting.trim()}" data-id="${lead.id}" tabindex="0" aria-selected="${lead.id === staat.gekozen}">
      <td class="kwaliteit">${bolVan(lead.score)}<span class="score">${lead.score}</span>
          <div class="leven l-${levenVan(lead.leven).id}" title="Levenstekenen: ${lead.leven ?? '?'}/100">${levenVan(lead.leven).label}</div></td>
      <td><div class="naam">${esc(lead.name)}</div>
          <div class="sub mono">${esc(lead.domain)}${lead.city ? ' · ' + esc(lead.city) : ''}</div>
          ${contact ? `<div class="telefoon">${lead.bel_toestemming || !lead.contact.phones[0] ? '' : ''}${esc(contact)}${lead.contact.phones[0] && !lead.bel_toestemming && NATUURLIJK.includes(lead.rechtsvorm ?? '') ? ' <span class="alleen-mail" title="Bellen mag alleen met toestemming">alleen mailen</span>' : ''}</div>` : ''}</td>
      ${metActie
        ? `<td class="sub">${lead.volgende_actie_op ? esc(lead.volgende_actie_op) : '—'}</td>`
        : `<td class="probleem"><span>${esc(lead.topIssues[0]?.title ?? '')}</span></td>`}
      <td><span class="fasepil ${lead.fase}">${esc(faseLabel(lead.fase))}</span>
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
  const doel = staat.weergave === 'mijn' ? $('mijn-detail') : $('detail');
  tekenDetail(doel, lead);
  if (lead.lat && lead.lon && staat.weergave === 'kaart') kaart?.zetGekozen(lead.id);
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
  const zeg = (tekst, goed = true) => {
    melding.textContent = tekst;
    melding.classList.toggle('goed', goed);
    setTimeout(() => { melding.textContent = ''; }, 3000);
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
  for (const knop of $('tabs').querySelectorAll('.tab')) {
    knop.setAttribute('aria-pressed', String(knop.dataset.weergave === weergave));
  }
  for (const naam of ['kaart', 'mijn', 'team']) $(`weergave-${naam}`).hidden = naam !== weergave;

  if (weergave === 'kaart') { kaart?.hermeet(); await ververs(); }
  if (weergave === 'mijn') await toonMijnLijst();
  if (weergave === 'team') await toonTeam();
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
}

async function toonTeam() {
  const gegevens = await api('/api/team');
  const overzicht = await api('/api/overzicht');
  await vulAanbod();

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

/** Het aanbod dat in alle mailsjablonen terechtkomt. */
async function vulAanbod() {
  const { aanbod, voorbeeld } = await api('/api/instellingen');
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
    $('aanbod-melding').textContent = 'Opgeslagen — alle sjablonen gebruiken dit nu.';
    $('aanbod-melding').classList.add('goed');
  } catch (fout) {
    $('aanbod-melding').textContent = fout.message;
    $('aanbod-melding').classList.remove('goed');
  }
});

$('nieuwe-gebruiker').addEventListener('submit', async (gebeurtenis) => {
  gebeurtenis.preventDefault();
  const formulier = new FormData(gebeurtenis.target);
  try {
    const nieuw = await api('/api/team', { method: 'POST', body: JSON.stringify(Object.fromEntries(formulier)) });
    $('t-melding').textContent = `${nieuw.gebruiker.naam} kan nu inloggen.`;
    $('t-melding').classList.add('goed');
    gebeurtenis.target.reset();
    await toonTeam();
  } catch (fout) {
    $('t-melding').textContent = fout.message;
    $('t-melding').classList.remove('goed');
  }
});

// --------------------------------------------------------------------------
// Bediening
// --------------------------------------------------------------------------
const koppelFilter = (id, sleutel, gebeurtenisNaam = 'change') => {
  $(id).addEventListener(gebeurtenisNaam, () => {
    staat.filters[sleutel] = $(id).type === 'checkbox' ? $(id).checked : $(id).value;
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
koppelFilter('f-sort', 'sort');

$('f-wis').addEventListener('click', () => {
  staat.filters = { zoek: '', plaats: '', fase: '', agent: '', contact: false, belbaar: false, levend: false, band: '', sort: 'prioriteit' };
  for (const id of ['f-zoek', 'f-plaats', 'f-fase', 'f-agent']) $(id).value = '';
  $('f-contact').checked = false;
  $('f-belbaar').checked = false;
  $('f-levend').checked = false;
  $('f-sort').value = 'prioriteit';
  ververs();
});

$('k-in').addEventListener('click', () => kaart.zoomKnop(1.5));
$('k-uit').addEventListener('click', () => kaart.zoomKnop(1 / 1.5));
$('k-herstel').addEventListener('click', () => kaart.herstel());

start();
