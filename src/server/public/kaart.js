/**
 * Kaart van Nederland op een canvas: omtrek uit Natural Earth, bedrijven als
 * gekleurde bollen. Groen is een goede site, oranje matig, rood slecht.
 * Geen tegels en geen externe kaartdienst — de omtrek staat in nederland.json.
 */

/** De drie kwaliteitsbanden waar de kleur van een bol vandaan komt. */
export const BANDEN = [
  { id: 'slecht', label: 'Slecht',  kleur: '#d03b3b', vanaf: 0,  tot: 39 },
  { id: 'matig',  label: 'Matig',   kleur: '#e8901c', vanaf: 40, tot: 69 },
  { id: 'goed',   label: 'Goed',    kleur: '#0ca30c', vanaf: 70, tot: 100 },
];

export const bandVan = (score) =>
  score < 40 ? BANDEN[0] : score < 70 ? BANDEN[1] : BANDEN[2];

/** Ankerpunten waaraan je de kaart herkent; alleen zichtbaar als je inzoomt. */
const STEDEN = [
  { naam: 'Amsterdam', lat: 52.372, lon: 4.894 },
  { naam: 'Rotterdam', lat: 51.924, lon: 4.478 },
  { naam: 'Den Haag', lat: 52.078, lon: 4.288 },
  { naam: 'Utrecht', lat: 52.091, lon: 5.122 },
  { naam: 'Eindhoven', lat: 51.441, lon: 5.469 },
  { naam: 'Groningen', lat: 53.219, lon: 6.567 },
  { naam: 'Zwolle', lat: 52.516, lon: 6.083 },
  { naam: 'Arnhem', lat: 51.985, lon: 5.899 },
  { naam: 'Breda', lat: 51.586, lon: 4.776 },
  { naam: 'Maastricht', lat: 50.851, lon: 5.691 },
  { naam: 'Leeuwarden', lat: 53.201, lon: 5.799 },
  { naam: 'Enschede', lat: 52.221, lon: 6.894 },
];

const BREEDTE_CORRECTIE = Math.cos((52 * Math.PI) / 180);
const projecteer = (lat, lon) => [lon * BREEDTE_CORRECTIE, -lat];

