import type { Sentence } from './types'

/**
 * Two sentences at the end of every lesson.
 *
 * Words on their own are a list; a sentence is the moment they turn into
 * language. Each lesson closes with the words it just taught standing next to
 * each other, spoken in full, then built back up from a word bank.
 *
 * The Arabic keeps the clitics attached the way Moroccans write them — وبسلامة,
 * فالدار — while the Latin spelling keeps them apart, because that is what the
 * word bank is cut from. The voice is handled in pronunciation.ts, which walks
 * through a sentence token by token and strips those same clitics back off.
 */

const S = (id: string, ar: string, tr: string, nl: string, en: string): Sentence =>
  ({ id, ar, tr, nl, en })

export const SENTENCES: Record<string, Sentence[]> = {
  'groeten-1': [
    S('groeten-1-a', 'السلام، مرحبا بيك', 'salam, merhba bik', 'Hallo, welkom!', 'Hello, welcome!'),
    S('groeten-1-b', 'شكرا بزاف وبسلامة', 'shukran bezzaf w bslama', 'Heel erg bedankt en tot ziens.', 'Thank you very much and goodbye.'),
  ],
  'groeten-2': [
    S('groeten-2-a', 'السلام عليكم، كيف داير؟', 'ssalamu 3alaykum, kif dayr?', 'Vrede zij met je, hoe gaat het?', 'Peace be upon you, how are you?'),
    S('groeten-2-b', 'لاباس الحمد لله، ونتا؟', 'labas lhamdullah, w nta?', 'Goed, godzijdank, en jij?', 'Fine, thank God, and you?'),
  ],
  'groeten-3': [
    S('groeten-3-a', 'واخا، مزيان بزاف', 'wakha, mzyan bezzaf', 'Oké, heel goed.', 'Okay, very good.'),
    S('groeten-3-b', 'سمح ليا. معليش', 'smeh liya. ma3lish', 'Sorry. — Geeft niet.', 'Sorry. — Never mind.'),
  ],
  'groeten-4': [
    S('groeten-4-a', 'تهلا فراسك، ليلة سعيدة', 'thalla f rasek, lila sa3ida', 'Zorg goed voor jezelf, welterusten.', 'Take care of yourself, good night.'),
    S('groeten-4-b', 'بارك الله فيك، إن شاء الله', 'barakallahu fik, inshallah', 'Dank je wel, als God het wil.', 'Thank you, God willing.'),
  ],
  'ik-en-jij-1': [
    S('ik-en-jij-1-a', 'حنا مزيان، ونتوما؟', 'hna mzyan, w ntuma?', 'Met ons gaat het goed, en met jullie?', 'We are fine, and you?'),
    S('ik-en-jij-1-b', 'هوا هنا وهيا تما', 'huwa hnaya w hiya temma', 'Hij is hier en zij is daar.', 'He is here and she is there.'),
  ],
  'ik-en-jij-2': [
    S('ik-en-jij-2-a', 'شنو سميتك؟ سميتي يوسف', 'shnu smitek? smiti Youssef', 'Hoe heet je? Ik heet Youssef.', 'What is your name? My name is Youssef.'),
    S('ik-en-jij-2-b', 'متشرفين أ سارة', 'mtsherfin a Sara', 'Aangenaam, Sara.', 'Nice to meet you, Sara.'),
  ],
  'ik-en-jij-3': [
    S('ik-en-jij-3-a', 'انا من المغرب، فين ساكن نتا؟', 'ana men lMghrib, fin sakn nta?', 'Ik kom uit Marokko, waar woon jij?', 'I am from Morocco, where do you live?'),
    S('ik-en-jij-3-b', 'انا من هولندا وكنهضر شوية دارجة', 'ana men Hulanda w kanhder shwiya darija', 'Ik kom uit Nederland en ik spreek een beetje Darija.', 'I am from the Netherlands and I speak a little Darija.'),
  ],
  'familie-1': [
    S('familie-1-a', 'هادا بابا وهادي ماما', 'hada baba w hadi mama', 'Dit is papa en dit is mama.', 'This is dad and this is mum.'),
    S('familie-1-b', 'عندي خويا وختي', '3endi khoya w khti', 'Ik heb een broer en een zus.', 'I have a brother and a sister.'),
  ],
  'familie-2': [
    S('familie-2-a', 'جدي وجدتي فالمغرب', 'jeddi w jeddti f lMghrib', 'Mijn opa en oma zijn in Marokko.', 'My grandfather and grandmother are in Morocco.'),
    S('familie-2-b', 'العائلة ديالي كبيرة', 'l3a’ila dyali kbira', 'Mijn familie is groot.', 'My family is big.'),
  ],
  'familie-3': [
    S('familie-3-a', 'هادا صاحبي وهادي صاحبتي', 'hada sahbi w hadi sahbti', 'Dit is mijn vriend en dit is mijn vriendin.', 'This is my friend and this is my girlfriend.'),
    S('familie-3-b', 'هادي ختي، سميتها نور', 'hadi khti, smitha Nour', 'Dit is mijn zus, ze heet Nour.', 'This is my sister, her name is Nour.'),
  ],
  'cijfers-1': [
    S('cijfers-1-a', 'عطيني جوج عافاك', '3tini jouj 3afak', 'Geef me er twee, alsjeblieft.', 'Give me two, please.'),
    S('cijfers-1-b', 'حنا ربعة فالدار', 'hna reb3a f ddar', 'We zijn met z’n vieren thuis.', 'There are four of us at home.'),
  ],
  'cijfers-2': [
    S('cijfers-2-a', 'عندي عشرة ديال الدراهم', '3endi 3achra dyal derahem', 'Ik heb tien dirham.', 'I have ten dirhams.'),
    S('cijfers-2-b', 'سبعة وتلاتة هوما عشرة', 'seb3a w tlata huma 3achra', 'Zeven en drie is tien.', 'Seven and three make ten.'),
  ],
  'cijfers-3': [
    S('cijfers-3-a', 'شحال؟ عشرين درهم', 'shhal? 3achrin derhem', 'Hoeveel? Twintig dirham.', 'How much? Twenty dirhams.'),
    S('cijfers-3-b', 'عندي طناش سنة', '3endi tnach sna', 'Ik ben twaalf jaar.', 'I am twelve years old.'),
  ],
  'cijfers-4': [
    S('cijfers-4-a', 'شحال ف عمرك؟ عندي عشر سنين', 'shhal f 3merek? 3endi 3achr snin', 'Hoe oud ben je? Ik ben tien.', 'How old are you? I am ten.'),
    S('cijfers-4-b', 'شحال هادا؟ عشرين درهم', 'shhal hada? 3achrin derhem', 'Hoeveel is dit? Twintig dirham.', 'How much is this? Twenty dirhams.'),
  ],
  'kleuren-1': [
    S('kleuren-1-a', 'الكتاب حمر والباب زرق', 'lktab hmer w lbab zreq', 'Het boek is rood en de deur is blauw.', 'The book is red and the door is blue.'),
    S('kleuren-1-b', 'بغيت الزرق، ماشي الكحل', 'bghit zzreq, mashi lkhel', 'Ik wil de blauwe, niet de zwarte.', 'I want the blue one, not the black one.'),
  ],
  'kleuren-2': [
    S('kleuren-2-a', 'شنو اللون ديالها؟ وردي', 'shnu lloun dyalha? wardi', 'Welke kleur heeft hij? Roze.', 'What colour is it? Pink.'),
    S('kleuren-2-b', 'عندي بشكليط برتقالي', '3endi bshklit brtqali', 'Ik heb een oranje fiets.', 'I have an orange bicycle.'),
  ],
  'eten-1': [
    S('eten-1-a', 'بغيت أتاي بالسكر عافاك', 'bghit atay b ssokkar 3afak', 'Ik wil thee met suiker, alsjeblieft.', 'I would like tea with sugar, please.'),
    S('eten-1-b', 'الخبز والما عافاك', 'lkhobz w lma 3afak', 'Brood en water, alsjeblieft.', 'Bread and water, please.'),
  ],
  'eten-2': [
    S('eten-2-a', 'كناكل التفاح والبانان', 'kanakol ttfah w lbanan', 'Ik eet appels en bananen.', 'I eat apples and bananas.'),
    S('eten-2-b', 'بغيت مطيشة وبصلة', 'bghit matisha w bsla', 'Ik wil tomaten en uien.', 'I want tomatoes and onions.'),
  ],
  'eten-3': [
    S('eten-3-a', 'كناكل الخبز بالزبدة', 'kanakol lkhobz b zzebda', 'Ik eet brood met boter.', 'I eat bread with butter.'),
    S('eten-3-b', 'بغيت الحوت، ماشي الدجاج', 'bghit lhut, mashi ddjaj', 'Ik wil vis, geen kip.', 'I want fish, not chicken.'),
  ],
  'eten-4': [
    S('eten-4-a', 'الكسكسو بنين بزاف', 'lkesksu bnin bezzaf', 'De couscous is heel lekker.', 'The couscous is very tasty.'),
    S('eten-4-b', 'الطاجين والحريرة ماكلة مغربية', 'ttajine w lharira makla mghribiya', 'Tajine en harira zijn Marokkaans eten.', 'Tagine and harira are Moroccan food.'),
  ],
  'eten-5': [
    S('eten-5-a', 'انا جوعان، بغيت ناكل', 'ana ju3an, bghit nakol', 'Ik heb honger, ik wil eten.', 'I am hungry, I want to eat.'),
    S('eten-5-b', 'انا عطشان، بغيت الما', 'ana 3etshan, bghit lma', 'Ik heb dorst, ik wil water.', 'I am thirsty, I want water.'),
  ],
  'huis-1': [
    S('huis-1-a', 'الدار ديالنا فيها جوج بيوت', 'ddar dyalna fiha jouj byut', 'Ons huis heeft twee kamers.', 'Our house has two rooms.'),
    S('huis-1-b', 'ماما فالكوزينا', 'mama f lkuzina', 'Mama is in de keuken.', 'Mum is in the kitchen.'),
  ],
  'huis-2': [
    S('huis-2-a', 'الطبلة والكرسي فالبيت', 'ttebla w lkursi f lbit', 'De tafel en de stoel staan in de kamer.', 'The table and the chair are in the room.'),
    S('huis-2-b', 'سد الباب عافاك', 'sedd lbab 3afak', 'Doe de deur dicht, alsjeblieft.', 'Close the door, please.'),
  ],
  'huis-3': [
    S('huis-3-a', 'فين الساروت ديالي؟', 'fin ssarut dyali?', 'Waar is mijn sleutel?', 'Where is my key?'),
    S('huis-3-b', 'شعل الضو عافاك', 'sh3el ddou 3afak', 'Doe het licht aan, alsjeblieft.', 'Turn on the light, please.'),
  ],
  'school-1': [
    S('school-1-a', 'انا تلميذ فالمدرسة', 'ana telmid f lmedrasa', 'Ik ben leerling op school.', 'I am a pupil at school.'),
    S('school-1-b', 'الأستادة فالقسم', 'lostada f lqism', 'De juf is in de klas.', 'The teacher is in the classroom.'),
  ],
  'school-2': [
    S('school-2-a', 'عندي كتاب وكناش جديد', '3endi ktab w kunash jdid', 'Ik heb een boek en een nieuw schrift.', 'I have a book and a new notebook.'),
    S('school-2-b', 'عطيني الستيلو عافاك', '3tini stilu 3afak', 'Geef me de pen, alsjeblieft.', 'Give me the pen, please.'),
  ],
  'school-3': [
    S('school-3-a', 'مافهمتش، عاود عافاك', 'ma fhemtsh, 3awd 3afak', 'Ik snap het niet, zeg het nog eens alsjeblieft.', 'I do not understand, say it again please.'),
    S('school-3-b', 'هضر بشوية، دابا فهمت', 'hder bshwiya, daba fhemt', 'Praat langzaam, nu snap ik het.', 'Speak slowly, now I understand.'),
  ],
  'dieren-1': [
    S('dieren-1-a', 'المش كيلعب والكلب كينعس', 'lmesh kayl3eb w lkelb kayn3es', 'De kat speelt en de hond slaapt.', 'The cat is playing and the dog is sleeping.'),
    S('dieren-1-b', 'عندي مش صغير', '3endi mesh sghir', 'Ik heb een kleine kat.', 'I have a small cat.'),
  ],
  'dieren-2': [
    S('dieren-2-a', 'عند جدي بقرة ومعزة', '3end jeddi bgra w m3za', 'Mijn opa heeft een koe en een geit.', 'My grandfather has a cow and a goat.'),
    S('dieren-2-b', 'الجمل كبير والحمار صغير', 'ljmel kbir w lhmar sghir', 'De kameel is groot en de ezel is klein.', 'The camel is big and the donkey is small.'),
  ],
  'dieren-3': [
    S('dieren-3-a', 'السبع كبير والنملة صغيرة', 'ssba3 kbir w nnemla sghira', 'De leeuw is groot en de mier is klein.', 'The lion is big and the ant is small.'),
    S('dieren-3-b', 'كنبغي الحيوانات بزاف', 'kanbghi lhayawanat bezzaf', 'Ik hou heel veel van dieren.', 'I love animals very much.'),
  ],
  'tijd-1': [
    S('tijd-1-a', 'اليوم مزيان، غدا شتا', 'lyum mzyan, ghedda shta', 'Vandaag is het mooi, morgen regen.', 'Today is nice, tomorrow rain.'),
    S('tijd-1-b', 'كنقرا فالصباح وكنلعب فالعشية', 'kanqra f sbah w kanl3eb f l3shiya', 'Ik leer ’s ochtends en speel ’s middags.', 'I study in the morning and play in the afternoon.'),
  ],
  'tijd-2': [
    S('tijd-2-a', 'نهار الجمعة كناكلو الكسكسو', 'nhar jjem3a kanaklu lkesksu', 'Op vrijdag eten we couscous.', 'On Friday we eat couscous.'),
    S('tijd-2-b', 'السبت والحد عطلة', 'ssebt w lhedd 3otla', 'Zaterdag en zondag is het vrij.', 'Saturday and Sunday are days off.'),
  ],
  'tijd-3': [
    S('tijd-3-a', 'شحال فالساعة؟ الساعة تلاتة', 'shhal f ssa3a? ssa3a tlata', 'Hoe laat is het? Het is drie uur.', 'What time is it? It is three o’clock.'),
    S('tijd-3-b', 'الشهر فيه ربعة ديال السيمانات', 'shher fih reb3a dyal ssimanat', 'Een maand heeft vier weken.', 'A month has four weeks.'),
  ],
  'tijd-4': [
    S('tijd-4-a', 'الجو سخون اليوم', 'jjaw skhun lyum', 'Het weer is warm vandaag.', 'The weather is hot today.'),
    S('tijd-4-b', 'كاينة الشتا والريح', 'kayna shta w rrih', 'Er is regen en wind.', 'There is rain and wind.'),
  ],
  'lichaam-1': [
    S('lichaam-1-a', 'عندي جوج عينين وودنين', '3endi jouj 3inin w wednin', 'Ik heb twee ogen en twee oren.', 'I have two eyes and two ears.'),
    S('lichaam-1-b', 'كنغسل سناني فالصباح', 'kanghsel snani f sbah', 'Ik poets mijn tanden ’s ochtends.', 'I brush my teeth in the morning.'),
  ],
  'lichaam-2': [
    S('lichaam-2-a', 'اليد ديالي صغيرة', 'lyedd dyali sghira', 'Mijn hand is klein.', 'My hand is small.'),
    S('lichaam-2-b', 'كيضرني كرشي', 'kayderni kershi', 'Mijn buik doet pijn.', 'My stomach hurts.'),
  ],
  'lichaam-3': [
    S('lichaam-3-a', 'انا فرحان اليوم', 'ana ferhan lyum', 'Ik ben blij vandaag.', 'I am happy today.'),
    S('lichaam-3-b', 'كيضرني راسي، انا عيان', 'kayderni rasi, ana 3eyyan', 'Ik heb hoofdpijn, ik ben moe.', 'My head hurts, I am tired.'),
  ],
  'werkwoorden-1': [
    S('werkwoorden-1-a', 'كناكل الخبز وكنشرب الحليب', 'kanakol lkhobz w kanshreb lhlib', 'Ik eet brood en drink melk.', 'I eat bread and drink milk.'),
    S('werkwoorden-1-b', 'كنمشي للمدرسة كل نهار', 'kanmshi l lmedrasa kul nhar', 'Ik ga elke dag naar school.', 'I go to school every day.'),
  ],
  'werkwoorden-2': [
    S('werkwoorden-2-a', 'كنقرا الكتاب وكنكتب فالكناش', 'kanqra lktab w kanktab f lkunash', 'Ik lees het boek en schrijf in het schrift.', 'I read the book and write in the notebook.'),
    S('werkwoorden-2-b', 'كنشوف التلفازة وكنضحك', 'kanshuf ttelfaza w kandhek', 'Ik kijk tv en lach.', 'I watch television and laugh.'),
  ],
  'werkwoorden-3': [
    S('werkwoorden-3-a', 'عندي فلوس، بغيت خبز', '3endi flus, bghit khobz', 'Ik heb geld, ik wil brood.', 'I have money, I want bread.'),
    S('werkwoorden-3-b', 'ماعنديش ستيلو، خصني واحد', 'ma 3endish stilu, khessni wahed', 'Ik heb geen pen, ik heb er een nodig.', 'I have no pen, I need one.'),
  ],
  'werkwoorden-4': [
    S('werkwoorden-4-a', 'اجي هنا وشوف', 'aji hnaya w shuf', 'Kom hier en kijk.', 'Come here and look.'),
    S('werkwoorden-4-b', 'سير للدار عافاك', 'sir l ddar 3afak', 'Ga naar huis, alsjeblieft.', 'Go home, please.'),
  ],
  'vragen-1': [
    S('vragen-1-a', 'شكون هادا؟ هادا خويا', 'shkun hada? hada khoya', 'Wie is dit? Dit is mijn broer.', 'Who is this? This is my brother.'),
    S('vragen-1-b', 'فين غادي؟ وامتى؟', 'fin ghadi? w imta?', 'Waar ga je heen? En wanneer?', 'Where are you going? And when?'),
  ],
  'vragen-2': [
    S('vragen-2-a', 'شنو هادا؟ هادا كتاب', 'shnu hada? hada ktab', 'Wat is dit? Dit is een boek.', 'What is this? This is a book.'),
    S('vragen-2-b', 'فين كاين الحمام عافاك؟', 'fin kayn lhemmam 3afak?', 'Waar is de wc, alsjeblieft?', 'Where is the bathroom, please?'),
  ],
  'winkelen-1': [
    S('winkelen-1-a', 'عندي فلوس، غادي للحانوت', '3endi flus, ghadi l lhanut', 'Ik heb geld, ik ga naar de winkel.', 'I have money, I am going to the shop.'),
    S('winkelen-1-b', 'هادا غالي وهادا رخيص', 'hada ghali w hada rkhis', 'Dit is duur en dat is goedkoop.', 'This is expensive and that is cheap.'),
  ],
  'winkelen-2': [
    S('winkelen-2-a', 'شحال هادا؟ غالي بزاف', 'shhal hada? ghali bezzaf', 'Hoeveel is dit? Veel te duur!', 'How much is this? Far too expensive!'),
    S('winkelen-2-b', 'عطيني هادا عافاك', '3tini hada 3afak', 'Geef me deze, alsjeblieft.', 'Give me this one, please.'),
  ],
  'winkelen-3': [
    S('winkelen-3-a', 'بغيت واحد كبير، ماشي صغير', 'bghit wahed kbir, mashi sghir', 'Ik wil een grote, geen kleine.', 'I want a big one, not a small one.'),
    S('winkelen-3-b', 'الكتاب قديم والكناش جديد', 'lktab qdim w lkunash jdid', 'Het boek is oud en het schrift is nieuw.', 'The book is old and the notebook is new.'),
  ],
  'weg-1': [
    S('weg-1-a', 'سير نيشان، من بعد ليمن', 'sir nishan, men be3d limen', 'Ga rechtdoor, daarna rechts.', 'Go straight on, then right.'),
    S('weg-1-b', 'الحانوت حدا الجامع', 'lhanut hda jjame3', 'De winkel is naast de moskee.', 'The shop is next to the mosque.'),
  ],
  'weg-2': [
    S('weg-2-a', 'المستشفى فهاد الزنقة', 'lmustashfa f had zzenqa', 'Het ziekenhuis is in deze straat.', 'The hospital is on this street.'),
    S('weg-2-b', 'كنمشي للمدينة بالطوبيس', 'kanmshi l lmedina b ttobis', 'Ik ga met de bus naar de stad.', 'I go to town by bus.'),
  ],
  'cultuur-1': [
    S('cultuur-1-a', 'بلادي المغرب وكنهضر الدارجة', 'bladi lMghrib w kanhder ddarija', 'Mijn land is Marokko en ik spreek Darija.', 'My country is Morocco and I speak Darija.'),
    S('cultuur-1-b', 'الدار البيضاء مدينة كبيرة', 'ddar lbida medina kbira', 'Casablanca is een grote stad.', 'Casablanca is a big city.'),
  ],
  'cultuur-2': [
    S('cultuur-2-a', 'فالعيد كنلبسو الجلابة', 'f l3id kanlebsu jellaba', 'Met het feest dragen we een jellaba.', 'At the feast we wear a djellaba.'),
    S('cultuur-2-b', 'كناوة موسيقى مغربية', 'gnawa musiqa mghribiya', 'Gnawa is Marokkaanse muziek.', 'Gnawa is Moroccan music.'),
  ],
}

export const ALL_SENTENCES: Sentence[] = Object.values(SENTENCES).flat()

const byId = new Map(ALL_SENTENCES.map((s) => [s.id, s]))

/** Throws on an unknown id: a lesson pointing at nothing is a content bug. */
export function sentence(id: string): Sentence {
  const found = byId.get(id)
  if (!found) throw new Error(`Onbekende zin-id: ${id}`)
  return found
}

export const maybeSentence = (id: string) => byId.get(id)

/** The sentence ids that belong to a lesson, in teaching order. */
export const sentenceIdsOf = (lessonId: string): string[] =>
  (SENTENCES[lessonId] ?? []).map((s) => s.id)
