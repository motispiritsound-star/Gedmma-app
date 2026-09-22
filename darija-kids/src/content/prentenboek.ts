/**
 * Sba de Atlasleeuw — deel 1: De poorten van Fes.
 *
 * Een prentenboek voor twee tot acht jaar. De ouder leest het in het
 * Nederlands voor en struikelt één keer per bladzijde over een woord Darija —
 * en dat struikelen ís het verhaal. Alle twaalf woorden staan in de app en
 * zijn ingesproken, dus de QR-code achterin kost niets.
 *
 * Vaste bezetting: Sba en zes kinderen. Ze zijn er niet alle zes op elke
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
  { id: 'sba', naam: 'Sba', leeftijd: 0,
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

export interface Deel {
  nummer: number
  /** Waar dit deel speelt; staat vooraan, zodat een kind weet waar het is. */
  waar: string
  /** Wat er in het volgende deel gebeurt. De laatste bladzijde van het boek. */
  hierna: string
  titel: string
  ondertitel: string
  leeftijd: string
  opdracht: string
  bladen: Blad[]
}

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
  waar: 'In de medina van Fes',
  hierna: 'In deel 2 klimt Sba de bergen in. Neem een jas mee.',
  titel: 'Sba en de poorten van Fes',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat zijn oma wél verstaat, maar haar nog niet kan antwoorden.',
  bladen: [
    {
      scene: 'atlas',
      tekst: [
        'Hoog in de bergen woont een leeuw.',
        'Hij heet Sba.',
        'Vandaag komen er kinderen op bezoek.',
        '“Salam!” roept Sba naar beneden.',
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
        '“Dat is een bab,” zegt Sba.',
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
        'dat Sba zijn schouders moet intrekken.',
        '“Waar zijn we?” vraagt Adil.',
        '“In de medina,” zegt Sba. “De oudste stad van het land.”',
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
        '“Aan de kant,” zegt Sba. “Daar komt een hmar.”',
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
        '“Dit is de souq,” zegt Sba. “De markt.”',
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
        '“De shems gaat slapen,” zegt Sba.',
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
        'Sba gaat terug naar de bergen.',
        '“Kom je nog een keer?” vraagt Rayan.',
        '“Bslama,” zegt Sba. “Dat is: tot ziens.”',
        'En dat is geen afscheid voor altijd.',
      ],
      woord: { id: 'bslama', ar: 'بسلامة', tr: 'bslama', nl: 'tot ziens' },
      echo: 'Bslama! Bslama!',
    },
  ] as Blad[],
}

const DEEL2 = {
  nummer: 2,
  waar: 'In het Atlasgebergte',
  hierna: 'In deel 3 ruikt het naar zout. Ze gaan naar de zee.',
  titel: 'Sba en de berg die wit werd',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat denkt dat het in Marokko nooit koud is.',
  bladen: [
    { scene: 'atlas', woord: { id: 'jbel', ar: 'جبل', tr: 'jbel', nl: 'berg' }, echo: 'Jbel! Jbel!',
      tekst: ['Sba woont hoog.', 'Zo hoog dat de wolken onder hem hangen.', '“Kom je kijken?” vraagt hij.', '“Naar wat?” vraagt Amir.', '“Naar mijn jbel.”'] },
    { scene: 'bergpad', woord: { id: 'bred', ar: 'بارد', tr: 'bred', nl: 'koud' }, echo: 'Bred! Bred!',
      tekst: ['Ze klimmen en klimmen.', 'Yassine doet zijn pet af.', 'Dan doet hij hem snel weer op.', '“Bred,” zegt Sba. “Dat is koud.”'] },
    { scene: 'sneeuw', woord: { id: 'telj', ar: 'تلج', tr: 'telj', nl: 'sneeuw' }, echo: 'Telj! Telj!',
      tekst: ['Boven ligt iets wits.', 'Het is zacht en het smelt in je hand.', '“Sneeuw?” roept Adam. “In Marokko?”', '“Telj,” lacht Sba. “Elk jaar weer.”'] },
    { scene: 'weide', woord: { id: 'm3za', ar: 'معزة', tr: 'm3za', nl: 'geit' }, echo: 'M3za! M3za!',
      tekst: ['Iets staat in een boom.', 'Hoog in de takken, alsof dat gewoon is.', 'Het kijkt de kinderen aan en kauwt door.', '“Een m3za,” zegt Sba. “Die klimmen hier.”'] },
    { scene: 'weide', woord: { id: 'khruf', ar: 'خروف', tr: 'khruf', nl: 'schaap' }, echo: 'Khruf! Khruf!',
      tekst: ['Dan komt de rest.', 'Wit, bruin, en één helemaal zwart.', 'Ze lopen om Rayan heen alsof hij een paal is.', '“Khruf,” zegt de herder. “Pas op je tenen.”'] },
    { scene: 'tent', woord: { id: 'hlib', ar: 'حليب', tr: 'hlib', nl: 'melk' }, echo: 'Hlib! Hlib!',
      tekst: ['De herder heet Idir.', 'Hij geeft ze een kom.', 'Hij is nog warm van de geit.', '“Hlib,” zegt Idir. “Drink maar.”'] },
    { scene: 'bergpad', woord: { id: 'kaydar', ar: 'عود', tr: 'kaydar', nl: 'paard' }, echo: 'Kaydar! Kaydar!',
      tekst: ['Amir is moe.', 'Hij zegt het niet, maar hij loopt achteraan.', 'Idir fluit één keer.', 'Achter de rots staat een kaydar. Een paard.'] },
    { scene: 'tent', woord: { id: 'zerbiya', ar: 'زربية', tr: 'zerbiya', nl: 'tapijt' }, echo: 'Zerbiya! Zerbiya!',
      tekst: ['In de tent ligt geen vloer.', 'Er ligt wol, in rood en zwart.', 'Yousra tekent het patroon na.', '“Zerbiya,” zegt Idirs moeder. “Mijn moeder maakte hem.”'] },
    { scene: 'tent', woord: { id: 'tamazight', ar: 'تمازيغت', tr: 'tamazight', nl: 'Amazigh' }, echo: 'Tamazight! Tamazight!',
      tekst: ['Idir praat met zijn moeder.', 'De kinderen verstaan er niets van.', '“Wat zegt hij?” fluistert Adil.', '“Tamazight,” zegt Sba. “Ook een taal van hier.”'] },
    { scene: 'sneeuw', woord: { id: 'yallah', ar: 'يالله', tr: 'yallah', nl: 'kom op' }, echo: 'Yallah! Yallah!',
      tekst: ['De wolk komt dichterbij.', 'Idir kijkt omhoog en staat op.', 'Hij zegt maar één woord.', '“Yallah!” En iedereen rent.'] },
    { scene: 'top', woord: { id: 'mzyan', ar: 'مزيان', tr: 'mzyan', nl: 'mooi' }, echo: 'Mzyan! Mzyan!',
      tekst: ['Bij de grot draaien ze zich om.', 'Onder hen ligt het hele dal.', 'Niemand zegt iets.', 'Dan zegt Rayan: “Mzyan.” En dat klopt.'] },
    { scene: 'top', woord: { id: 'shukran', ar: 'شكرا', tr: 'shukran', nl: 'dankjewel' }, echo: 'Shukran! Shukran!',
      tekst: ['De wolk trekt voorbij.', 'Idir brengt ze terug tot aan het pad.', 'Hij wil niets hebben voor de melk.', '“Shukran,” zegt Sba. En hij meent het.'] },
  ] as Blad[],
}

