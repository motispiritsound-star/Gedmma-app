import type { Lesson, LessonKind, LessonTip, Unit } from './types'

/**
 * The learning path. Units are ordered; a unit opens when the one before it is
 * finished. Each unit ends in a toets (checkpoint) that is generated from
 * everything the unit taught, so a checkpoint can never drift from its lessons.
 */

interface LessonSpec {
  title: string
  kind?: LessonKind
  words: string[]
  tip?: LessonTip
}

const unit = (
  id: string,
  ar: string,
  title: string,
  subtitle: string,
  emoji: string,
  level: Unit['level'],
  accent: Unit['accent'],
  specs: LessonSpec[],
): Unit => {
  const lessons: Lesson[] = specs.map((s, i) => ({
    id: `${id}-${i + 1}`,
    title: s.title,
    kind: s.kind ?? 'woorden',
    words: s.words,
    tip: s.tip,
  }))
  const all = [...new Set(lessons.flatMap((l) => l.words))]
  lessons.push({ id: `${id}-toets`, title: 'Toets', kind: 'toets', words: all })
  return { id, ar, title, subtitle, emoji, level, accent, lessons }
}

export const UNITS: Unit[] = [
  unit('groeten', 'السلام', 'Salam!', 'Hallo zeggen en dag zeggen', '👋', 'A0', 'saffron', [
    {
      title: 'Hallo en dag',
      words: ['salam', 'sbah-lkhir', 'msa-lkhir', 'bslama', 'merhba', 'shukran', 'afak'],
      tip: {
        title: 'Wat is Darija?',
        body: 'Darija is de taal van de straat in Marokko. Het lijkt op Arabisch, maar met eigen woorden uit het Amazigh, Frans en Spaans. Je leert hier zowel het Arabische schrift als de letters die Marokkanen in appjes gebruiken.',
      },
    },
    {
      title: 'Hoe gaat het?',
      kind: 'zinnen',
      words: ['salam-alaykum', 'wa-alaykum', 'labas', 'labas-hamdullah', 'kif-dayr', 'kif-dayra', 'bikhir'],
      tip: {
        title: 'Jongen of meisje?',
        body: 'Darija verandert het woord als je tegen een meisje praat: kif dayr? tegen een jongen, kif dayra? tegen een meisje. Die -a hoor je overal terug.',
      },
    },
    {
      title: 'Ja, nee, oké',
      words: ['iyeh', 'la', 'wakha', 'mzyan', 'bezzaf', 'maalish', 'smeh-liya'],
    },
    {
      title: 'Lief afscheid',
      kind: 'zinnen',
      words: ['thalla', 'lila-saida', 'barakallah', 'la-shukran-wajib', 'inshallah', 'lhamdullah'],
      tip: {
        title: 'De cijfers in woorden',
        body: 'In appjes schrijven Marokkanen 3 voor ع, 7 voor ح en 9 (of q) voor ق. Die klanken bestaan niet in het Nederlands. 3afak = alsjeblieft, 7amdullah = godzijdank.',
      },
    },
  ]),

  unit('ik-en-jij', 'انا ونتا', 'Ana w nta', 'Ik, jij en wie je bent', '🙋', 'A0', 'zellige', [
    {
      title: 'Ik en jij',
      words: ['ana', 'nta', 'nti', 'huwa', 'hiya', 'hna', 'ntuma', 'huma'],
      tip: {
        title: 'Geen “zijn”',
        body: 'Darija heeft geen woord voor “ben”. “Ana ferhan” is letterlijk “ik blij” en betekent “ik ben blij”. Dat scheelt een hoop werk.',
      },
    },
    { title: 'Hoe heet je?', kind: 'zinnen', words: ['smiti', 'shnu-smitek', 'mtsherfin'] },
    {
      title: 'Waar kom je vandaan?',
      kind: 'zinnen',
      words: ['ana-men-hulanda', 'ana-men-lmghrib', 'fin-sakn', 'kanhder-shwiya'],
    },
  ]),

  unit('familie', 'العائلة', "L3a'ila", 'Je familie voorstellen', '👨‍👩‍👧‍👦', 'A0', 'terra', [
    { title: 'Thuis', words: ['baba', 'mama', 'khoya', 'khti', 'drari', 'weld', 'bent'] },
    {
      title: 'Ooms en tantes',
      words: ['jeddi', 'jedda', 'ammi', 'ammti', 'khali', 'khalti', 'walidin', 'aila'],
      tip: {
        title: 'Twee soorten ooms',
        body: 'De familie van je vader (3ammi, 3ammti) en die van je moeder (khali, khalti) hebben eigen woorden. Marokkanen vragen meteen door: van welke kant?',
      },
    },
    {
      title: 'Dit is mijn...',
      kind: 'zinnen',
      words: ['sahbi', 'sahbti', 'hada-khoya', 'hadi-khti'],
      tip: {
        title: 'De -i van “mijn”',
        body: 'Plak -i achter een woord en het is van jou: khoya (mijn broer), sahbi (mijn vriend), smiti (mijn naam). Plak -ek en het is van de ander: smitek (jouw naam).',
      },
    },
  ]),

  unit('cijfers', 'الأعداد', 'L3dad', 'Tellen tot honderd', '🔢', 'A0', 'mint', [
    { title: 'Eén tot vijf', words: ['wahed', 'jouj', 'tlata', 'reb3a', 'khamsa'] },
    { title: 'Zes tot tien', words: ['setta', 'seb3a', 'tmnya', 'ts3ud', '3achra'] },
    {
      title: 'Verder tellen',
      words: ['hdach', 'tnach', 'tltach', 'rb3tach', 'khmstach', '3achrin', 'mya', 'shhal'],
      tip: {
        title: 'Twee is “jouj”',
        body: 'Voor 2 gebruikt Darija jouj (van het Arabische zawj, “paar”), niet tnayn. Jouj drari = twee kinderen.',
      },
    },
    { title: 'Hoe oud ben je?', kind: 'zinnen', words: ['shhal', 'shhal-f-3merek', '3endi-3achr-snin'] },
  ]),

  unit('kleuren', 'الألوان', 'Lalwan', 'Kleuren om je heen', '🎨', 'A0', 'violet', [
    {
      title: 'De zes basiskleuren',
      words: ['hmer', 'zreq', 'khder', 'sfer', 'byed', 'khel'],
      tip: {
        title: 'Kleuren krijgen ook een -a',
        body: 'Een rode auto is tomobil hemra, een rood boek is ktab hmer. Het woord past zich aan bij het ding dat je beschrijft.',
      },
    },
    { title: 'Nog meer kleuren', words: ['qehwi', 'wardi', 'rmadi', 'brtqali', 'shnu-lloun'] },
  ]),

  unit('eten', 'الماكلة', 'Lmakla', 'Eten, drinken en thee', '🍽️', 'A1', 'saffron', [
    {
      title: 'Op tafel',
      words: ['khobz', 'lma', 'atay', 'hlib', 'qehwa', 'sokkar', 'melha'],
      tip: {
        title: 'Atay is een ritueel',
        body: 'Muntthee wordt van hoog ingeschonken, zodat er schuim op komt. Drie glazen hoort erbij — weigeren is bijna onbeleefd.',
      },
    },
    { title: 'Groente en fruit', words: ['tfah', 'banan', 'limun', 'hamd', 'btata', 'matisha', 'bsla', 'khodra', 'fakya'] },
    { title: 'Uit de koelkast', words: ['lhem', 'djaj', 'hut', 'bid', 'jben', 'zebda', '3sel'] },
    {
      title: 'Marokkaanse gerechten',
      words: ['tajine', 'kesksu', 'harira', 'msemmen', 'makla', 'bnin', 'bsseha'],
      tip: {
        title: 'Vrijdag is couscousdag',
        body: 'Na het vrijdaggebed eet bijna heel Marokko kesksu, uit één grote schaal in het midden van de tafel.',
      },
    },
    { title: 'Ik heb honger', kind: 'zinnen', words: ['ju3an', '3etshan', 'bghit-nakol'] },
  ]),

  unit('huis', 'الدار', 'Ddar', 'In en om het huis', '🏠', 'A1', 'sky', [
    { title: 'De kamers', words: ['dar', 'bit', 'bit-n3as', 'kuzina', 'hemmam', 'stah'] },
    { title: 'Meubels', words: ['bab', 'sherjem', 'tebla', 'kursi', 'namusiya'] },
    { title: 'Spullen', words: ['telfaza', 'telifun', 'sarut', 'dou', 'zerbiya', 'mraya'] },
  ]),

  unit('school', 'المدرسة', 'Lmedrasa', 'In de klas', '🏫', 'A1', 'zellige', [
    { title: 'Wie is wie', words: ['medrasa', 'qism', 'ostad', 'ostada', 'telmid'] },
    { title: 'In je tas', words: ['ktab', 'kunash', 'stilu', 'qlem', 'memha', 'sebbura', 'wajib'] },
    {
      title: 'Ik snap het (niet)',
      kind: 'zinnen',
      words: ['3otla', 'imtihan', 'fhemt', 'mafhemtsh', '3awd-afak', 'bshwiya'],
      tip: {
        title: 'Nee zeggen: ma ... sh',
        body: 'Zet ma voor het werkwoord en sh erachter: fhemt (ik snap het) wordt ma fhemtsh (ik snap het niet). 3endi wordt ma 3endish.',
      },
    },
  ]),

  unit('dieren', 'الحيوانات', 'Lhayawanat', 'Dieren dichtbij en ver weg', '🐾', 'A1', 'mint', [
    { title: 'Om het huis', words: ['mesh', 'kelb', 'tir', 'far', 'djaja'] },
    { title: 'Op de boerderij', words: ['3wd', 'hmar', 'bgra', 'khruf', 'm3za', 'jmel'] },
    { title: 'Wild', words: ['sba3', 'qerd', 'fil', 'hensh', 'nemla', 'fertetto', 'hayawanat'] },
  ]),

  unit('tijd', 'الوقت', 'Lweqt', 'Dagen, tijd en weer', '🕰️', 'A1', 'sky', [
    { title: 'Wanneer?', words: ['lyum', 'ghedda', 'lbareh', 'daba', 'sbah', '3shiya', 'lil'] },
    {
      title: 'De dagen',
      words: ['lethnin', 'ttlat', 'larb3', 'lekhmis', 'jjem3a', 'ssebt', 'lhedd'],
      tip: {
        title: 'De week begint op zondag',
        body: 'lhedd (zondag) komt van “één”, lethnin (maandag) van “twee”, ttlat van “drie”. De dagen zijn gewoon geteld.',
      },
    },
    { title: 'Klok en kalender', words: ['sa3a', 'simana', 'shher', '3am', 'shhal-sa3a'] },
    { title: 'Het weer', words: ['jjaw', 'shta', 'shems', 'rih', 'bred', 'skhun', 'telj'] },
  ]),

  unit('lichaam', 'الجسم', 'Ljism', 'Lichaam en gevoelens', '💛', 'A1', 'terra', [
    { title: 'Je gezicht', words: ['ras', 'sh3ar', '3in', 'wden', 'nif', 'fomm', 'snan'] },
    { title: 'Je lijf', words: ['yedd', 'rjel', 'kersh', 'qelb'] },
    {
      title: 'Hoe voel je je?',
      words: ['ferhan', 'hzin', '3eyyan', 'mrid', 'khayf', 'kayderni-rasi', 'kanbghik'],
      tip: {
        title: 'Kanbghik',
        body: 'Kanbghik betekent zowel “ik hou van je” als “ik mag je graag”. Je zegt het tegen je moeder, je oma en je beste vriend.',
      },
    },
  ]),

  unit('werkwoorden', 'كنهضر', 'Kanhder', 'Zeggen wat je doet', '⚡', 'A1', 'violet', [
    {
      title: 'Elke dag',
      words: ['kanakol', 'kanshreb', 'kanmshi', 'kanji', 'kanl3eb'],
      tip: {
        title: 'De ka- van “nu”',
        body: 'Zet ka(n)- voor een werkwoord en het gebeurt nu of altijd: nakol (ik eet ooit) wordt kanakol (ik eet, ik ben aan het eten).',
      },
    },
    { title: 'Nog meer doen', words: ['kan3es', 'kanshuf', 'kansme3', 'kanhder', 'kanktab', 'kanqra', 'kandhek', 'kanjri'] },
    { title: 'Willen en hebben', words: ['bghit', '3endi', 'ma3endish', 'khessni', 'ndir'] },
    {
      title: 'Doe het!',
      words: ['sir', 'aji', 'shuf'],
      tip: {
        title: 'Bevelen',
        body: 'Een bevel is het kale werkwoord: sir (ga), aji (kom), shuf (kijk). Tegen een meisje komt er -i achter, tegen meerdere mensen -u: siri, siru.',
      },
    },
  ]),

  unit('vragen', 'السؤال', "Su'al", 'Vragen stellen', '❓', 'A1', 'saffron', [
    {
      title: 'De vraagwoorden',
      words: ['shnu', 'shkun', 'fin', 'imta', '3lash', 'kifash', 'wesh'],
      tip: {
        title: 'Vragen staan achteraan',
        body: 'Anders dan in het Nederlands blijft de zin gewoon staan: “smitek shnu?” (jouw naam wat?) kan net zo goed als “shnu smitek?”.',
      },
    },
    { title: 'Vragen die je echt gebruikt', kind: 'zinnen', words: ['shnu-hada', 'fin-kayn', 'shhal'] },
  ]),

  unit('winkelen', 'السوق', 'Fssouq', 'Op de markt', '🛍️', 'A2', 'terra', [
    { title: 'Waar en waarmee', words: ['souq', 'hanut', 'flus', 'derhem', 'ghali', 'rkhis'] },
    {
      title: 'Onderhandelen',
      kind: 'zinnen',
      words: ['shhal-hada', 'ghali-bezzaf', '3tini', 'bghit-hada'],
      tip: {
        title: 'Afdingen hoort erbij',
        body: 'Op de souq is de eerste prijs een openingsbod. Noem vriendelijk ongeveer de helft, lach erbij, en kom elkaar tegemoet.',
      },
    },
    { title: 'Groot of klein', words: ['kbir', 'sghir', 'jdid', 'qdim'] },
  ]),

  unit('weg', 'فين غادي؟', 'Fin ghadi?', 'De weg vragen', '🗺️', 'A2', 'zellige', [
    { title: 'Links, rechts, rechtdoor', words: ['limen', 'lisar', 'nishan', 'qeddam', 'mor', 'fuq', 'teht', 'hda', 'hnaya', 'temma'] },
    { title: 'In de stad', words: ['zenqa', 'medina', 'jame3', 'mustashfa', 'tobis', 'tomobil', 'bshklit', 'bhar', 'jbel', 'sahra'] },
  ]),

  unit('cultuur', 'المغرب ديالنا', 'Lmghrib dyalna', 'Land, steden en feest', '🇲🇦', 'A2', 'saffron', [
    {
      title: 'Het land en de talen',
      words: ['mghrib', 'darija', 'tamazight', 'casablanca', 'marrakech', 'rabat', 'tanja', 'fas', 'agadir'],
      tip: {
        title: 'Twee officiële talen',
        body: 'Marokko heeft Arabisch én Tamazight (Amazigh) als officiële taal. Tamazight heeft een eigen alfabet, Tifinagh: ⵜⵉⴼⵉⵏⴰⵖ. Darija is wat mensen thuis spreken.',
      },
    },
    { title: 'Feest en traditie', words: ['ramadan', '3id', '3id-mubarak', 'henna', 'jellaba', 'babouche', 'gnawa'] },
  ]),
]

export const LESSONS = UNITS.flatMap((u) => u.lessons)

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id)

export const unitOfLesson = (lessonId: string) =>
  UNITS.find((u) => u.lessons.some((l) => l.id === lessonId))
