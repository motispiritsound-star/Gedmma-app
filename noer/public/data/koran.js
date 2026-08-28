// Korte soera's uit Djoez ʿAmma, plus al-Faatiha.
//
// LET OP — controleer voordat je dit uitgeeft:
// De Arabische tekst hieronder is met zorg overgenomen, maar is nog niet
// geverifieerd tegen een gecertificeerde bron. Vervang deze tekst vóór
// publicatie door een geverifieerde dataset (bijvoorbeeld Tanzil.net,
// Uthmani-tekst) en laat hem nakijken door iemand met een idjaza.
// test/run.js controleert de aantallen aya's; dat vervangt géén tekstcontrole.
//
// nl = betekenis in het Nederlands. Een vertaling van de Koran is een
// uitleg van de betekenis, niet de Koran zelf; zo staat het ook in de app.

export const SOERAS = [
  {
    nr: 1, id: 'al-fatiha', naam: 'Al-Faatiha', naamAr: 'ٱلْفَاتِحَة',
    betekenis: 'De Opening', plaats: 'Mekka', aantalAyaat: 7, niveau: 2,
    over: 'De eerste soera van de Koran. Je leest hem in elke rakʿa van elk gebed — dit is dus de soera die je het vaakst van je leven zult zeggen.',
    ayaat: [
      { n: 1, ar: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', tr: 'bismil-laahir-rahmaanir-rahiem', nl: 'In de naam van Allah, de Meest Barmhartige, de Meest Genadevolle.' },
      { n: 2, ar: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', tr: 'al-hamdoe lillaahi rabbil-ʿaalamien', nl: 'Alle lof is voor Allah, de Heer van alle werelden.' },
      { n: 3, ar: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', tr: 'ar-rahmaanir-rahiem', nl: 'De Meest Barmhartige, de Meest Genadevolle.' },
      { n: 4, ar: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', tr: 'maaliki jaumid-dien', nl: 'De Heerser over de Dag van het Oordeel.' },
      { n: 5, ar: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', tr: 'ijjaaka naʿboedoe wa ijjaaka nastaʿien', nl: 'U alleen aanbidden wij en U alleen vragen wij om hulp.' },
      { n: 6, ar: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', tr: 'ihdinas-siraatal-moestaqiem', nl: 'Leid ons op het rechte pad.' },
      { n: 7, ar: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', tr: 'siraatal-ladhiena anʿamta ʿalaihim ghairil-maghdoebi ʿalaihim wa lad-daallien', nl: 'Het pad van hen aan wie U gunsten hebt geschonken, niet van hen op wie de toorn rust, en niet van de dwalenden.' },
    ],
  },
  {
    nr: 103, id: 'al-asr', naam: 'Al-ʿAsr', naamAr: 'ٱلْعَصْر',
    betekenis: 'De Tijd', plaats: 'Mekka', aantalAyaat: 3, niveau: 1,
    over: 'Drie aya\'s, en toch staat het hele leven erin: tijd gaat voorbij, dus doe er iets goeds mee.',
    ayaat: [
      { n: 1, ar: 'وَٱلْعَصْرِ', tr: 'wal-ʿasr', nl: 'Bij de tijd.',
        glossen: ['Bij de tijd'] },
      { n: 2, ar: 'إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ', tr: 'innal-insaana lafie choesr', nl: 'Voorwaar, de mens lijdt zeker verlies.',
        glossen: ['voorwaar', 'de mens', 'lijdt zeker', 'verlies'] },
      { n: 3, ar: 'إِلَّا ٱلَّذِينَ ءَامَنُوا وَعَمِلُوا ٱلصَّٰلِحَٰتِ وَتَوَاصَوْا بِٱلْحَقِّ وَتَوَاصَوْا بِٱلصَّبْرِ', tr: 'illal-ladhiena aamanoe wa ʿamiloes-saalihaati wa tawaasau bil-haqqi wa tawaasau bis-sabr', nl: 'Behalve zij die geloven, goede daden doen, elkaar aansporen tot de waarheid en elkaar aansporen tot geduld.',
        glossen: ['behalve', 'zij die', 'geloven', 'en doen', 'goede daden', 'en elkaar aansporen', 'tot de waarheid', 'en elkaar aansporen', 'tot geduld'] },
    ],
  },
  {
    nr: 105, id: 'al-fil', naam: 'Al-Fiel', naamAr: 'ٱلْفِيل',
    betekenis: 'De Olifant', plaats: 'Mekka', aantalAyaat: 5, niveau: 2,
    over: 'Over het leger met olifanten dat de Kaʿba wilde afbreken — en dat het niet lukte.',
    ayaat: [
      { n: 1, ar: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَٰبِ ٱلْفِيلِ', tr: 'alam tara kaifa faʿala rabboeka bi-ashaabil-fiel', nl: 'Heb jij niet gezien wat jouw Heer deed met de mensen van de olifant?' },
      { n: 2, ar: 'أَلَمْ يَجْعَلْ كَيْدَهُمْ فِى تَضْلِيلٍ', tr: 'alam jadjʿal kaidahoem fie tadliel', nl: 'Heeft Hij hun list niet laten mislukken?' },
      { n: 3, ar: 'وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ', tr: 'wa arsala ʿalaihim tairan abaabiel', nl: 'En Hij zond zwermen vogels op hen af.' },
      { n: 4, ar: 'تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ', tr: 'tarmiehim bi-hidjaaratim-min sidjdjiel', nl: 'Die wierpen stenen van gebakken klei op hen.' },
      { n: 5, ar: 'فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍ', tr: 'fadjaʿalahoem ka-ʿasfim-ma-koel', nl: 'Zo maakte Hij hen als afgevreten kaf.' },
    ],
  },
  {
    nr: 106, id: 'quraysh', naam: 'Qoeraisj', naamAr: 'قُرَيْش',
    betekenis: 'De Qoeraisj', plaats: 'Mekka', aantalAyaat: 4, niveau: 2,
    over: 'Over de stam van Mekka, hun handelsreizen in winter en zomer, en wie hen te eten gaf.',
    ayaat: [
      { n: 1, ar: 'لِإِيلَٰفِ قُرَيْشٍ', tr: 'li-ielaafi qoeraisj', nl: 'Vanwege de gewoonte van de Qoeraisj.',
        glossen: ['vanwege de gewoonte van', 'de Qoeraisj'] },
      { n: 2, ar: 'إِيلَٰفِهِمْ رِحْلَةَ ٱلشِّتَآءِ وَٱلصَّيْفِ', tr: 'ielaafihim rihlatasj-sjitaa-i was-saif', nl: 'Hun gewoonte van de reis in de winter en de zomer.',
        glossen: ['hun gewoonte van', 'de reis van', 'de winter', 'en de zomer'] },
      { n: 3, ar: 'فَلْيَعْبُدُوا رَبَّ هَٰذَا ٱلْبَيْتِ', tr: 'fal-jaʿboedoe rabba haadhal-bait', nl: 'Laat hen dan de Heer van dit Huis aanbidden.',
        glossen: ['laat hen dus aanbidden', 'de Heer van', 'dit', 'Huis'] },
      { n: 4, ar: 'ٱلَّذِىٓ أَطْعَمَهُم مِّن جُوعٍ وَءَامَنَهُم مِّنْ خَوْفٍ', tr: 'alladhie atʿamahoem min djoeʿin wa aamanahoem min chauf', nl: 'Die hen voedde tegen de honger en hen veilig maakte voor angst.',
        glossen: ['Die', 'hen voedde', 'tegen', 'honger', 'en hen veilig maakte', 'tegen', 'angst'] },
    ],
  },
  {
    nr: 107, id: 'al-maun', naam: 'Al-Maaʿoen', naamAr: 'ٱلْمَاعُون',
    betekenis: 'De Hulp', plaats: 'Mekka', aantalAyaat: 7, niveau: 3,
    over: 'Over bidden zonder je hart erbij, en over mensen die de wees wegduwen. Geloof zit ook in hoe je met anderen omgaat.',
    ayaat: [
      { n: 1, ar: 'أَرَءَيْتَ ٱلَّذِى يُكَذِّبُ بِٱلدِّينِ', tr: 'a-ra-aital-ladhie joekadhdhiboe bid-dien', nl: 'Heb jij hem gezien die de godsdienst loochent?' },
      { n: 2, ar: 'فَذَٰلِكَ ٱلَّذِى يَدُعُّ ٱلْيَتِيمَ', tr: 'fadhaalikal-ladhie jadoeʿʿoel-jatiem', nl: 'Dat is degene die de wees wegduwt.' },
      { n: 3, ar: 'وَلَا يَحُضُّ عَلَىٰ طَعَامِ ٱلْمِسْكِينِ', tr: 'wa laa jahoeddoe ʿalaa taʿaamil-miskien', nl: 'En die niet aanspoort tot het voeden van de arme.' },
      { n: 4, ar: 'فَوَيْلٌ لِّلْمُصَلِّينَ', tr: 'fa-wailoel-lil-moesallien', nl: 'Wee dan de biddenden.' },
      { n: 5, ar: 'ٱلَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ', tr: 'alladhiena hoem ʿan salaatihim saahoen', nl: 'Die achteloos zijn bij hun gebed.' },
      { n: 6, ar: 'ٱلَّذِينَ هُمْ يُرَآءُونَ', tr: 'alladhiena hoem joeraa-oen', nl: 'Die het doen om gezien te worden.' },
      { n: 7, ar: 'وَيَمْنَعُونَ ٱلْمَاعُونَ', tr: 'wa jamnaʿoenal-maaʿoen', nl: 'En die hulp aan anderen weigeren.' },
    ],
  },
  {
    nr: 108, id: 'al-kawthar', naam: 'Al-Kauthar', naamAr: 'ٱلْكَوْثَر',
    betekenis: 'De Overvloed', plaats: 'Mekka', aantalAyaat: 3, niveau: 1,
    over: 'De kortste soera van de Koran. Drie aya\'s, vol goed nieuws.',
    ayaat: [
      { n: 1, ar: 'إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ', tr: 'innaa aʿtainaakal-kauthar', nl: 'Voorwaar, Wij hebben jou de overvloed gegeven.',
        glossen: ['voorwaar Wij', 'hebben jou gegeven', 'de overvloed'] },
      { n: 2, ar: 'فَصَلِّ لِرَبِّكَ وَٱنْحَرْ', tr: 'fasalli li-rabbika wanhar', nl: 'Bid daarom voor jouw Heer en offer.',
        glossen: ['bid daarom', 'voor jouw Heer', 'en offer'] },
      { n: 3, ar: 'إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ', tr: 'inna sjaani-aka hoewal-abtar', nl: 'Voorwaar, wie jou haat, hij is het die zonder nageslacht blijft.',
        glossen: ['voorwaar', 'wie jou haat', 'hij is het', 'die afgesneden is'] },
    ],
  },
  {
    nr: 109, id: 'al-kafirun', naam: 'Al-Kaafiroen', naamAr: 'ٱلْكَافِرُون',
    betekenis: 'De Ongelovigen', plaats: 'Mekka', aantalAyaat: 6, niveau: 2,
    over: 'Een duidelijke soera: jij hebt jouw geloof, ik het mijne. Rustig en zonder ruzie.',
    ayaat: [
      { n: 1, ar: 'قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ', tr: 'qoel jaa-ajjoehal-kaafiroen', nl: 'Zeg: o ongelovigen.' },
      { n: 2, ar: 'لَآ أَعْبُدُ مَا تَعْبُدُونَ', tr: 'laa aʿboedoe maa taʿboedoen', nl: 'Ik aanbid niet wat jullie aanbidden.' },
      { n: 3, ar: 'وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ', tr: 'wa laa antoem ʿaabidoena maa aʿboed', nl: 'En jullie aanbidden niet wat ik aanbid.' },
      { n: 4, ar: 'وَلَآ أَنَا۠ عَابِدٌ مَّا عَبَدتُّمْ', tr: 'wa laa ana ʿaabidoem-maa ʿabadtoem', nl: 'En ik ben geen aanbidder van wat jullie aanbaden.' },
      { n: 5, ar: 'وَلَآ أَنتُمْ عَٰبِدُونَ مَآ أَعْبُدُ', tr: 'wa laa antoem ʿaabidoena maa aʿboed', nl: 'En jullie aanbidden niet wat ik aanbid.' },
      { n: 6, ar: 'لَكُمْ دِينُكُمْ وَلِىَ دِينِ', tr: 'lakoem dienoekoem wa lija dien', nl: 'Voor jullie jullie godsdienst, en voor mij mijn godsdienst.' },
    ],
  },
  {
    nr: 110, id: 'an-nasr', naam: 'An-Nasr', naamAr: 'ٱلنَّصْر',
    betekenis: 'De Hulp', plaats: 'Medina', aantalAyaat: 3, niveau: 2,
    over: 'Over de dag dat Mekka open ging en mensen in groepen de islam binnenkwamen.',
    ayaat: [
      { n: 1, ar: 'إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ', tr: 'idhaa djaa-a nasroel-laahi wal-fath', nl: 'Wanneer de hulp van Allah komt en de overwinning.' },
      { n: 2, ar: 'وَرَأَيْتَ ٱلنَّاسَ يَدْخُلُونَ فِى دِينِ ٱللَّهِ أَفْوَاجًا', tr: 'wa ra-aitan-naasa jadchoeloena fie dienil-laahi afwaadjaa', nl: 'En jij de mensen in groepen de godsdienst van Allah ziet binnengaan.' },
      { n: 3, ar: 'فَسَبِّحْ بِحَمْدِ رَبِّكَ وَٱسْتَغْفِرْهُ إِنَّهُۥ كَانَ تَوَّابًا', tr: 'fasabbih bihamdi rabbika wastaghfirh, innahoe kaana tawwaabaa', nl: 'Prijs dan de lof van jouw Heer en vraag Hem om vergeving. Voorwaar, Hij aanvaardt het berouw.' },
    ],
  },
  {
    nr: 111, id: 'al-masad', naam: 'Al-Masad', naamAr: 'ٱلْمَسَد',
    betekenis: 'De Vezels', plaats: 'Mekka', aantalAyaat: 5, niveau: 3,
    over: 'Over een oom van de Profeet ﷺ die hem tegenwerkte. Rijkdom helpt je niet als je hart verkeerd staat.',
    ayaat: [
      { n: 1, ar: 'تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ', tr: 'tabbat jadaa abie lahabin wa tabb', nl: 'De handen van Aboe Lahab gaan ten onder, en hijzelf ook.' },
      { n: 2, ar: 'مَآ أَغْنَىٰ عَنْهُ مَالُهُۥ وَمَا كَسَبَ', tr: 'maa aghnaa ʿanhoe maaloehoe wa maa kasab', nl: 'Zijn bezit baatte hem niet, en ook niet wat hij verdiende.' },
      { n: 3, ar: 'سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ', tr: 'sajaslaa naaran dhaata lahab', nl: 'Hij zal een vlammend vuur binnengaan.' },
      { n: 4, ar: 'وَٱمْرَأَتُهُۥ حَمَّالَةَ ٱلْحَطَبِ', tr: 'wamra-atoehoe hammaalatal-hatab', nl: 'En ook zijn vrouw, de draagster van het brandhout.' },
      { n: 5, ar: 'فِى جِيدِهَا حَبْلٌ مِّن مَّسَدٍ', tr: 'fie djiedihaa habloem-mim-masad', nl: 'Om haar hals een touw van vezels.' },
    ],
  },
  {
    nr: 112, id: 'al-ikhlas', naam: 'Al-Ichlaas', naamAr: 'ٱلْإِخْلَاص',
    betekenis: 'De Zuiverheid', plaats: 'Mekka', aantalAyaat: 4, niveau: 1,
    over: 'Vier aya\'s die vertellen wie Allah is. De Profeet ﷺ zei dat deze soera zwaar weegt.',
    ayaat: [
      { n: 1, ar: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', tr: 'qoel hoewal-laahoe ahad', nl: 'Zeg: Hij is Allah, de Enige.',
        glossen: ['zeg:', 'Hij is', 'Allah', 'de Enige'] },
      { n: 2, ar: 'ٱللَّهُ ٱلصَّمَدُ', tr: 'allaahoes-samad', nl: 'Allah, tot wie alles zich wendt.',
        glossen: ['Allah', 'tot wie alles zich wendt'] },
      { n: 3, ar: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', tr: 'lam jalid wa lam joelad', nl: 'Hij heeft niet verwekt en is niet verwekt.',
        glossen: ['Hij heeft niet', 'verwekt', 'en Hij is niet', 'verwekt'] },
      { n: 4, ar: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ', tr: 'wa lam jakoel-lahoe koefoean ahad', nl: 'En niemand is aan Hem gelijk.',
        glossen: ['en niet', 'is er', 'voor Hem', 'gelijk', 'ook maar iemand'] },
    ],
  },
  {
    nr: 113, id: 'al-falaq', naam: 'Al-Falaq', naamAr: 'ٱلْفَلَق',
    betekenis: 'De Dageraad', plaats: 'Mekka', aantalAyaat: 5, niveau: 1,
    over: 'Een soera om bescherming te vragen. Samen met An-Naas heten ze "al-Moeʿawwidhatain": de twee beschermers.',
    ayaat: [
      { n: 1, ar: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ', tr: 'qoel aʿoedhoe bi-rabbil-falaq', nl: 'Zeg: ik zoek bescherming bij de Heer van de dageraad.',
        glossen: ['zeg:', 'ik zoek bescherming', 'bij de Heer van', 'de dageraad'] },
      { n: 2, ar: 'مِن شَرِّ مَا خَلَقَ', tr: 'min sjarri maa chalaq', nl: 'Tegen het kwaad van wat Hij geschapen heeft.',
        glossen: ['tegen', 'het kwaad van', 'wat', 'Hij geschapen heeft'] },
      { n: 3, ar: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', tr: 'wa min sjarri ghaasiqin idhaa waqab', nl: 'En tegen het kwaad van de duisternis wanneer die invalt.',
        glossen: ['en tegen', 'het kwaad van', 'het donker', 'wanneer', 'het invalt'] },
      { n: 4, ar: 'وَمِن شَرِّ ٱلنَّفَّٰثَٰتِ فِى ٱلْعُقَدِ', tr: 'wa min sjarrin-naffaathaati fil-ʿoeqad', nl: 'En tegen het kwaad van hen die in knopen blazen.',
        glossen: ['en tegen', 'het kwaad van', 'hen die blazen', 'in', 'de knopen'] },
      { n: 5, ar: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', tr: 'wa min sjarri haasidin idhaa hasad', nl: 'En tegen het kwaad van een jaloerse wanneer hij jaloers is.',
        glossen: ['en tegen', 'het kwaad van', 'een jaloerse', 'wanneer', 'hij jaloers is'] },
    ],
  },
  {
    nr: 114, id: 'an-nas', naam: 'An-Naas', naamAr: 'ٱلنَّاس',
    betekenis: 'De Mensen', plaats: 'Mekka', aantalAyaat: 6, niveau: 1,
    over: 'De laatste soera van de Koran. Je vraagt Allah om bescherming tegen fluisteringen die je hart onrustig maken.',
    ayaat: [
      { n: 1, ar: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ', tr: 'qoel aʿoedhoe bi-rabbin-naas', nl: 'Zeg: ik zoek bescherming bij de Heer van de mensen.',
        glossen: ['zeg:', 'ik zoek bescherming', 'bij de Heer van', 'de mensen'] },
      { n: 2, ar: 'مَلِكِ ٱلنَّاسِ', tr: 'malikin-naas', nl: 'De Koning van de mensen.',
        glossen: ['de Koning van', 'de mensen'] },
      { n: 3, ar: 'إِلَٰهِ ٱلنَّاسِ', tr: 'ilaahin-naas', nl: 'De God van de mensen.',
        glossen: ['de God van', 'de mensen'] },
      { n: 4, ar: 'مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ', tr: 'min sjarril-waswaasil-channaas', nl: 'Tegen het kwaad van de influisteraar die wegkruipt.',
        glossen: ['tegen', 'het kwaad van', 'de influisteraar', 'die wegkruipt'] },
      { n: 5, ar: 'ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ', tr: 'alladhie joewaswisoe fie soedoerin-naas', nl: 'Die influistert in de harten van de mensen.',
        glossen: ['die', 'influistert', 'in', 'de harten van', 'de mensen'] },
      { n: 6, ar: 'مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ', tr: 'minal-djinnati wan-naas', nl: 'Van de djinn en de mensen.',
        glossen: ['van', 'de djinn', 'en de mensen'] },
    ],
  },
];

export const SOERA_OP_ID = Object.fromEntries(SOERAS.map((s) => [s.id, s]));

/** Splitst een aya in losse woorden, met de Nederlandse betekenis als die er is. */
export function woordenVan(aya) {
  const woorden = aya.ar.split(/\s+/).filter(Boolean);
  return woorden.map((ar, i) => ({ ar, nl: aya.glossen?.[i] ?? null }));
}

/**
 * Soera's die passen bij een leeftijd: jonger = alleen de korte.
 * De volgorde loopt op in moeilijkheid, niet op soeranummer — zo begint een
 * kind bij de kortste en niet bij al-Faatiha.
 */
export function soerasVoorLeeftijd(leeftijd) {
  const max = leeftijd <= 7 ? 1 : leeftijd <= 10 ? 2 : 3;
  return SOERAS
    .filter((s) => s.niveau <= max)
    .sort((a, b) => a.niveau - b.niveau || a.aantalAyaat - b.aantalAyaat || b.nr - a.nr);
}