const DEEL3 = {
  nummer: 3,
  waar: 'Aan zee, bij Essaouira',
  hierna: 'In deel 4 wordt er afgedongen. Neem je dirhams mee.',
  titel: 'Sba en de wind van de zee',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat de zee alleen van de foto’s kent.',
  bladen: [
    { scene: 'duin', woord: { id: 'bhar', ar: 'بحر', tr: 'bhar', nl: 'zee' }, echo: 'Bhar! Bhar!',
      tekst: ['Eerst hoor je het.', 'Dan ruik je het.', 'En dan sta je erop en houdt het niet op.', '“Bhar,” zegt Sba. “De zee.”'] },
    { scene: 'strand', woord: { id: 'rih', ar: 'ريح', tr: 'rih', nl: 'wind' }, echo: 'Rih! Rih!',
      tekst: ['Yousra’s schetsboek klapt open.', 'De bladzijden slaan om, helemaal alleen.', 'Adams pet gaat de lucht in.', '“Rih,” lacht Sba, en hij rent erachteraan.'] },
    { scene: 'haven', woord: { id: 'hut', ar: 'حوت', tr: 'hut', nl: 'vis' }, echo: 'Hut! Hut!',
      tekst: ['De boten zijn blauw. Allemaal.', 'De netten liggen open op de kade.', 'Er springt nog iets in.', '“Hut,” zegt de visser. “Vanochtend gevangen.”'] },
    { scene: 'haven', woord: { id: 'twiar', ar: 'طيور', tr: 'twiar', nl: 'vogels' }, echo: 'Twiar! Twiar!',
      tekst: ['Boven de netten is het druk.', 'Wit, schreeuwend, en veel te dichtbij.', 'Rayan houdt zijn broodje vast met twee handen.', '“Twiar,” zegt Sba. “Pas op, die pakken alles.”'] },
    { scene: 'haven', woord: { id: 'zreq', ar: 'زرق', tr: 'zreq', nl: 'blauw' }, echo: 'Zreq! Zreq!',
      tekst: ['Yousra telt de kleuren.', 'De boten: blauw. De deuren: blauw.', 'De luiken, de kar, zelfs de emmer.', '“Zreq,” zegt ze. “Alles is hier zreq.”'] },
    { scene: 'stadje', woord: { id: 'byed', ar: 'بيض', tr: 'byed', nl: 'wit' }, echo: 'Byed! Byed!',
      tekst: ['En de muren dan?', 'De muren zijn wit. Zo wit dat het pijn doet aan je ogen.', 'Blauw en wit, de hele stad.', '“Byed,” zegt Sba. “Daarom knijp je hier je ogen dicht.”'] },
    { scene: 'strand', woord: { id: 'melha', ar: 'ملحة', tr: 'melha', nl: 'zout' }, echo: 'Melha! Melha!',
      tekst: ['Adam likt aan zijn arm.', 'Hij trekt een gek gezicht.', '“Waarom ben ik zout?”', '“Melha,” zegt Sba. “Dat is de zee, die blijft even zitten.”'] },
    { scene: 'haven', woord: { id: 'mesh', ar: 'مش', tr: 'mesh', nl: 'kat' }, echo: 'Mesh! Mesh!',
      tekst: ['Op elke boot zit er een.', 'Op elke muur ook.', 'Ze wachten tot de netten opengaan.', '“Mesh,” zegt Sba. “Hier wonen er meer dan mensen.”'] },
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
  waar: 'Op de markt van Marrakech',
  hierna: 'In deel 5 staat de hele familie in de keuken. Het wordt feest.',
  titel: 'Sba en de markt van duizend dingen',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat één keer mag kiezen en niet kan kiezen.',
  bladen: [
    { scene: 'plein', woord: { id: 'hanut', ar: 'حانوت', tr: 'hanut', nl: 'winkeltje' }, echo: 'Hanut! Hanut!',
      tekst: ['Het is geen winkel met een deur.', 'Het is een gat in de muur, vol tot boven.', 'De man erin kan er net bij.', '“Hanut,” zegt Sba. “Er staat alles in.”'] },
    { scene: 'kraam', woord: { id: 'limun', ar: 'ليمون', tr: 'limun', nl: 'sinaasappel' }, echo: 'Limun! Limun!',
      tekst: ['Een berg oranje, zo hoog als Adil.', 'De man perst er zes in één glas.', 'Het schuimt en het is koud.', '“Limun,” zegt hij. “Drink op.”'] },
    { scene: 'kraam', woord: { id: 'tfah', ar: 'تفاح', tr: 'tfah', nl: 'appel' }, echo: 'Tfah! Tfah!',
      tekst: ['Adam wijst naar iets roods.', 'Hij weet niet hoe het heet.', 'Hij wijst nog een keer.', '“Tfah,” zegt de vrouw, en ze geeft hem er een.'] },
    { scene: 'kraam', woord: { id: 'shhal', ar: 'شحال', tr: 'shhal', nl: 'hoeveel' }, echo: 'Shhal! Shhal!',
      tekst: ['“Wat moet je vragen?” fluistert Adil.', '“Eén woord,” zegt Sba.', 'Adil haalt adem.', '“Shhal?” vraagt hij. En de man antwoordt.'] },
    { scene: 'kraam', woord: { id: 'ghali', ar: 'غالي', tr: 'ghali', nl: 'duur' }, echo: 'Ghali! Ghali!',
      tekst: ['De man noemt een getal.', 'Sba trekt één wenkbrauw op.', 'Hij zegt het zonder boos te worden.', '“Ghali,” zegt hij. “Dat is duur.”'] },
    { scene: 'kraam', woord: { id: 'rkhis', ar: 'رخيص', tr: 'rkhis', nl: 'goedkoop' }, echo: 'Rkhis! Rkhis!',
      tekst: ['De man lacht en noemt een ander getal.', 'Sba knikt.', 'Zo gaat dat hier: heen en weer, tot het klopt.', '“Rkhis,” zegt de man. “Nu is het rkhis.”'] },
    { scene: 'kraam', woord: { id: 'derhem', ar: 'درهم', tr: 'derhem', nl: 'dirham' }, echo: 'Derhem! Derhem!',
      tekst: ['Yassine haalt zijn zak leeg.', 'Er komen stenen uit, en dopjes, en munten.', 'De munten zijn zilver en zwaar.', '“Derhem,” zegt Sba. “Daar betaal je hier mee.”'] },
    { scene: 'kraam', woord: { id: 'flus', ar: 'فلوس', tr: 'flus', nl: 'geld' }, echo: 'Flus! Flus!',
      tekst: ['Ze tellen samen.', 'Het is bijna genoeg. Bijna.', 'Rayan legt er één muntje bij, van hemzelf.', '“Nu wel,” zegt Sba. “Nu is er flus.”'] },
    { scene: 'plein', woord: { id: '3tini', ar: 'عطيني', tr: '3tini', nl: 'geef me' }, echo: '3tini! 3tini!',
      tekst: ['Nu Adam nog.', 'Hij weet precies wat hij wil.', 'Hij wijst en hij zegt het hardop.', '“3tini,” zegt hij. En hij krijgt het.'] },
    { scene: 'plein', woord: { id: 'afak', ar: 'عفاك', tr: 'afak', nl: 'alsjeblieft' }, echo: 'Afak! Afak!',
      tekst: ['De vrouw wacht nog even.', 'Ze kijkt Adam aan met haar hand omhoog.', 'Sba fluistert één woord in zijn oor.', '“Afak,” zegt Adam. En dán krijgt hij het.'] },
    { scene: 'plein', woord: { id: 'gnawa', ar: 'ݣناوة', tr: 'gnawa', nl: 'gnawa-muziek' }, echo: 'Gnawa! Gnawa!',
      tekst: ['Midden op het plein staat een kring.', 'Grote ijzeren castagnetten, en één trommel.', 'Je voelt het in je buik voordat je het hoort.', '“Gnawa,” zegt Sba. “Luister.”'] },
    { scene: 'plein', woord: { id: 'wakha', ar: 'واخا', tr: 'wakha', nl: 'oké' }, echo: 'Wakha! Wakha!',
      tekst: ['Het wordt donker boven het plein.', '“Nog één keer kijken?” vraagt Rayan.', 'Sba kijkt naar de lucht. Dan naar Rayan.', '“Wakha,” zegt hij. “Nog één keer.”'] },
  ] as Blad[],
}

const DEEL5 = {
  nummer: 5,
  waar: 'Thuis bij jeddti',
  hierna: 'In deel 6 gaat de bel. Sba gaat naar school.',
  titel: 'Sba en het grote feest',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat op het feest het liedje niet meezong. Nu wel.',
  bladen: [
    { scene: 'huis', woord: { id: '3id', ar: 'العيد', tr: 'l3id', nl: 'het feest' }, echo: '3id! 3id!',
      tekst: ['Er hangt iets in de lucht vandaag.', 'Iedereen loopt sneller. Iedereen heeft iets vast.', '“Wat is er?” vraagt Rayan.', '“L3id,” zegt Sba. “Het feest.”'] },
    { scene: 'huis', woord: { id: 'aila', ar: 'العائلة', tr: 'l3a’ila', nl: 'de familie' }, echo: 'Aila! Aila!',
      tekst: ['Bij jeddti gaat de deur niet meer dicht.', 'Ooms, tantes, neven, buren die ook oom heten.', 'Niemand weet precies hoeveel.', '“L3a’ila,” zegt Sba. “Allemaal familie.”'] },
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
      tekst: ['Ze zitten met te veel mensen aan één tafel.', 'Iedereen praat door elkaar heen.', 'Sba past er net bij, half in de deur.', 'Jeddti kijkt rond en zegt: “Ana ferhan.” Ik ben blij.'] },
    { scene: 'nacht', woord: { id: 'thalla', ar: 'تهلا', tr: 'thalla', nl: 'zorg goed voor jezelf' }, echo: 'Thalla! Thalla!',
      tekst: ['Het is heel laat.', 'Sba moet terug naar de bergen.', 'Jeddti houdt zijn poot vast bij de deur.', '“Thalla,” zegt ze. Dat is meer dan doei.'] },
  ] as Blad[],
}


