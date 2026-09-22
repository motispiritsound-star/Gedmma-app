/**
 * Sbaa de Atlasleeuw — deel 1: De poorten van Fes.
 *
 * Een prentenboek voor twee tot acht jaar. De ouder leest het in het
 * Nederlands voor en struikelt één keer per bladzijde over een woord Darija —
 * en dat struikelen ís het verhaal. Alle twaalf woorden staan in de app en
 * zijn ingesproken, dus de QR-code achterin kost niets.
 *
 * Vaste bezetting: Sbaa en zes kinderen. Ze zijn er niet alle zes op elke
 * bladzijde, want zes kinderen op één plaat is voor een kleuter een menigte.
 * Per deel reizen er twee of drie mee; Rayan is er altijd bij, want hij is de
 * motor van het voorlezen — hij zegt elk woord twee keer na, en daar doet een
 * kind van drie vanzelf aan mee.
 */

export interface Figuur {
  id: string
  naam: string
  leeftijd: number
  /** Eén zin die zegt wie hij is; de tekenaar en de schrijver houden zich eraan. */
  wie: string
  /** Waaraan je hem herkent, op elke plaat weer. */
  kenmerk: string
  kleur: string
}

export const CAST: Figuur[] = [
  { id: 'sbaa', naam: 'Sbaa', leeftijd: 0,
    wie: 'De Atlasleeuw. Groot, zacht, en een beetje verlegen. Hij kent elk woord en zegt het altijd één keer langzaam.',
    kenmerk: 'Manen als een zonnestraal, en een blauwe reistas over zijn schouder.', kleur: '#e2984a' },
  { id: 'adil', naam: 'Adil', leeftijd: 9,
    wie: 'De oudste. Heeft de kaart, wil alles weten, en leest de borden hardop voor.',
    kenmerk: 'Een groene rugzak en een opgevouwen kaart in zijn hand.', kleur: '#0d9488' },
  { id: 'yousra', naam: 'Yousra', leeftijd: 8,
    wie: 'Tekent alles wat ze ziet. Kijkt langer naar dingen dan de anderen.',
    kenmerk: 'Een schetsboek onder haar arm en een potlood achter haar oor.', kleur: '#c1272d' },
  { id: 'amir', naam: 'Amir', leeftijd: 7,
    wie: 'Rent vooruit en vergeet te kijken. Komt altijd als eerste aan en als laatste terug.',
    kenmerk: 'Rode schoenen en een streepjesshirt.', kleur: '#e2603c' },
  { id: 'yassine', naam: 'Yassine', leeftijd: 6,
    wie: 'Verzamelt. Stenen, schelpen, dopjes — zijn zakken zitten altijd vol.',
    kenmerk: 'Uitpuilende zakken en een blauwe pet.', kleur: '#2f6fb3' },
  { id: 'adam', naam: 'Adam', leeftijd: 5,
    wie: 'Heeft honger. Altijd. Vindt overal iets te eten.',
    kenmerk: 'Een geel shirt met kruimels erop.', kleur: '#f59e0b' },
  { id: 'rayan', naam: 'Rayan', leeftijd: 3,
    wie: 'De jongste. Zegt alles na, twee keer, en lacht er dan om.',
    kenmerk: 'Kleine paarse jas, en hij houdt altijd iemands hand vast.', kleur: '#7c5cbf' },
]

export interface Blad {
  /** Welke tekening; `scripts/make-prentenboek.mjs` kent ze bij naam. */
  scene: string
  /** De voorleestekst, regel voor regel. Kort houden: dit wordt hardop gelezen. */
  tekst: string[]
  /** Het woord van deze bladzijde. Alle twaalf zijn ingesproken. */
  woord: { id: string; ar: string; tr: string; nl: string }
  /** Wat Rayan eronder roept. Altijd twee keer; daar doet een kind aan mee. */
  echo: string
}