export function maakKaart(canvas, opties = {}) {
  const ctx = canvas.getContext('2d');
  let omtrek = null;
  let punten = [];
  let gekozenId = null;
  let zweeft = null;

  const beeld = { schaal: 1, dx: 0, dy: 0 };
  let basis = { schaal: 1, dx: 0, dy: 0 };
  let breedte = 0;
  let hoogte = 0;
  let clusters = [];

  const stijl = () => {
    const css = getComputedStyle(canvas);
    return {
      land: css.getPropertyValue('--kaart-land').trim() || '#dde5e6',
      rand: css.getPropertyValue('--kaart-rand').trim() || '#a8bcbe',
      water: css.getPropertyValue('--kaart-water').trim() || '#eef2f3',
      tekst: css.getPropertyValue('--kaart-tekst').trim() || '#5c6b71',
      accent: css.getPropertyValue('--accent').trim() || '#0f6b74',
      paneel: css.getPropertyValue('--panel').trim() || '#ffffff',
    };
  };

  function bepaalBasis() {
    if (!omtrek) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const ring of omtrek) {
      for (const [lon, lat] of ring) {
        const [x, y] = projecteer(lat, lon);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    const marge = 14;
    const schaal = Math.min((breedte - marge * 2) / (maxX - minX), (hoogte - marge * 2) / (maxY - minY));
    basis = {
      schaal,
      dx: marge + ((breedte - marge * 2) - (maxX - minX) * schaal) / 2 - minX * schaal,
      dy: marge + ((hoogte - marge * 2) - (maxY - minY) * schaal) / 2 - minY * schaal,
    };
  }

  const naarScherm = (lat, lon) => {
    const [x, y] = projecteer(lat, lon);
    return [
      (x * basis.schaal + basis.dx) * beeld.schaal + beeld.dx,
      (y * basis.schaal + basis.dy) * beeld.schaal + beeld.dy,
    ];
  };

  /** Bundelt bollen die op elkaar liggen tot één grotere bol met een aantal. */
  function bundel() {
    const cel = beeld.schaal > 3.4 ? 0 : Math.max(13, 26 - beeld.schaal * 4);
    if (cel === 0) {
      clusters = punten.map((punt) => {
        const [x, y] = naarScherm(punt.lat, punt.lon);
        return { x, y, aantal: 1, som: punt.score, punt };
      });
      return;
    }

    const vakken = new Map();
    for (const punt of punten) {
      const [x, y] = naarScherm(punt.lat, punt.lon);
      if (x < -60 || y < -60 || x > breedte + 60 || y > hoogte + 60) continue;
      const sleutel = `${Math.round(x / cel)}|${Math.round(y / cel)}`;
      const vak = vakken.get(sleutel);
      if (vak) {
        vak.x = (vak.x * vak.aantal + x) / (vak.aantal + 1);
        vak.y = (vak.y * vak.aantal + y) / (vak.aantal + 1);
        vak.aantal++;
        vak.som += punt.score;
        if (punt.score < vak.punt.score) vak.punt = punt;
      } else {
        vakken.set(sleutel, { x, y, aantal: 1, som: punt.score, punt });
      }
    }
    clusters = [...vakken.values()];
  }

  function teken() {
    const kleuren = stijl();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, breedte, hoogte);
    ctx.fillStyle = kleuren.water;
    ctx.fillRect(0, 0, breedte, hoogte);
    if (!omtrek) return;

    // Landvorm
    ctx.beginPath();
    for (const ring of omtrek) {
      ring.forEach(([lon, lat], index) => {
        const [x, y] = naarScherm(lat, lon);
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.fillStyle = kleuren.land;
    ctx.fill();
    ctx.strokeStyle = kleuren.rand;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Steden als houvast, pas als je een stukje ingezoomd bent
    if (beeld.schaal > 1.6) {
      ctx.fillStyle = kleuren.tekst;
      ctx.font = '11px "IBM Plex Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      for (const stad of STEDEN) {
        const [x, y] = naarScherm(stad.lat, stad.lon);
        if (x < 0 || y < 0 || x > breedte || y > hoogte) continue;
        ctx.globalAlpha = 0.65;
        ctx.fillText(stad.naam, x, y - 7);
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Bollen: slechte sites bovenop, want daar gaat het om
    const gesorteerd = [...clusters].sort((a, b) => (b.som / b.aantal) - (a.som / a.aantal));
    for (const cluster of gesorteerd) {
      const gemiddelde = cluster.som / cluster.aantal;
      const straal = cluster.aantal === 1 ? 4.6 : Math.min(19, 6 + Math.sqrt(cluster.aantal) * 2.1);
      ctx.beginPath();
      ctx.arc(cluster.x, cluster.y, straal, 0, Math.PI * 2);
      ctx.fillStyle = bandVan(gemiddelde).kleur;
      ctx.globalAlpha = cluster.aantal === 1 ? 0.9 : 0.82;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = kleuren.paneel;
      ctx.stroke();

      if (cluster.aantal >= 8) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(cluster.aantal), cluster.x, cluster.y);
        ctx.textBaseline = 'alphabetic';
      }
    }

    // De gekozen lead krijgt een ring
    const gekozen = clusters.find((cluster) => cluster.aantal === 1 && cluster.punt.id === gekozenId);
    if (gekozen) {
      ctx.beginPath();
      ctx.arc(gekozen.x, gekozen.y, 9, 0, Math.PI * 2);
      ctx.strokeStyle = kleuren.accent;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }

  function herteken() { bundel(); teken(); }

  function meet() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    breedte = rect.width;
    hoogte = rect.height;
    canvas.width = Math.round(breedte * dpr);
    canvas.height = Math.round(hoogte * dpr);
    bepaalBasis();
    herteken();
  }

  const dichtstbij = (x, y) => {
    let beste = null;
    let besteAfstand = Infinity;
    for (const cluster of clusters) {
      const afstand = Math.hypot(cluster.x - x, cluster.y - y);
      const drempel = cluster.aantal === 1 ? 9 : Math.min(21, 8 + Math.sqrt(cluster.aantal) * 2.1);
      if (afstand < drempel && afstand < besteAfstand) { beste = cluster; besteAfstand = afstand; }
    }
    return beste;
  };

  // --- bediening ---
  let sleept = false;
  let laatste = [0, 0];
  let verplaatst = 0;

  canvas.addEventListener('pointerdown', (event) => {
    sleept = true;
    verplaatst = 0;
    laatste = [event.clientX, event.clientY];
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    if (sleept) {
      const dx = event.clientX - laatste[0];
      const dy = event.clientY - laatste[1];
      verplaatst += Math.abs(dx) + Math.abs(dy);
      beeld.dx += dx;
      beeld.dy += dy;
      laatste = [event.clientX, event.clientY];
      herteken();
      return;
    }
    const gevonden = dichtstbij(event.clientX - rect.left, event.clientY - rect.top);
    canvas.style.cursor = gevonden ? 'pointer' : 'grab';
    if (gevonden !== zweeft) {
      zweeft = gevonden;
      opties.onZweven?.(gevonden, event.clientX, event.clientY);
    } else if (gevonden) {
      opties.onZweven?.(gevonden, event.clientX, event.clientY);
    }
  });

  const stopSlepen = () => { sleept = false; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerup', (event) => {
    stopSlepen();
    if (verplaatst > 6) return;
    const rect = canvas.getBoundingClientRect();
    const gevonden = dichtstbij(event.clientX - rect.left, event.clientY - rect.top);
    if (!gevonden) return;
    if (gevonden.aantal === 1) opties.onKiezen?.(gevonden.punt);
    else zoomNaar(gevonden.x, gevonden.y, 2);
  });
  canvas.addEventListener('pointerleave', () => {
    stopSlepen();
    zweeft = null;
    opties.onZweven?.(null);
  });

  function zoomNaar(x, y, factor) {
    const nieuw = Math.min(40, Math.max(1, beeld.schaal * factor));
    const verhouding = nieuw / beeld.schaal;
    beeld.dx = x - (x - beeld.dx) * verhouding;
    beeld.dy = y - (y - beeld.dy) * verhouding;
    beeld.schaal = nieuw;
    herteken();
  }

  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    zoomNaar(event.clientX - rect.left, event.clientY - rect.top, event.deltaY < 0 ? 1.18 : 1 / 1.18);
  }, { passive: false });

  window.addEventListener('resize', meet);

  return {
    /** Zet de landsomtrek rechtstreeks, bijvoorbeeld als hij in de pagina is meegebakken. */
    zetOmtrek(polygonen) { omtrek = polygonen; meet(); },
    async laadOmtrek(url = '/nederland.json') {
      const antwoord = await fetch(url);
      omtrek = (await antwoord.json()).polygonen;
      meet();
    },
    zetPunten(nieuwe) { punten = nieuwe; herteken(); },
    zetGekozen(id) { gekozenId = id; teken(); },
    /** Schuift de kaart naar één bedrijf toe. */
    ganaar(lat, lon, schaal = 9) {
      beeld.schaal = schaal;
      const [x, y] = projecteer(lat, lon);
      beeld.dx = breedte / 2 - (x * basis.schaal + basis.dx) * schaal;
      beeld.dy = hoogte / 2 - (y * basis.schaal + basis.dy) * schaal;
      herteken();
    },
    herstel() { beeld.schaal = 1; beeld.dx = 0; beeld.dy = 0; herteken(); },
    zoomKnop(factor) { zoomNaar(breedte / 2, hoogte / 2, factor); },
    hermeet: meet,
    hertekenOpnieuw: herteken,
  };
}