const DEEL6 = {
  nummer: 6, waar: 'Op school',
  hierna: 'In deel 7 slapen ze op het dak, onder de sterren.',
  titel: 'Sba gaat naar school', ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar', opdracht: 'Voor ieder kind dat op de eerste dag niemand kende.',
  bladen: [
    { scene: 'schoolplein', woord: { id: 'medrasa', ar: 'المدرسة', tr: 'lmedrasa', nl: 'de school' }, echo: 'Medrasa! Medrasa!',
      tekst: ['Er is een deur met een bel ernaast.', 'Achter de deur hoor je honderd kinderen.', '“Wat is dit?” vraagt Rayan.', '“Lmedrasa,” zegt Sba. “De school.”'] },
    { scene: 'klas', woord: { id: 'qism', ar: 'القسم', tr: 'lqism', nl: 'de klas' }, echo: 'Qism! Qism!',
      tekst: ['Binnen zijn er deuren en nog eens deuren.', 'Achter elke deur zitten kinderen op rijen.', 'Sba past er maar net doorheen.', '“Lqism,” zegt hij zachtjes. “Niet te hard praten.”'] },
    { scene: 'klas', woord: { id: 'ostada', ar: 'الأستاذة', tr: 'lostada', nl: 'de juf' }, echo: 'Ostada! Ostada!',
      tekst: ['Vooraan staat een vrouw met krijt.', 'Ze kijkt op en ze schrikt niet eens van een leeuw.', '“Kom binnen,” zegt ze. “Er is plek.”', '“Lostada,” fluistert Sba. “De juf.”'] },
    { scene: 'klas', woord: { id: 'telmid', ar: 'تلميذ', tr: 'telmid', nl: 'leerling' }, echo: 'Telmid! Telmid!',
      tekst: ['Achteraan zit een jongen alleen.', 'Hij is vandaag voor het eerst hier.', 'Yassine gaat naast hem zitten. Zomaar.', '“Telmid,” zegt de juf. “Net als jullie.”'] },
    { scene: 'klas', woord: { id: 'sebbura', ar: 'السبورة', tr: 'ssebbura', nl: 'het bord' }, echo: 'Sebbura! Sebbura!',
      tekst: ['De juf schrijft één letter.', 'Hij krult als een golf.', 'Hij gaat van rechts naar links, andersom dus.', '“Ssebbura,” zegt ze. “Kijk allemaal.”'] },
    { scene: 'klas', woord: { id: 'qlem', ar: 'قلم', tr: 'qlem', nl: 'potlood' }, echo: 'Qlem! Qlem!',
      tekst: ['Yousra heeft er altijd een achter haar oor.', 'Nu heeft ze er twee nodig.', 'Ze geeft er een aan de nieuwe jongen.', '“Qlem,” zegt ze erbij. Hij knikt.'] },
    { scene: 'klas', woord: { id: 'kunash', ar: 'كناش', tr: 'kunash', nl: 'schrift' }, echo: 'Kunash! Kunash!',
      tekst: ['Elk kind krijgt er een.', 'De eerste bladzijde is het moeilijkst.', 'Die is helemaal leeg en helemaal wit.', '“Kunash,” zegt de juf. “Begin maar.”'] },
    { scene: 'klas', woord: { id: 'ktab', ar: 'كتاب', tr: 'ktab', nl: 'boek' }, echo: 'Ktab! Ktab!',
      tekst: ['Sba haalt iets uit zijn tas.', 'Het is oud en de hoeken zijn zacht van het lezen.', 'Hij legt het open op de tafel.', '“Ktab,” zegt hij. “Deze las ik ook.”'] },
    { scene: 'klas', woord: { id: 'bshwiya', ar: 'بشوية', tr: 'bshwiya', nl: 'langzaam' }, echo: 'Bshwiya! Bshwiya!',
      tekst: ['Amir wil als eerste klaar zijn.', 'Zijn letters vallen om als dominostenen.', 'De juf legt haar hand op zijn schrift.', '“Bshwiya,” zegt ze. “Rustig aan.”'] },
    { scene: 'klas', woord: { id: 'wajib', ar: 'واجب', tr: 'wajib', nl: 'huiswerk' }, echo: 'Wajib! Wajib!',
      tekst: ['Aan het eind schrijft de juf iets op.', 'Iedereen kreunt tegelijk, ook Sba.', 'Dat is overal hetzelfde ter wereld.', '“Wajib,” zegt ze. “Drie letters. Meer niet.”'] },
    { scene: 'schoolplein', woord: { id: 'imtihan', ar: 'امتحان', tr: 'imtihan', nl: 'toets' }, echo: 'Imtihan! Imtihan!',
      tekst: ['De nieuwe jongen is bang voor morgen.', 'Sba gaat naast hem op het muurtje zitten.', '“Ik kon het ook niet,” zegt hij. “Eerst.”', '“Een imtihan is maar een dag.”'] },
    { scene: 'schoolplein', woord: { id: '3otla', ar: 'عطلة', tr: '3otla', nl: 'vakantie' }, echo: '3otla! 3otla!',
      tekst: ['Dan gaat de bel.', 'Honderd kinderen tegelijk de poort uit.', 'De juf roept iets na, maar niemand hoort het.', '“3OTLA!” roept iedereen. Vakantie.'] },
  ] as Blad[],
}