const DEEL1 = {
  nummer: 1,
  titel: 'Sbaa en de poorten van Fes',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat zijn oma wél verstaat, maar haar nog niet kan antwoorden.',
  bladen: [
    {
      scene: 'atlas',
      tekst: [
        'Hoog in de bergen woont een leeuw.',
        'Hij heet Sbaa.',
        'Vandaag komen er kinderen op bezoek.',
        '“Salam!” roept Sbaa naar beneden.',
        'Dat is hallo.',
      ],
      woord: { id: 'salam', ar: 'السلام', tr: 'salam', nl: 'hallo' },
      echo: 'Salam! Salam!',
    },
    {
      scene: 'poort',
      tekst: [
        'Ze lopen de hele ochtend.',
        'Dan staan ze stil.',
        'Voor hen is een deur, zo hoog als drie ezels op elkaar.',
        '“Dat is een bab,” zegt Sbaa.',
      ],
      woord: { id: 'bab', ar: 'باب', tr: 'bab', nl: 'deur' },
      echo: 'Bab! Bab!',
    },
    {
      scene: 'welkom',
      tekst: [
        'Achter de poort staat een vrouw met muntthee.',
        'Ze lacht naar de kinderen.',
        '“Merhba,” zegt ze.',
        'Dat betekent: kom binnen, je hoort erbij.',
      ],
      woord: { id: 'merhba', ar: 'مرحبا', tr: 'merhba', nl: 'welkom' },
      echo: 'Merhba! Merhba!',
    },
    {
      scene: 'medina',
      tekst: [
        'Binnen zijn de straatjes zo smal',
        'dat Sbaa zijn schouders moet intrekken.',
        '“Waar zijn we?” vraagt Adil.',
        '“In de medina,” zegt Sbaa. “De oudste stad van het land.”',
      ],
      woord: { id: 'medina', ar: 'مدينة', tr: 'medina', nl: 'oude stad' },
      echo: 'Medina! Medina!',
    },
    {
      scene: 'ezel',
      tekst: [
        'Er komt iets aan.',
        'Iets met lange oren en zeven manden op zijn rug.',
        '“Balak! Balak!” roept de man ernaast.',
        '“Aan de kant,” zegt Sbaa. “Daar komt een hmar.”',
      ],
      woord: { id: 'hmar', ar: 'حمار', tr: 'hmar', nl: 'ezel' },
      echo: 'Hmar! Hmar!',
    },
    {
      scene: 'brood',
      tekst: [
        'Adam ruikt iets.',
        'Adam ruikt altijd iets.',
        'Uit een gat in de muur komt warm, rond brood.',
        '“Khobz,” zegt de bakker, en hij geeft Adam het kleinste.',
      ],
      woord: { id: 'khobz', ar: 'خبز', tr: 'khobz', nl: 'brood' },
      echo: 'Khobz! Khobz!',
    },
    {
      scene: 'babouches',
      tekst: [
        'Yassine blijft staan bij een muur van schoenen.',
        'Geel, rood, wit, en helemaal boven één paar goud.',
        'Ze hebben geen veters en geen hak.',
        '“Belgha,” zegt de schoenmaker.',
      ],
      woord: { id: 'babouche', ar: 'بلغة', tr: 'belgha', nl: 'babouches' },
      echo: 'Belgha! Belgha!',
    },
    {
      scene: 'souq',
      tekst: [
        'Dan wordt het druk. Heel druk.',
        'Olijven, munt, potten, tapijten, kippen.',
        'Iedereen roept, en niemand is boos.',
        '“Dit is de souq,” zegt Sbaa. “De markt.”',
      ],
      woord: { id: 'souq', ar: 'السوق', tr: 'ssouq', nl: 'de markt' },
      echo: 'Souq! Souq!',
    },
    {
      scene: 'thee',
      tekst: [
        'Ze zitten op een kleedje.',
        'De man giet van heel hoog, en er komt schuim op.',
        'Het ruikt naar munt en het is zoet.',
        '“Atay,” zegt hij. “Voorzichtig, hij is heet.”',
      ],
      woord: { id: 'atay', ar: 'أتاي', tr: 'atay', nl: 'muntthee' },
      echo: 'Atay! Atay!',
    },
    {
      scene: 'zon',
      tekst: [
        'De muren worden oranje.',
        'Dan roze.',
        'Yousra tekent het na, maar haar potlood heeft die kleur niet.',
        '“De shems gaat slapen,” zegt Sbaa.',
      ],
      woord: { id: 'shems', ar: 'شمس', tr: 'shems', nl: 'zon' },
      echo: 'Shems! Shems!',
    },
    {
      scene: 'jedda',
      tekst: [
        'Aan het eind van een straatje staat een deur open.',
        'Er staat een oude vrouw in, met meel op haar handen.',
        'Ze kijkt naar de kinderen alsof ze hen al kent.',
        '“Jeddti,” fluistert Rayan. Mijn oma.',
      ],
      woord: { id: 'jedda', ar: 'جدتي', tr: 'jeddti', nl: 'mijn oma' },
      echo: 'Jeddti! Jeddti!',
    },
    {
      scene: 'afscheid',
      tekst: [
        'Het is laat. De sterren staan boven de medina.',
        'Sbaa gaat terug naar de bergen.',
        '“Kom je nog een keer?” vraagt Rayan.',
        '“Bslama,” zegt Sbaa. “Dat is: tot ziens.”',
        'En dat is geen afscheid voor altijd.',
      ],
      woord: { id: 'bslama', ar: 'بسلامة', tr: 'bslama', nl: 'tot ziens' },
      echo: 'Bslama! Bslama!',
    },
  ] as Blad[],
}

