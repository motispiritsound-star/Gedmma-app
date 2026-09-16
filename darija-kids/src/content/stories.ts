import type { Story } from './types'

/**
 * Short dialogues. Every line can be tapped for a translation and played out
 * loud, so a story is listening practice before it is reading practice.
 */
export const STORIES: Story[] = [
  {
    id: 'jedda',
    title: 'Bij jeddti (oma)',
    emoji: '🫖',
    level: 'A0',
    intro: 'Yasmin komt langs bij haar oma. Let op hoe ze elkaar begroeten.',
    lines: [
      { speaker: 'Yasmin', ar: 'السلام عليكم أ جدتي!', tr: 'ssalamu 3alaykum a jeddti!', nl: 'Vrede zij met je, oma!' },
      { speaker: 'Jedda', ar: 'وعليكم السلام أ بنتي، مرحبا!', tr: 'wa 3alaykum ssalam a benti, merhba!', nl: 'En met jou ook, meisje, welkom!' },
      { speaker: 'Jedda', ar: 'لاباس عليك؟', tr: 'labas 3lik?', nl: 'Gaat het goed met je?' },
      { speaker: 'Yasmin', ar: 'لاباس الحمد لله. ونتي؟', tr: 'labas lhamdullah. w nti?', nl: 'Het gaat goed, godzijdank. En met jou?' },
      { speaker: 'Jedda', ar: 'بخير. واش جوعانة؟', tr: 'bikhir. wesh ju3ana?', nl: 'Prima. Heb je honger?' },
      { speaker: 'Yasmin', ar: 'ايه! شنو كاين؟', tr: 'iyeh! shnu kayn?', nl: 'Ja! Wat is er?' },
      { speaker: 'Jedda', ar: 'عندي مسمن وأتاي سخون.', tr: '3endi msemmen w atay skhun.', nl: 'Ik heb msemmen en warme thee.' },
      { speaker: 'Yasmin', ar: 'بنين بزاف! شكرا أ جدتي.', tr: 'bnin bezzaf! shukran a jeddti.', nl: 'Heel lekker! Dank je, oma.' },
      { speaker: 'Jedda', ar: 'بصحة أ بنتي.', tr: 'bsseha a benti.', nl: 'Eet smakelijk, meisje.' },
    ],
    quiz: [
      { q: 'Wat vraagt oma aan Yasmin?', options: ['Of ze honger heeft', 'Of ze naar school gaat', 'Hoe oud ze is'], answer: 0 },
      { q: 'Wat betekent “bsseha”?', options: ['Tot ziens', 'Eet smakelijk', 'Kom binnen'], answer: 1 },
      { q: 'Wat krijgt Yasmin?', options: ['Brood en melk', 'Msemmen en thee', 'Couscous'], answer: 1 },
    ],
  },
  {
    id: 'souq',
    title: 'Fssouq m3a baba',
    emoji: '🍅',
    level: 'A1',
    intro: 'Adam gaat met zijn vader naar de markt. Hij hoort hoe je afdingt.',
    lines: [
      { speaker: 'Baba', ar: 'أجي أ ولدي، غاديين للسوق.', tr: 'aji a weldi, ghadyin lssouq.', nl: 'Kom, jongen, we gaan naar de markt.' },
      { speaker: 'Adam', ar: 'واخا أ بابا. شنو غادي نشريو؟', tr: 'wakha a baba. shnu ghadi nshriw?', nl: 'Oké papa. Wat gaan we kopen?' },
      { speaker: 'Baba', ar: 'خضرا وفاكية.', tr: 'khodra w fakya.', nl: 'Groente en fruit.' },
      { speaker: 'Bayya3', ar: 'مرحبا! شنو بغيتي؟', tr: 'merhba! shnu bghiti?', nl: 'Welkom! Wat wilt u?' },
      { speaker: 'Baba', ar: 'عطيني جوج كيلو ديال المطيشة عافاك.', tr: '3tini jouj kilo dyal lmatisha 3afak.', nl: 'Geef me twee kilo tomaten, alstublieft.' },
      { speaker: 'Adam', ar: 'وأنا بغيت التفاح!', tr: 'w ana bghit ttfah!', nl: 'En ik wil appels!' },
      { speaker: 'Baba', ar: 'شحال هادا؟', tr: 'shhal hada?', nl: 'Hoeveel kost dit?' },
      { speaker: 'Bayya3', ar: 'عشرين درهم.', tr: '3achrin derhem.', nl: 'Twintig dirham.' },
      { speaker: 'Baba', ar: 'غالي بزاف! خمسطاش؟', tr: 'ghali bezzaf! khmstach?', nl: 'Veel te duur! Vijftien?' },
      { speaker: 'Bayya3', ar: 'واخا، الله يعاون.', tr: 'wakha, Allah y3awn.', nl: 'Oké, God helpe ons.' },
    ],
    quiz: [
      { q: 'Wat vraagt Baba als eerste aan de verkoper?', options: ['Twee kilo tomaten', 'Een kilo appels', 'Brood'], answer: 0 },
      { q: 'Welke prijs biedt Baba?', options: ['20 dirham', '15 dirham', '5 dirham'], answer: 1 },
      { q: '“Ghali bezzaf” betekent...', options: ['Heel lekker', 'Veel te duur', 'Heel groot'], answer: 1 },
    ],
  },
  {
    id: 'medrasa',
    title: 'Lyum lewwel fmedrasa',
    emoji: '🎒',
    level: 'A1',
    intro: 'Nour is nieuw in de klas in Marokko en spreekt nog maar een beetje Darija.',
    lines: [
      { speaker: 'Ostada', ar: 'صباح الخير أ دراري!', tr: 'sbah lkhir a drari!', nl: 'Goedemorgen, kinderen!' },
      { speaker: 'Drari', ar: 'صباح الخير أ أستادة!', tr: 'sbah lkhir a ostada!', nl: 'Goedemorgen, juf!' },
      { speaker: 'Ostada', ar: 'شكون هادي التلميذة الجديدة؟', tr: 'shkun hadi ttelmida jjdida?', nl: 'Wie is deze nieuwe leerling?' },
      { speaker: 'Nour', ar: 'سميتي نور. انا من هولندا.', tr: 'smiti Nour. ana men Hulanda.', nl: 'Ik heet Nour. Ik kom uit Nederland.' },
      { speaker: 'Ostada', ar: 'مرحبا بيك أ نور. واش كتهضري الدارجة؟', tr: 'merhba bik a Nour. wesh katehdri ddarija?', nl: 'Welkom Nour. Spreek je Darija?' },
      { speaker: 'Nour', ar: 'كنهضر شوية.', tr: 'kanhder shwiya.', nl: 'Ik spreek een beetje.' },
      { speaker: 'Ostada', ar: 'مزيان! حل الكتاب، صفحة خمسة.', tr: 'mzyan! hell lktab, sefha khamsa.', nl: 'Goed zo! Open het boek, bladzijde vijf.' },
      { speaker: 'Nour', ar: 'ما فهمتش، عاود عافاك.', tr: 'ma fhemtsh, 3awd 3afak.', nl: 'Ik snap het niet, herhaal alsjeblieft.' },
      { speaker: 'Ostada', ar: 'بشوية: حل الكتاب.', tr: 'bshwiya: hell lktab.', nl: 'Rustig aan: open het boek.' },
      { speaker: 'Nour', ar: 'آه، فهمت! شكرا.', tr: 'ah, fhemt! shukran.', nl: 'Ah, ik snap het! Dankjewel.' },
    ],
    quiz: [
      { q: 'Waar komt Nour vandaan?', options: ['Uit Marokko', 'Uit Nederland', 'Uit Frankrijk'], answer: 1 },
      { q: 'Wat zegt Nour als ze het niet snapt?', options: ['ma fhemtsh', 'fhemt', 'bslama'], answer: 0 },
      { q: 'Wat betekent “bshwiya”?', options: ['Snel', 'Rustig aan', 'Nog een keer nee'], answer: 1 },
    ],
  },
  {
    id: 'mesh',
    title: 'Fin lmesh?',
    emoji: '🐈',
    level: 'A1',
    intro: 'Sofia en Amine zijn de kat kwijt. Ze zoeken het hele huis door.',
    lines: [
      { speaker: 'Sofia', ar: 'أ خويا، فين المش؟', tr: 'a khoya, fin lmesh?', nl: 'Broer, waar is de kat?' },
      { speaker: 'Amine', ar: 'ما عرفتش. كان تحت الطبلة.', tr: 'ma 3reftsh. kan teht ttebla.', nl: 'Ik weet het niet. Hij was onder de tafel.' },
      { speaker: 'Sofia', ar: 'واش شفتيه فوق السطح؟', tr: 'wesh sheftih fuq stah?', nl: 'Heb je hem op het dakterras gezien?' },
      { speaker: 'Amine', ar: 'لا. يالله نقلبو!', tr: 'la. yallah nqellbu!', nl: 'Nee. Kom, we gaan zoeken!' },
      { speaker: 'Sofia', ar: 'كاينة شي حاجة كتحرك فالكوزينة.', tr: 'kayna shi haja kathrrek fkuzina.', nl: 'Er beweegt iets in de keuken.' },
      { speaker: 'Amine', ar: 'شوف! هو حدا الباب.', tr: 'shuf! huwa hda lbab.', nl: 'Kijk! Hij is naast de deur.' },
      { speaker: 'Sofia', ar: 'المش كان جوعان.', tr: 'lmesh kan ju3an.', nl: 'De kat had honger.' },
      { speaker: 'Amine', ar: 'عطيه الحليب.', tr: '3tih lhlib.', nl: 'Geef hem de melk.' },
      { speaker: 'Sofia', ar: 'الحمد لله، لقيناه!', tr: 'lhamdullah, lqinah!', nl: 'Godzijdank, we hebben hem gevonden!' },
    ],
    quiz: [
      { q: 'Waar was de kat eerst?', options: ['Op het dak', 'Onder de tafel', 'In bed'], answer: 1 },
      { q: 'Waar vinden ze hem?', options: ['Naast de deur', 'In de tuin', 'Onder het bed'], answer: 0 },
      { q: 'Wat krijgt de kat?', options: ['Water', 'Melk', 'Vis'], answer: 1 },
    ],
  },
]

export const storyById = (id: string) => STORIES.find((s) => s.id === id)