const DEEL7 = {
  nummer: 7, waar: 'In het huis met de binnenplaats',
  hierna: 'In deel 8 tellen ze alles wat vier poten heeft. En twee. En geen.',
  titel: 'Sba en het huis met het dakterras', ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar', opdracht: 'Voor ieder kind dat bij oma op de grond mocht slapen.',
  bladen: [
    { scene: 'huis', woord: { id: 'dar', ar: 'الدار', tr: 'ddar', nl: 'het huis' }, echo: 'Dar! Dar!',
      tekst: ['Van buiten lijkt het niets.', 'Een muur, een deur, en verder niets.', 'Maar binnen is er een binnenplaats met een boom.', '“Ddar,” zegt Sba. “Zo zijn de huizen hier.”'] },
    { scene: 'huis', woord: { id: 'bit', ar: 'بيت', tr: 'bit', nl: 'kamer' }, echo: 'Bit! Bit!',
      tekst: ['De kamers liggen allemaal om de binnenplaats.', 'Geen gang, geen trap: je stapt zo naar buiten.', 'Adil telt er zes, en dan nog een.', '“Bit,” zegt Sba. “Elke deur is er een.”'] },
    { scene: 'binnenhof', woord: { id: 'sherjem', ar: 'شرجم', tr: 'sherjem', nl: 'raam' }, echo: 'Sherjem! Sherjem!',
      tekst: ['De ramen kijken niet naar de straat.', 'Ze kijken allemaal naar binnen, naar de boom.', 'Yousra vindt dat vreemd. Dan vindt ze het fijn.', '“Sherjem,” zegt ze, en ze tekent er een.'] },
    { scene: 'keuken', woord: { id: 'kuzina', ar: 'كوزينة', tr: 'kuzina', nl: 'keuken' }, echo: 'Kuzina! Kuzina!',
      tekst: ['Het ruikt naar ui en komijn.', 'Er staan pannen die groter zijn dan Rayan.', 'Iedereen loopt er in en uit.', '“Kuzina,” zegt Sba. “Het hart van het huis.”'] },
    { scene: 'keuken', woord: { id: 'tebla', ar: 'طبلة', tr: 'tebla', nl: 'tafel' }, echo: 'Tebla! Tebla!',
      tekst: ['De tafel is rond en laag.', 'Je zit er niet op een stoel maar op een kussen.', 'Iedereen kan bij de schaal in het midden.', '“Tebla,” zegt Sba. “Zo hoort het.”'] },
    { scene: 'keuken', woord: { id: 'kursi', ar: 'كرسي', tr: 'kursi', nl: 'stoel' }, echo: 'Kursi! Kursi!',
      tekst: ['Er is er één, in de hoek.', 'Daar zit jeddi. Alleen jeddi.', 'Niemand heeft dat ooit afgesproken.', '“Kursi,” zegt Sba zachtjes. “Die van hem.”'] },
    { scene: 'huis', woord: { id: 'mraya', ar: 'مراية', tr: 'mraya', nl: 'spiegel' }, echo: 'Mraya! Mraya!',
      tekst: ['In de gang hangt iets met een koperen rand.', 'Adam ziet een leeuw met een fez.', 'Hij draait zich om. Daar staat hij.', '“Mraya,” lacht Sba. “Dat ben ik.”'] },
    { scene: 'huis', woord: { id: 'sarut', ar: 'ساروت', tr: 'sarut', nl: 'sleutel' }, echo: 'Sarut! Sarut!',
      tekst: ['Aan een spijker hangt er één.', 'Zwaar, van brons, en veel te groot.', 'Hij past op geen enkele deur meer.', '“Sarut,” zegt jeddti. “Van het huis van mijn moeder.”'] },
    { scene: 'huis', woord: { id: 'lfrash', ar: 'الفراش', tr: 'lfrash', nl: 'bed' }, echo: 'Lfrash! Lfrash!',
      tekst: ['’s Nachts worden de banken bedden.', 'Er komen dekens uit een kast die niemand kent.', 'Alle kinderen slapen in één kamer.', '“Lfrash,” zegt jeddti. “Genoeg voor iedereen.”'] },
    { scene: 'huis', woord: { id: 'dou', ar: 'الضو', tr: 'ddou', nl: 'het licht' }, echo: 'Dou! Dou!',
      tekst: ['Dan gaat alles uit.', 'Niet expres — dat gebeurt hier soms.', 'Even is het stil en heel donker.', '“Ddou,” zegt jeddti. “Komt zo terug.”'] },
    { scene: 'stah', woord: { id: 'stah', ar: 'السطح', tr: 'sstah', nl: 'dakterras' }, echo: 'Stah! Stah!',
      tekst: ['Ze klimmen de trap op in het donker.', 'Boven is er geen dak.', 'Er is alleen lucht, en de was aan een lijn.', '“Sstah,” zegt Sba. “Het mooiste van het huis.”'] },
    { scene: 'nacht', woord: { id: 'lil', ar: 'الليل', tr: 'llil', nl: 'de nacht' }, echo: 'Lil! Lil!',
      tekst: ['Ze liggen op hun rug op het dak.', 'De stad zoemt zachtjes onder hen.', 'Rayan telt sterren tot zeven en valt dan in slaap.', '“Llil,” zegt Sba. “Welterusten.”'] },
  ] as Blad[],
}