const DEEL2 = {
  nummer: 2,
  titel: 'Sbaa en de berg die wit werd',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat denkt dat het in Marokko nooit koud is.',
  bladen: [
    { scene: 'atlas', woord: { id: 'jbel', ar: 'جبل', tr: 'jbel', nl: 'berg' }, echo: 'Jbel! Jbel!',
      tekst: ['Sbaa woont hoog.', 'Zo hoog dat de wolken onder hem hangen.', '“Kom je kijken?” vraagt hij.', '“Naar wat?” vraagt Amir.', '“Naar mijn jbel.”'] },
    { scene: 'bergpad', woord: { id: 'bred', ar: 'بارد', tr: 'bred', nl: 'koud' }, echo: 'Bred! Bred!',
      tekst: ['Ze klimmen en klimmen.', 'Yassine doet zijn pet af.', 'Dan doet hij hem snel weer op.', '“Bred,” zegt Sbaa. “Dat is koud.”'] },
    { scene: 'sneeuw', woord: { id: 'telj', ar: 'تلج', tr: 'telj', nl: 'sneeuw' }, echo: 'Telj! Telj!',
      tekst: ['Boven ligt iets wits.', 'Het is zacht en het smelt in je hand.', '“Sneeuw?” roept Adam. “In Marokko?”', '“Telj,” lacht Sbaa. “Elk jaar weer.”'] },
    { scene: 'weide', woord: { id: 'm3za', ar: 'معزة', tr: 'm3za', nl: 'geit' }, echo: 'M3za! M3za!',
      tekst: ['Iets staat in een boom.', 'Hoog in de takken, alsof dat gewoon is.', 'Het kijkt de kinderen aan en kauwt door.', '“Een m3za,” zegt Sbaa. “Die klimmen hier.”'] },
    { scene: 'weide', woord: { id: 'khruf', ar: 'خروف', tr: 'khruf', nl: 'schaap' }, echo: 'Khruf! Khruf!',
      tekst: ['Dan komt de rest.', 'Wit, bruin, en één helemaal zwart.', 'Ze lopen om Rayan heen alsof hij een paal is.', '“Khruf,” zegt de herder. “Pas op je tenen.”'] },
    { scene: 'tent', woord: { id: 'hlib', ar: 'حليب', tr: 'hlib', nl: 'melk' }, echo: 'Hlib! Hlib!',
      tekst: ['De herder heet Idir.', 'Hij geeft ze een kom.', 'Hij is nog warm van de geit.', '“Hlib,” zegt Idir. “Drink maar.”'] },
    { scene: 'bergpad', woord: { id: 'kaydar', ar: 'عود', tr: 'kaydar', nl: 'paard' }, echo: 'Kaydar! Kaydar!',
      tekst: ['Amir is moe.', 'Hij zegt het niet, maar hij loopt achteraan.', 'Idir fluit één keer.', 'Achter de rots staat een kaydar. Een paard.'] },
    { scene: 'tent', woord: { id: 'zerbiya', ar: 'زربية', tr: 'zerbiya', nl: 'tapijt' }, echo: 'Zerbiya! Zerbiya!',
      tekst: ['In de tent ligt geen vloer.', 'Er ligt wol, in rood en zwart.', 'Yousra tekent het patroon na.', '“Zerbiya,” zegt Idirs moeder. “Mijn moeder maakte hem.”'] },
    { scene: 'tent', woord: { id: 'tamazight', ar: 'تمازيغت', tr: 'tamazight', nl: 'Amazigh' }, echo: 'Tamazight! Tamazight!',
      tekst: ['Idir praat met zijn moeder.', 'De kinderen verstaan er niets van.', '“Wat zegt hij?” fluistert Adil.', '“Tamazight,” zegt Sbaa. “Ook een taal van hier.”'] },
    { scene: 'sneeuw', woord: { id: 'yallah', ar: 'يالله', tr: 'yallah', nl: 'kom op' }, echo: 'Yallah! Yallah!',
      tekst: ['De wolk komt dichterbij.', 'Idir kijkt omhoog en staat op.', 'Hij zegt maar één woord.', '“Yallah!” En iedereen rent.'] },
    { scene: 'top', woord: { id: 'mzyan', ar: 'مزيان', tr: 'mzyan', nl: 'mooi' }, echo: 'Mzyan! Mzyan!',
      tekst: ['Bij de grot draaien ze zich om.', 'Onder hen ligt het hele dal.', 'Niemand zegt iets.', 'Dan zegt Rayan: “Mzyan.” En dat klopt.'] },
    { scene: 'top', woord: { id: 'shukran', ar: 'شكرا', tr: 'shukran', nl: 'dankjewel' }, echo: 'Shukran! Shukran!',
      tekst: ['De wolk trekt voorbij.', 'Idir brengt ze terug tot aan het pad.', 'Hij wil niets hebben voor de melk.', '“Shukran,” zegt Sbaa. En hij meent het.'] },
  ] as Blad[],
}

