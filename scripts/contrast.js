#!/usr/bin/env node
/**
 * `npm run contrast` — toetst de kleurcombinaties op WCAG 2.2 AA.
 *
 * Tekst moet minimaal 4,5:1 halen, grote tekst en randen minimaal 3:1.
 * Draai dit na elke wijziging aan een kleur in apps/web/src/stijl/tokens.css;
 * een kleur die er mooi uitziet is nog geen kleur die leesbaar is.
 */
function kanaal(waarde) {
  const v = waarde / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function helderheid(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * kanaal(r) + 0.7152 * kanaal(g) + 0.0722 * kanaal(b);
}

function verhouding(voor, achter) {
  const a = helderheid(voor);
  const b = helderheid(achter);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const MERK_BLAUW = '#1b1b3a';
const MERK_LIMOEN = '#c3e84c';

/** `mag` zegt wat de combinatie moet halen: 'tekst', 'groot' of 'geen'. */
const COMBINATIES = [
  ['lichte modus', [
    ['tekst op de grond', '#14142b', '#f4f5f8', 'tekst'],
    ['zachte tekst op de grond', '#4a4a63', '#f4f5f8', 'tekst'],
    ['accent op wit (links)', MERK_BLAUW, '#ffffff', 'tekst'],
    ['wit op de accentknop', '#ffffff', MERK_BLAUW, 'tekst'],
    ['merkblauw op zacht limoen (actief menu)', MERK_BLAUW, '#edf7d6', 'tekst'],
    ['limoen op wit', MERK_LIMOEN, '#ffffff', 'geen'],
    ['goed op de grond', '#1c6b3f', '#f4f5f8', 'tekst'],
    ['let op, op de grond', '#8a5300', '#f4f5f8', 'tekst'],
    ['fout op de grond', '#9b1c22', '#f4f5f8', 'tekst'],
  ]],
  ['donkere modus', [
    ['tekst op de grond', '#eef0f6', '#14142b', 'tekst'],
    ['zachte tekst op de grond', '#b7bacb', '#14142b', 'tekst'],
    ['limoen accent op de grond', MERK_LIMOEN, '#14142b', 'tekst'],
    ['merkblauw op de limoenknop', MERK_BLAUW, MERK_LIMOEN, 'tekst'],
    ['limoen op het vlak', MERK_LIMOEN, '#1d1d3d', 'tekst'],
    ['goed op de grond', '#6fd398', '#14142b', 'tekst'],
    ['let op, op de grond', '#f0b866', '#14142b', 'tekst'],
    ['fout op de grond', '#f58b90', '#14142b', 'tekst'],
  ]],
  ['het logo', [
    ['limoen op marineblauw', MERK_LIMOEN, MERK_BLAUW, 'tekst'],
  ]],
];

const EIS = { tekst: 4.5, groot: 3, geen: 0 };
let gezakt = 0;

for (const [titel, lijst] of COMBINATIES) {
  console.log(`\n${titel}`);
  for (const [naam, voor, achter, mag] of lijst) {
    const r = verhouding(voor, achter);
    const eis = EIS[mag];
    const goed = r >= eis;
    if (!goed) gezakt += 1;
    const oordeel = mag === 'geen' ? 'niet voor tekst' : goed ? 'voldoet' : 'TE LAAG';
    console.log(`  ${r.toFixed(2).padStart(6)}:1  ${oordeel.padEnd(16)} ${naam}`);
  }
}

console.log('');
if (gezakt > 0) {
  console.error(`${gezakt} combinatie(s) halen de norm niet.`);
  process.exit(1);
}
console.log('Alle combinaties voldoen aan WCAG 2.2 AA.');