const DEEL8 = {
  nummer: 8, waar: 'Overal waar dieren zijn',
  hierna: 'In deel 9 eet Adam te veel. Dat loopt niet goed af.',
  titel: 'Sba en het dier dat zijn naam heeft', ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar', opdracht: 'Voor ieder kind dat wil weten hoe zijn naam in het Darija klinkt.',
  bladen: [
    { scene: 'weide', woord: { id: 'hayawanat', ar: 'الحيوانات', tr: 'lhayawanat', nl: 'de dieren' }, echo: 'Hayawanat! Hayawanat!',
      tekst: ['Vandaag gaan ze tellen.', 'Niet de huizen, niet de deuren.', 'Alles wat vier poten heeft, of twee, of geen.', '“Lhayawanat,” zegt Sba. “Begin maar.”'] },
    { scene: 'weide', woord: { id: 'kelb', ar: 'كلب', tr: 'kelb', nl: 'hond' }, echo: 'Kelb! Kelb!',
      tekst: ['Bij het hek staat er een.', 'Hij blaft één keer en kwispelt daarna.', 'Rayan verstopt zich achter Sba’s djellaba.', '“Kelb,” zegt Sba. “Hij doet niets.”'] },
    { scene: 'weide', woord: { id: 'bgra', ar: 'بݣرة', tr: 'bgra', nl: 'koe' }, echo: 'Bgra! Bgra!',
      tekst: ['In de wei staat er één.', 'Ze kauwt en ze kijkt en ze kauwt weer.', 'Ze heeft alle tijd van de wereld.', '“Bgra,” zegt Sba. “Zij haast zich nooit.”'] },
    { scene: 'weide', woord: { id: 'dzaza', ar: 'دجاجة', tr: 'dzaza', nl: 'kip' }, echo: 'Dzaza! Dzaza!',
      tekst: ['Op het erf lopen er acht.', 'Of negen. Ze blijven niet stilstaan.', 'Adam telt er telkens één dubbel.', '“Dzaza,” lacht Sba. “Tel ze maar niet.”'] },
    { scene: 'woestijn', woord: { id: 'jmel', ar: 'جمل', tr: 'jmel', nl: 'kameel' }, echo: 'Jmel! Jmel!',
      tekst: ['Hij is groter dan iedereen dacht.', 'Hij kijkt neer op Sba, en Sba is niet klein.', 'Zijn knieën klappen dubbel als hij gaat zitten.', '“Jmel,” zegt zijn baas. “Klim er maar op.”'] },
    { scene: 'huis', woord: { id: 'far', ar: 'فار', tr: 'far', nl: 'muis' }, echo: 'Far! Far!',
      tekst: ['In de voorraadkast beweegt iets.', 'Het is grijs en heel snel.', 'De kat van het huis slaapt er dwars doorheen.', '“Far,” fluistert Yousra. “Niet zeggen.”'] },
    { scene: 'binnenhof', woord: { id: 'nemla', ar: 'نملة', tr: 'nemla', nl: 'mier' }, echo: 'Nemla! Nemla!',
      tekst: ['Yassine ligt op zijn buik op de tegels.', 'Er loopt een rij, van de boom naar de muur.', 'Elke mier draagt iets dat te zwaar is.', '“Nemla,” zegt Sba. “Sterker dan wij allebei.”'] },
    { scene: 'binnenhof', woord: { id: 'fertetto', ar: 'فرططو', tr: 'fertetto', nl: 'vlinder' }, echo: 'Fertetto! Fertetto!',
      tekst: ['Er komt iets binnen door het raam.', 'Geel, met zwarte randen, en het gaat nergens rechtdoor.', 'Het landt op Rayans hand en blijft even.', '“Fertetto,” fluistert Sba. “Stil blijven.”'] },
    { scene: 'weide', woord: { id: 'hensh', ar: 'حنش', tr: 'hensh', nl: 'slang' }, echo: 'Hensh! Hensh!',
      tekst: ['Tussen de stenen ligt iets langs.', 'Iedereen doet twee stappen naar achteren.', 'Het glijdt weg voordat iemand iets zegt.', '“Hensh,” zegt Sba. “Hij schrok meer dan jij.”'] },
    { scene: 'plein', woord: { id: 'qerd', ar: 'قرد', tr: 'qerd', nl: 'aap' }, echo: 'Qerd! Qerd!',
      tekst: ['In het bos bij de bergen zitten ze in de bomen.', 'Ze kijken naar je alsof jij het dier bent.', 'Eentje heeft Adams pet te pakken. Alweer.', '“Qerd,” zucht Sba. “Die pet zien we nooit meer.”'] },
    { scene: 'weide', woord: { id: 'fil', ar: 'فيل', tr: 'fil', nl: 'olifant' }, echo: 'Fil! Fil!',
      tekst: ['“Zijn hier olifanten?” vraagt Adam.', 'Sba denkt lang na.', '“Vroeger wel. Nu niet meer.”', '“Fil,” zegt hij. “Alleen nog in boeken.”'] },
    { scene: 'atlas', woord: { id: 'sba3', ar: 'سبع', tr: 'sba3', nl: 'leeuw' }, echo: 'Sba3! Sba3!',
      tekst: ['“En jij dan?” vraagt Rayan.', 'Sba gaat zitten. Hij kijkt naar de bergen.', '“Ik ben de laatste die je hier ziet.”', '“Sba3,” zegt hij. “Zo heet ik. En zo heten wij.”'] },
  ] as Blad[],
}