const DEEL3 = {
  nummer: 3,
  titel: 'Sbaa en de wind van de zee',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat de zee alleen van de foto’s kent.',
  bladen: [
    { scene: 'duin', woord: { id: 'bhar', ar: 'بحر', tr: 'bhar', nl: 'zee' }, echo: 'Bhar! Bhar!',
      tekst: ['Eerst hoor je het.', 'Dan ruik je het.', 'En dan sta je erop en houdt het niet op.', '“Bhar,” zegt Sbaa. “De zee.”'] },
    { scene: 'strand', woord: { id: 'rih', ar: 'ريح', tr: 'rih', nl: 'wind' }, echo: 'Rih! Rih!',
      tekst: ['Yousra’s schetsboek klapt open.', 'De bladzijden slaan om, helemaal alleen.', 'Adams pet gaat de lucht in.', '“Rih,” lacht Sbaa, en hij rent erachteraan.'] },
    { scene: 'haven', woord: { id: 'hut', ar: 'حوت', tr: 'hut', nl: 'vis' }, echo: 'Hut! Hut!',
      tekst: ['De boten zijn blauw. Allemaal.', 'De netten liggen open op de kade.', 'Er springt nog iets in.', '“Hut,” zegt de visser. “Vanochtend gevangen.”'] },
    { scene: 'haven', woord: { id: 'twiar', ar: 'طيور', tr: 'twiar', nl: 'vogels' }, echo: 'Twiar! Twiar!',
      tekst: ['Boven de netten is het druk.', 'Wit, schreeuwend, en veel te dichtbij.', 'Rayan houdt zijn broodje vast met twee handen.', '“Twiar,” zegt Sbaa. “Pas op, die pakken alles.”'] },
    { scene: 'haven', woord: { id: 'zreq', ar: 'زرق', tr: 'zreq', nl: 'blauw' }, echo: 'Zreq! Zreq!',
      tekst: ['Yousra telt de kleuren.', 'De boten: blauw. De deuren: blauw.', 'De luiken, de kar, zelfs de emmer.', '“Zreq,” zegt ze. “Alles is hier zreq.”'] },
    { scene: 'stadje', woord: { id: 'byed', ar: 'بيض', tr: 'byed', nl: 'wit' }, echo: 'Byed! Byed!',
      tekst: ['En de muren dan?', 'De muren zijn wit. Zo wit dat het pijn doet aan je ogen.', 'Blauw en wit, de hele stad.', '“Byed,” zegt Sbaa. “Daarom knijp je hier je ogen dicht.”'] },
    { scene: 'strand', woord: { id: 'melha', ar: 'ملحة', tr: 'melha', nl: 'zout' }, echo: 'Melha! Melha!',
      tekst: ['Adam likt aan zijn arm.', 'Hij trekt een gek gezicht.', '“Waarom ben ik zout?”', '“Melha,” zegt Sbaa. “Dat is de zee, die blijft even zitten.”'] },
    { scene: 'haven', woord: { id: 'mesh', ar: 'مش', tr: 'mesh', nl: 'kat' }, echo: 'Mesh! Mesh!',
      tekst: ['Op elke boot zit er een.', 'Op elke muur ook.', 'Ze wachten tot de netten opengaan.', '“Mesh,” zegt Sbaa. “Hier wonen er meer dan mensen.”'] },
    { scene: 'haven', woord: { id: 'kbir', ar: 'كبير', tr: 'kbir', nl: 'groot' }, echo: 'Kbir! Kbir!',
      tekst: ['De visser haalt er één uit het net.', 'Hij past niet in zijn twee handen.', 'Yassine doet een stap naar achteren.', '“Kbir,” lacht de visser. “Heel kbir.”'] },
    { scene: 'haven', woord: { id: 'sghir', ar: 'صغير', tr: 'sghir', nl: 'klein' }, echo: 'Sghir! Sghir!',
      tekst: ['Daarnaast ligt er nog eentje.', 'Zo groot als Rayans pink.', 'De visser gooit hem terug in zee.', '“Sghir,” zegt hij. “Die mag nog groeien.”'] },
    { scene: 'vuur', woord: { id: 'ldid', ar: 'لذيذ', tr: 'ldid', nl: 'lekker' }, echo: 'Ldid! Ldid!',
      tekst: ['Op de kade staan tafels.', 'De vis gaat op het vuur, met citroen erover.', 'Niemand zegt iets, want iedereen eet.', 'Dan zegt Adam met volle mond: “Ldid.”'] },
    { scene: 'zonsondergang', woord: { id: 'bsseha', ar: 'بصحة', tr: 'bsseha', nl: 'eet smakelijk' }, echo: 'Bsseha! Bsseha!',
      tekst: ['De zon zakt in het water.', 'De wind gaat liggen, ineens.', 'De visser steekt zijn hand op.', '“Bsseha!” roept hij. Dat zeg je als iemand eet.'] },
  ] as Blad[],
}

const DEEL4 = {
  nummer: 4,
  titel: 'Sbaa en de markt van duizend dingen',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat één keer mag kiezen en niet kan kiezen.',
  bladen: [
    { scene: 'plein', woord: { id: 'hanut', ar: 'حانوت', tr: 'hanut', nl: 'winkeltje' }, echo: 'Hanut! Hanut!',
      tekst: ['Het is geen winkel met een deur.', 'Het is een gat in de muur, vol tot boven.', 'De man erin kan er net bij.', '“Hanut,” zegt Sbaa. “Er staat alles in.”'] },
    { scene: 'kraam', woord: { id: 'limun', ar: 'ليمون', tr: 'limun', nl: 'sinaasappel' }, echo: 'Limun! Limun!',
      tekst: ['Een berg oranje, zo hoog als Adil.', 'De man perst er zes in één glas.', 'Het schuimt en het is koud.', '“Limun,” zegt hij. “Drink op.”'] },
    { scene: 'kraam', woord: { id: 'tfah', ar: 'تفاح', tr: 'tfah', nl: 'appel' }, echo: 'Tfah! Tfah!',
      tekst: ['Adam wijst naar iets roods.', 'Hij weet niet hoe het heet.', 'Hij wijst nog een keer.', '“Tfah,” zegt de vrouw, en ze geeft hem er een.'] },
    { scene: 'kraam', woord: { id: 'shhal', ar: 'شحال', tr: 'shhal', nl: 'hoeveel' }, echo: 'Shhal! Shhal!',
      tekst: ['“Wat moet je vragen?” fluistert Adil.', '“Eén woord,” zegt Sbaa.', 'Adil haalt adem.', '“Shhal?” vraagt hij. En de man antwoordt.'] },
    { scene: 'kraam', woord: { id: 'ghali', ar: 'غالي', tr: 'ghali', nl: 'duur' }, echo: 'Ghali! Ghali!',
      tekst: ['De man noemt een getal.', 'Sbaa trekt één wenkbrauw op.', 'Hij zegt het zonder boos te worden.', '“Ghali,” zegt hij. “Dat is duur.”'] },
    { scene: 'kraam', woord: { id: 'rkhis', ar: 'رخيص', tr: 'rkhis', nl: 'goedkoop' }, echo: 'Rkhis! Rkhis!',
      tekst: ['De man lacht en noemt een ander getal.', 'Sbaa knikt.', 'Zo gaat dat hier: heen en weer, tot het klopt.', '“Rkhis,” zegt de man. “Nu is het rkhis.”'] },
    { scene: 'kraam', woord: { id: 'derhem', ar: 'درهم', tr: 'derhem', nl: 'dirham' }, echo: 'Derhem! Derhem!',
      tekst: ['Yassine haalt zijn zak leeg.', 'Er komen stenen uit, en dopjes, en munten.', 'De munten zijn zilver en zwaar.', '“Derhem,” zegt Sbaa. “Daar betaal je hier mee.”'] },
    { scene: 'kraam', woord: { id: 'flus', ar: 'فلوس', tr: 'flus', nl: 'geld' }, echo: 'Flus! Flus!',
      tekst: ['Ze tellen samen.', 'Het is bijna genoeg. Bijna.', 'Rayan legt er één muntje bij, van hemzelf.', '“Nu wel,” zegt Sbaa. “Nu is er flus.”'] },
    { scene: 'plein', woord: { id: '3tini', ar: 'عطيني', tr: '3tini', nl: 'geef me' }, echo: '3tini! 3tini!',
      tekst: ['Nu Adam nog.', 'Hij weet precies wat hij wil.', 'Hij wijst en hij zegt het hardop.', '“3tini,” zegt hij. En hij krijgt het.'] },
    { scene: 'plein', woord: { id: 'afak', ar: 'عفاك', tr: 'afak', nl: 'alsjeblieft' }, echo: 'Afak! Afak!',
      tekst: ['De vrouw wacht nog even.', 'Ze kijkt Adam aan met haar hand omhoog.', 'Sbaa fluistert één woord in zijn oor.', '“Afak,” zegt Adam. En dán krijgt hij het.'] },
    { scene: 'plein', woord: { id: 'gnawa', ar: 'ݣناوة', tr: 'gnawa', nl: 'gnawa-muziek' }, echo: 'Gnawa! Gnawa!',
      tekst: ['Midden op het plein staat een kring.', 'Grote ijzeren castagnetten, en één trommel.', 'Je voelt het in je buik voordat je het hoort.', '“Gnawa,” zegt Sbaa. “Luister.”'] },
    { scene: 'plein', woord: { id: 'wakha', ar: 'واخا', tr: 'wakha', nl: 'oké' }, echo: 'Wakha! Wakha!',
      tekst: ['Het wordt donker boven het plein.', '“Nog één keer kijken?” vraagt Rayan.', 'Sbaa kijkt naar de lucht. Dan naar Rayan.', '“Wakha,” zegt hij. “Nog één keer.”'] },
  ] as Blad[],
}