const DEEL9 = {
  nummer: 9, waar: 'Bij de dokter',
  hierna: 'In deel 10 regent het. In Marokko regent het ook.',
  titel: 'Sba en de dokter van de medina', ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar', opdracht: 'Voor ieder kind dat een keer bang was en toen toch ging.',
  bladen: [
    { scene: 'medina', woord: { id: 'kersh', ar: 'كرش', tr: 'kersh', nl: 'buik' }, echo: 'Kersh! Kersh!',
      tekst: ['Adam eet vier msemmen.', 'Dan nog een halve.', 'Daarna wordt hij heel stil, en dat is niets voor hem.', '“Mijn kersh,” zegt hij. Zijn buik.'] },
    { scene: 'huis', woord: { id: 'mrid', ar: 'مريض', tr: 'mrid', nl: 'ziek' }, echo: 'Mrid! Mrid!',
      tekst: ['Jeddti legt haar hand op zijn voorhoofd.', 'Ze zegt niets, maar ze kijkt anders.', 'De anderen moeten buiten spelen.', '“Mrid,” zegt ze. “Hij is ziek.”'] },
    { scene: 'huis', woord: { id: 'ras', ar: 'راس', tr: 'ras', nl: 'hoofd' }, echo: 'Ras! Ras!',
      tekst: ['Adam wijst naar boven.', 'Niet naar het plafond — naar zijn hoofd.', 'Jeddti legt een natte doek op zijn voorhoofd.', '“Ras,” zegt ze. “Dat gaat over.”'] },
    { scene: 'medina', woord: { id: 'mustashfa', ar: 'المستشفى', tr: 'lmustashfa', nl: 'ziekenhuis' }, echo: 'Mustashfa! Mustashfa!',
      tekst: ['Toch gaan ze. Voor de zekerheid.', 'Het gebouw is wit en het ruikt vreemd.', 'Adam houdt Sba’s poot heel stevig vast.', '“Lmustashfa,” zegt Sba. “Ik blijf hier.”'] },
    { scene: 'klas', woord: { id: 'fomm', ar: 'فم', tr: 'fomm', nl: 'mond' }, echo: 'Fomm! Fomm!',
      tekst: ['De dokter heeft een lampje.', 'Ze vraagt of hij “aaaa” wil zeggen.', 'Adam zegt “aaaa” zo hard dat de gang het hoort.', '“Fomm,” lacht de dokter. “Genoeg zo.”'] },
    { scene: 'klas', woord: { id: 'snan', ar: 'سنان', tr: 'snan', nl: 'tanden' }, echo: 'Snan! Snan!',
      tekst: ['“En die?” vraagt ze.', 'Er zit een gaatje waar Adam niets over had gezegd.', 'Nu weet iedereen het.', '“Snan,” zegt de dokter. “Twee keer per dag.”'] },
    { scene: 'klas', woord: { id: '3in', ar: 'عين', tr: '3in', nl: 'oog' }, echo: '3in! 3in!',
      tekst: ['Ze schijnt in zijn ogen.', 'Links, rechts, en weer links.', 'Adam knippert en lacht erbij.', '“3in,” zegt ze. “Allebei goed.”'] },
    { scene: 'klas', woord: { id: 'yedd', ar: 'يد', tr: 'yedd', nl: 'hand' }, echo: 'Yedd! Yedd!',
      tekst: ['Er komt een prikje. Eén, heel klein.', 'Adam kijkt de andere kant op.', 'Rayan houdt zijn hand vast, met twee handen.', '“Yedd,” zegt Rayan. “Ik laat niet los.”'] },
    { scene: 'medina', woord: { id: 'qelb', ar: 'قلب', tr: 'qelb', nl: 'hart' }, echo: 'Qelb! Qelb!',
      tekst: ['De dokter legt iets kouds op zijn borst.', 'Ze luistert lang, met haar ogen dicht.', 'Adam durft niet te ademen.', '“Qelb,” zegt ze. “Die van jou doet het prima.”'] },
    { scene: 'medina', woord: { id: '3eyyan', ar: 'عيان', tr: '3eyyan', nl: 'moe' }, echo: '3eyyan! 3eyyan!',
      tekst: ['Buiten is het licht ineens te fel.', 'Adam loopt langzamer dan anders.', 'Sba tilt hem op zonder dat hij het vraagt.', '“3eyyan,” zegt Adam. Moe.'] },
    { scene: 'huis', woord: { id: 'rjel', ar: 'رجل', tr: 'rjel', nl: 'been' }, echo: 'Rjel! Rjel!',
      tekst: ['Thuis mag hij op de bank.', 'De anderen mogen er niet op zitten, vandaag.', 'Amir wrijft over zijn eigen been en zucht heel hard.', '“Rjel,” zegt hij. “Míjn been doet ook pijn.”'] },
    { scene: 'huis', woord: { id: 'bikhir', ar: 'بخير', tr: 'bikhir', nl: 'goed, prima' }, echo: 'Bikhir! Bikhir!',
      tekst: ['De volgende ochtend is hij als eerste wakker.', 'Hij staat al bij de kuzina als jeddti binnenkomt.', 'Ze vraagt hoe het gaat.', '“Bikhir,” zegt Adam. “Mag ik msemmen?”'] },
  ] as Blad[],
}

const DEEL10 = {
  nummer: 10, waar: 'Een dag van begin tot eind',
  hierna: 'In deel 11 raken ze de weg kwijt. Expres, bijna.',
  titel: 'Sba en de dag die niet wilde eindigen', ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar', opdracht: 'Voor ieder kind dat “morgen” nog niet kan uitrekenen.',
  bladen: [
    { scene: 'huis', woord: { id: 'sbah', ar: 'الصباح', tr: 'sbah', nl: 'ochtend' }, echo: 'Sbah! Sbah!',
      tekst: ['Het begint met brood en met de radio.', 'De zon staat nog laag tussen de huizen.', 'Jeddti is al drie uur wakker.', '“Sbah,” zegt ze. “De beste tijd van de dag.”'] },
    { scene: 'huis', woord: { id: 'lyum', ar: 'اليوم', tr: 'lyum', nl: 'vandaag' }, echo: 'Lyum! Lyum!',
      tekst: ['“Wat gaan we doen?” vraagt Rayan.', 'Hij vraagt het elke ochtend, altijd als eerste.', 'Sba kijkt uit het raam en denkt na.', '“Lyum,” zegt hij. “Vandaag gaan we ver.”'] },
    { scene: 'medina', woord: { id: 'daba', ar: 'دابا', tr: 'daba', nl: 'nu' }, echo: 'Daba! Daba!',
      tekst: ['“Wanneer dan?” vraagt Amir.', 'Hij staat al bij de deur met zijn schoenen aan.', 'Zijn schoenen staan trouwens verkeerd om.', '“Daba,” lacht Sba. “Nu meteen.”'] },
    { scene: 'plein', woord: { id: 'sa3a', ar: 'الساعة', tr: 'ssa3a', nl: 'het uur' }, echo: 'Sa3a! Sa3a!',
      tekst: ['Op de toren staat een klok.', 'Hij loopt tien minuten achter, al jaren.', 'Niemand die hem maakt, en niemand die klaagt.', '“Ssa3a,” zegt Sba. “Hier heeft niemand haast.”'] },
    { scene: 'zon', woord: { id: 'jjaw', ar: 'الجو', tr: 'jjaw', nl: 'het weer' }, echo: 'Jjaw! Jjaw!',
      tekst: ['De lucht wordt geel aan de rand.', 'De vogels gaan allemaal tegelijk zitten.', 'Jeddti haalt de was van het dak.', '“Jjaw,” zegt ze. “Er komt iets aan.”'] },
    { scene: 'binnenhof', woord: { id: 'shta', ar: 'الشتا', tr: 'shta', nl: 'regen' }, echo: 'Shta! Shta!',
      tekst: ['Eerst één druppel op de tegels.', 'Dan heel veel tegelijk, met lawaai.', 'De kinderen rennen naar binnen. Rayan niet.', '“Shta!” roept hij, midden op de binnenplaats.'] },
    { scene: 'binnenhof', woord: { id: 'skhun', ar: 'سخون', tr: 'skhun', nl: 'warm' }, echo: 'Skhun! Skhun!',
      tekst: ['Hij is drijfnat tot op zijn sokken.', 'Jeddti zegt niets. Ze pakt een handdoek.', 'Dan zet ze een glas in zijn handen, met munt erin.', '“Skhun,” zegt ze. “Voorzichtig, heet.”'] },
    { scene: 'keuken', woord: { id: 'simana', ar: 'سيمانة', tr: 'simana', nl: 'week' }, echo: 'Simana! Simana!',
      tekst: ['“Hoe lang blijven we nog?” vraagt Yousra.', 'Niemand heeft dat durven vragen.', 'Sba telt op zijn poot.', '“Simana,” zegt hij. “Nog één week.”'] },
    { scene: 'keuken', woord: { id: 'ghedda', ar: 'غدا', tr: 'ghedda', nl: 'morgen' }, echo: 'Ghedda! Ghedda!',
      tekst: ['“En wanneer gaan we naar de zee?”', '“Ghedda,” zegt Sba.', '“En wanneer is ghedda?”', '“Als je een keer geslapen hebt.”'] },
    { scene: 'huis', woord: { id: 'lbareh', ar: 'البارح', tr: 'lbareh', nl: 'gisteren' }, echo: 'Lbareh! Lbareh!',
      tekst: ['Rayan snapt het nog niet helemaal.', 'Voor hem is alles wat voorbij is even ver weg.', 'De zee van vorig jaar en het brood van vanochtend.', '“Lbareh,” zegt hij overal bij. Gisteren.'] },
    { scene: 'stah', woord: { id: 'shher', ar: 'شهر', tr: 'shher', nl: 'maand' }, echo: 'Shher! Shher!',
      tekst: ['Op het dak wijst jeddti naar de maan.', 'Hij is een dun streepje, als een nagel.', '“Als hij rond is en weer dun,” zegt ze.', '“Dan is er een shher voorbij.”'] },
    { scene: 'nacht', woord: { id: '3am', ar: 'عام', tr: '3am', nl: 'jaar' }, echo: '3am! 3am!',
      tekst: ['“En wanneer komen we terug?”', 'Daar wordt het stil van, heel even.', '“Volgend 3am,” zegt Sba. “Volgend jaar.”', 'Rayan knikt. Hij weet niet hoe lang dat is, en dat is maar goed ook.'] },
  ] as Blad[],
}

const DEEL11 = {
  nummer: 11, waar: 'Onderweg door de stad',
  hierna: 'In deel 12 ligt er een kaart op het dak. De laatste reis.',
  titel: 'Sba en de weg die niemand wist', ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar', opdracht: 'Voor ieder kind dat een keer de weg kwijt was en toch aankwam.',
  bladen: [
    { scene: 'plein', woord: { id: 'zenqa', ar: 'زنقة', tr: 'zenqa', nl: 'straat' }, echo: 'Zenqa! Zenqa!',
      tekst: ['De medina heeft duizenden straatjes.', 'Ze zijn smal en ze lijken allemaal op elkaar.', 'Adil vouwt de kaart open. Dan weer dicht.', '“Zenqa,” zegt Sba. “Hier helpt geen kaart.”'] },
    { scene: 'medina', woord: { id: 'fin', ar: 'فين', tr: 'fin', nl: 'waar' }, echo: 'Fin! Fin!',
      tekst: ['Ze staan stil op een kruispunt van vijf.', 'Vijf straatjes, en alle vijf zien er hetzelfde uit.', 'Adil haalt diep adem en vraagt het aan een vrouw.', '“Fin…?” begint hij. En zij wijst.'] },
    { scene: 'medina', woord: { id: 'nishan', ar: 'نيشان', tr: 'nishan', nl: 'rechtdoor' }, echo: 'Nishan! Nishan!',
      tekst: ['De vrouw praat snel en met haar handen.', 'Eén woord verstaat hij goed.', 'Ze wijst met haar hele arm vooruit.', '“Nishan,” zegt ze. Rechtdoor.'] },
    { scene: 'medina', woord: { id: 'limen', ar: 'ليمن', tr: 'limen', nl: 'rechts' }, echo: 'Limen! Limen!',
      tekst: ['Bij de bakker moeten ze afslaan.', 'Yassine gaat de verkeerde kant op.', 'Sba tikt hem op zijn andere schouder.', '“Limen,” zegt hij. “Die kant.”'] },
    { scene: 'medina', woord: { id: 'lisar', ar: 'ليسر', tr: 'lisar', nl: 'links' }, echo: 'Lisar! Lisar!',
      tekst: ['Daarna nog een keer, maar dan andersom.', 'Rayan houdt zijn handen omhoog en kijkt ernaar.', 'De ene hand weet het, de andere niet.', '“Lisar,” zegt Sba. “Die met de henna.”'] },
    { scene: 'medina', woord: { id: 'qeddam', ar: 'قدام', tr: 'qeddam', nl: 'vooruit' }, echo: 'Qeddam! Qeddam!',
      tekst: ['Amir wil weer vooroplopen.', 'Dat mag, maar niet verder dan Sba kan zien.', '“Blijf waar ik je zie.”', '“Qeddam,” roept Amir al. Vooruit.'] },
    { scene: 'medina', woord: { id: 'teht', ar: 'تحت', tr: 'teht', nl: 'onder' }, echo: 'Teht! Teht!',
      tekst: ['Het straatje wordt donker.', 'Boven hun hoofd lopen de huizen door.', 'Je loopt gewoon onder iemands slaapkamer.', '“Teht,” zegt Sba, en hij bukt.'] },
    { scene: 'plein', woord: { id: 'jame3', ar: 'جامع', tr: 'jame3', nl: 'moskee' }, echo: 'Jame3! Jame3!',
      tekst: ['Dan zien ze de toren weer.', 'Die is hoger dan alles en hij staat er altijd.', 'Wie hem ziet, weet waar hij is.', '“Ljame3,” zegt Sba. “Dat is ons punt.”'] },
    { scene: 'plein', woord: { id: 'tobis', ar: 'طوبيس', tr: 'tobis', nl: 'bus' }, echo: 'Tobis! Tobis!',
      tekst: ['Buiten de poort staat hij te wachten.', 'Blauw en wit en veel te vol.', 'Iedereen past erin. Altijd.', '“Tobis,” zegt Sba. “Hou je goed vast.”'] },
    { scene: 'duin', woord: { id: 'tomobil', ar: 'طوموبيل', tr: 'tomobil', nl: 'auto' }, echo: 'Tomobil! Tomobil!',
      tekst: ['Op de weg naar buiten passeren ze een oude auto.', 'Er staan drie tassen en een matras op het dak.', 'De hele familie zit erin, en nog iemand erbij.', '“Tomobil,” lacht Sba. “Daar past alles in.”'] },
    { scene: 'weide', woord: { id: 'bshklit', ar: 'بشكليط', tr: 'bshklit', nl: 'fiets' }, echo: 'Bshklit! Bshklit!',
      tekst: ['Een jongen komt langs met brood achterop.', 'Twintig broden, in een houten bak.', 'Hij rijdt met één hand en zwaait met de andere.', '“Bshklit,” zegt Sba. “En niet één valt eraf.”'] },
    { scene: 'zonsondergang', woord: { id: 'hnaya', ar: 'هنا', tr: 'hnaya', nl: 'hier' }, echo: 'Hnaya! Hnaya!',
      tekst: ['Aan het eind van de dag staan ze weer bij de poort.', 'Niemand weet precies hoe ze er gekomen zijn.', 'Jeddti staat er al, met haar handen in haar zij.', '“Hnaya,” zegt ze. “Hier. Eindelijk.”'] },
  ] as Blad[],
}