const DEEL5 = {
  nummer: 5,
  titel: 'Sbaa en het grote feest',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat op het feest het liedje niet meezong. Nu wel.',
  bladen: [
    { scene: 'huis', woord: { id: '3id', ar: 'العيد', tr: 'l3id', nl: 'het feest' }, echo: '3id! 3id!',
      tekst: ['Er hangt iets in de lucht vandaag.', 'Iedereen loopt sneller. Iedereen heeft iets vast.', '“Wat is er?” vraagt Rayan.', '“L3id,” zegt Sbaa. “Het feest.”'] },
    { scene: 'huis', woord: { id: 'aila', ar: 'العائلة', tr: 'l3a’ila', nl: 'de familie' }, echo: 'Aila! Aila!',
      tekst: ['Bij jeddti gaat de deur niet meer dicht.', 'Ooms, tantes, neven, buren die ook oom heten.', 'Niemand weet precies hoeveel.', '“L3a’ila,” zegt Sbaa. “Allemaal familie.”'] },
    { scene: 'huis', woord: { id: 'jellaba', ar: 'جلابة', tr: 'jellaba', nl: 'djellaba' }, echo: 'Jellaba! Jellaba!',
      tekst: ['Op het bed liggen ze klaar.', 'Met een punt aan de capuchon.', 'Amir trekt die van hem meteen over zijn hoofd.', '“Jellaba,” lacht jeddti. “Andersom.”'] },
    { scene: 'keuken', woord: { id: 'kesksu', ar: 'كسكس', tr: 'kesksu', nl: 'couscous' }, echo: 'Kesksu! Kesksu!',
      tekst: ['In de keuken staat een schaal.', 'Zo groot dat er drie handen tegelijk in kunnen.', 'De stoom slaat tegen het raam.', '“Kesksu,” zegt jeddti. “Vrijdag is kesksu.”'] },
    { scene: 'keuken', woord: { id: 'jjem3a', ar: 'الجمعة', tr: 'jjem3a', nl: 'vrijdag' }, echo: 'Jjem3a! Jjem3a!',
      tekst: ['“Waarom vrijdag?” vraagt Adil.', 'Jeddti denkt na terwijl ze roert.', '“Omdat mijn moeder het op vrijdag deed.”', '“Jjem3a,” zegt ze. “Altijd al.”'] },
    { scene: 'keuken', woord: { id: 'tajine', ar: 'طاجين', tr: 'tajine', nl: 'tajine' }, echo: 'Tajine! Tajine!',
      tekst: ['Naast de schaal staat een pot met een hoed op.', 'Onder de hoed pruttelt het.', 'Jeddti tilt hem een klein stukje op.', '“Tajine,” zegt ze. “Kijken mag. Vingers niet.”'] },
    { scene: 'keuken', woord: { id: 'msemmen', ar: 'مسمن', tr: 'msemmen', nl: 'msemmen' }, echo: 'Msemmen! Msemmen!',
      tekst: ['Jeddti slaat het deeg plat.', 'Vouwt het, slaat het weer plat.', 'Het wordt dun en vierkant en glanst van de boter.', '“Msemmen,” zegt ze. “Neem de eerste, Rayan.”'] },
    { scene: 'binnenhof', woord: { id: 'henna', ar: 'حناء', tr: 'henna', nl: 'henna' }, echo: 'Henna! Henna!',
      tekst: ['Yousra moet stil zitten.', 'Dat is moeilijk als je hand kriebelt.', 'De tante tekent bloemen tot aan haar pols.', '“Henna,” zegt ze. “Morgen is hij bruin.”'] },
    { scene: 'binnenhof', woord: { id: 'khoya', ar: 'خويا', tr: 'khoya', nl: 'mijn broer' }, echo: 'Khoya! Khoya!',
      tekst: ['Amir mag ook.', 'Maar alleen één stip, zegt hij. Meer niet.', 'Adam komt kijken en lacht hem uit.', '“Khoya,” zucht Amir. “Mijn broer dus.”'] },
    { scene: 'binnenhof', woord: { id: 'khti', ar: 'ختي', tr: 'khti', nl: 'mijn zus' }, echo: 'Khti! Khti!',
      tekst: ['Yousra houdt haar handen omhoog.', 'Ze mag nu niets meer aanraken.', 'Dus voert Rayan haar een stuk msemmen.', '“Khti,” zegt hij trots. “Mijn zus.”'] },
    { scene: 'tafel', woord: { id: 'ferhan', ar: 'فرحان', tr: 'ferhan', nl: 'blij' }, echo: 'Ferhan! Ferhan!',
      tekst: ['Ze zitten met te veel mensen aan één tafel.', 'Iedereen praat door elkaar heen.', 'Sbaa past er net bij, half in de deur.', 'Jeddti kijkt rond en zegt: “Ana ferhan.” Ik ben blij.'] },
    { scene: 'nacht', woord: { id: 'thalla', ar: 'تهلا', tr: 'thalla', nl: 'zorg goed voor jezelf' }, echo: 'Thalla! Thalla!',
      tekst: ['Het is heel laat.', 'Sbaa moet terug naar de bergen.', 'Jeddti houdt zijn poot vast bij de deur.', '“Thalla,” zegt ze. Dat is meer dan doei.'] },
  ] as Blad[],
}

/** De eerste verhaallijn: vijf delen, zestig woorden, één leeuw. */
export const DELEN = [DEEL1, DEEL2, DEEL3, DEEL4, DEEL5]
export { DEEL1 }