const DEEL12 = {
  nummer: 12, waar: 'Overal, van de bergen tot de zee',
  hierna: 'Dit was deel 12. Begin gerust weer bij deel 1 — je hoort nu meer.',
  titel: 'Sba en mijn land', ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar', opdracht: 'Voor ieder kind dat twee landen heeft en niet hoeft te kiezen.',
  bladen: [
    { scene: 'atlas', woord: { id: 'mghrib', ar: 'المغرب', tr: 'lmghrib', nl: 'Marokko' }, echo: 'Mghrib! Mghrib!',
      tekst: ['Op het dak ligt een grote kaart.', 'Er staan bergen op, een woestijn en twee zeeën.', 'Hij lijkt op een hoofd dat naar links kijkt.', '“Lmghrib,” zegt Sba. “Dit is het allemaal.”'] },
    { scene: 'stadje', woord: { id: 'casablanca', ar: 'الدار البيضاء', tr: 'Casablanca', nl: 'Casablanca' }, echo: 'Casablanca!',
      tekst: ['Hier is het het drukst.', 'Auto’s, kantoren, en een moskee die in zee staat.', 'Het heet het witte huis, in het Arabisch.', '“Casablanca,” zegt Sba, en hij wijst.'] },
    { scene: 'plein', woord: { id: 'marrakech', ar: 'مراكش', tr: 'Marrakech', nl: 'Marrakech' }, echo: 'Marrakech!',
      tekst: ['Hier is het rood. Alle muren.', 'Hier was jullie markt met de gnawa.', 'En het land is naar deze stad genoemd.', '“Marrakech,” zegt Sba. “Onthoud die.”'] },
    { scene: 'medina', woord: { id: 'fas', ar: 'فاس', tr: 'Fas', nl: 'Fez' }, echo: 'Fas! Fas!',
      tekst: ['Yousra wijst als eerste.', 'Daar begonnen ze, bij de blauwe poort.', 'Daar zijn de straatjes waar je in verdwaalt.', '“Fas,” zegt ze. “Daar ken ik de weg.”'] },
    { scene: 'haven', woord: { id: 'tanja', ar: 'طنجة', tr: 'Tanja', nl: 'Tanger' }, echo: 'Tanja! Tanja!',
      tekst: ['Helemaal bovenaan, waar het land ophoudt.', 'Op een heldere dag zie je de overkant liggen.', 'Dat is Europa, veertien kilometer verderop.', '“Tanja,” zegt Sba. “Zo dichtbij.”'] },
    { scene: 'strand', woord: { id: 'agadir', ar: 'أݣادير', tr: 'Agadir', nl: 'Agadir' }, echo: 'Agadir!',
      tekst: ['Hier is het strand lang en recht.', 'Hier schijnt de zon bijna elke dag.', 'Adam wil er meteen heen.', '“Agadir,” zegt Sba. “Volgend jaar.”'] },
    { scene: 'plein', woord: { id: 'rabat', ar: 'الرباط', tr: 'Rabat', nl: 'Rabat' }, echo: 'Rabat! Rabat!',
      tekst: ['Hier staat een toren die nooit af is gekomen.', 'Hij wacht al achthonderd jaar op zijn dak.', 'Naast de rivier, met de zee erachter.', '“Rabat,” zegt Sba. “De hoofdstad.”'] },
    { scene: 'woestijn', woord: { id: 'sahra', ar: 'الصحراء', tr: 'ssahra', nl: 'de woestijn' }, echo: 'Sahra! Sahra!',
      tekst: ['Onderaan de kaart is alles geel.', 'Daar zijn geen straten meer, alleen zand.', '’s Nachts is het er kouder dan in de bergen.', '“Ssahra,” zegt Sba. “Daar kun je alle sterren zien.”'] },
    { scene: 'keuken', woord: { id: 'ramadan', ar: 'رمضان', tr: 'ramadan', nl: 'ramadan' }, echo: 'Ramadan! Ramadan!',
      tekst: ['“En wanneer is het hier het mooist?”', 'Jeddti denkt na. “Als het donker wordt,” zegt ze.', '“En de hele straat tegelijk gaat eten.”', '“Ramadan,” zegt ze. “Dan is niemand alleen.”'] },
    { scene: 'tafel', woord: { id: 'darija', ar: 'الدارجة', tr: 'ddarija', nl: 'Darija' }, echo: 'Darija! Darija!',
      tekst: ['“Wat we nu praten,” vraagt Rayan, “hoe heet dat?”', 'Sba moet lachen. Dat had hij nooit verteld.', 'Al twaalf boeken lang niet.', '“Ddarija,” zegt hij. “Zo heet het.”'] },
    { scene: 'stah', woord: { id: 'bladi', ar: 'بلادي', tr: 'bladi', nl: 'mijn land' }, echo: 'Bladi! Bladi!',
      tekst: ['“Is dit mijn land?” vraagt Yousra.', '“Of is het dat andere, waar mijn school staat?”', 'Sba kijkt naar de kaart en dan naar haar.', '“Bladi,” zegt hij. “Je mag er twee hebben.”'] },
    { scene: 'nacht', woord: { id: 'inshallah', ar: 'إن شاء الله', tr: 'inshallah', nl: 'als het lukt' }, echo: 'Inshallah! Inshallah!',
      tekst: ['De koffers staan in de gang.', 'Morgen gaat het vliegtuig.', '“Komen we terug?” vraagt Rayan, voor de laatste keer.', '“Inshallah,” zegt jeddti. En Sba knikt.'] },
  ] as Blad[],
}

/** De eerste verhaallijn: twaalf delen, honderdvierenveertig woorden, één leeuw. */
export const DELEN: Deel[] = [DEEL1, DEEL2, DEEL3, DEEL4, DEEL5, DEEL6, DEEL7, DEEL8, DEEL9, DEEL10, DEEL11, DEEL12]
export { DEEL1 }
