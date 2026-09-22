/**
 * De sleutels van Marokko — vijftien delen, tweeduizend jaar, één sleutel.
 *
 * Dit bestand is het geraamte: wie er in elk deel leeft, wanneer, wat er
 * werkelijk gebeurd is, en hoe de sleutel van hand tot hand gaat. De
 * hoofdstukken zelf staan eronder, deel voor deel — het is een reeks van
 * ongeveer tweehonderdduizend woorden en die schrijf je niet in één zitting
 * zonder dat het vlak wordt.
 *
 * De afspraak met de lezer staat in `DISCLAIMER` en wordt achterin elk deel
 * afgedrukt: de gebeurtenissen zijn echt, de mensen op de voorgrond niet, en
 * waar er iets verzonnen is staat dat er met zoveel woorden bij. Een kind van
 * elf wil weten wat waar was — dat is het beste deel van het boek en niet de
 * kleine lettertjes.
 */

export interface Hoofdstuk {
  nummer: number
  titel: string
  /** De tekst, alinea voor alinea. Lege reeks = nog te schrijven. */
  tekst: string[]
}

export interface Sleuteldeel {
  nummer: number
  titel: string
  jaar: string
  /** Waar het speelt, in één regel voor op de achterkant. */
  waar: string
  /** Wie het vertelt: naam, leeftijd, en wat hij te verliezen heeft. */
  verteller: string
  /** Waar het boek over gaat, voor de achterkant. */
  flap: string
  /** Wat er werkelijk gebeurd is — de bladzijden achterin. */
  echt: string[]
  /** Wat verzonnen is, en dat staat er eerlijk bij. */
  verzonnen: string[]
  /** Hoe de sleutel in dit deel binnenkomt en weer verdwijnt. */
  sleutel: string
  hoofdstukken: Hoofdstuk[]
}

export const DISCLAIMER = [
  'Dit boek is verzonnen, maar niet zomaar.',
  'De gebeurtenissen erin zijn echt gebeurd: de steden, de veldslagen, de reizen, de boeken en de mensen die geschiedenis hebben gemaakt. Wat daarover bekend is, is nagekeken en niet mooier gemaakt dan het was.',
  'De jongens en meisjes die het verhaal vertellen zijn verzonnen. Zij liepen er niet echt rond, en de sleutel die van hand tot hand gaat heeft nooit bestaan. Dat moest, want van gewone kinderen uit die tijd weten we bijna niets — en juist zij zijn de mensen bij wie je wilt zitten als er iets groots gebeurt.',
  'Waar het verhaal een gat in de geschiedenis opvult met fantasie, staat dat achterin bij "Wat hiervan is echt gebeurd". Lees dat stuk. Het is het spannendste van het boek, want daar zie je hoe vreemd het echte verhaal vaak nog is.',
]

/**
 * De toon van de reeks.
 *
 * Deze boeken spelen in een land waar het geloof het dagelijks leven ordent,
 * en dat hoort erin — niet als les, maar zoals het is: de oproep die de dag
 * indeelt, de moskee als het hart van de stad, de vrijdag, de maand van het
 * vasten, de reis naar Mekka waarmee deel 6 begint. Wie de geschiedenis van
 * Marokko vertelt zonder dat, vertelt een ander land.
 *
 * De regels waar de schrijver zich aan houdt:
 *
 * - **Geen verzonnen heilige tekst.** Er wordt geen vers en geen overlevering
 *   geciteerd die niet bestaat, en liever helemaal niet geciteerd. Wat mensen
 *   geloven laat je zien aan wat ze doen, niet aan wat je ze laat opzeggen.
 * - **Het geloof is achtergrond, geen preek.** Een kind dat bidt voordat het
 *   iets moeilijks doet, een moeder die "inshallah" zegt en het meent, een
 *   smid die met bismillah begint aan zijn werk. Dat is genoeg.
 * - **Kennis is de rode draad.** Van de al-Qarawiyyin in deel 3 tot de kaart
 *   van al-Idrisi, de reis van Ibn Battuta en de bibliotheken van Fes: het
 *   zoeken naar kennis is in deze geschiedenis een opdracht, en zo staat het
 *   er ook in.
 * - **Gastvrijheid, geduld, dankbaarheid.** Drie dingen die in elk deel
 *   terugkomen omdat ze in elk deel werkelijk gebeurden: de vreemdeling die
 *   eten krijgt, het wachten dat beloond wordt, het danken na afloop.
 * - **Deel 1 speelt vóór de islam.** Walili is Romeins en Amazigh, rond het
 *   jaar 200. Dat is met opzet het begin: de reeks laat zien hoe het land
 *   werd wat het is, en in deel 2 komt het nieuwe geloof over zee mee.
 * - **Niemand wordt weggeschreven.** Joden, christenen en Amazigh die hun
 *   eigen gebruiken houden, horen in dit land en horen dus in deze boeken.
 */

/** De reis van de sleutel, in één oogopslag. */
export const REEKS: Omit<Sleuteldeel, 'hoofdstukken'>[] = [
  {
    nummer: 1, titel: 'De olijvenbrand', jaar: '± 200',
    waar: 'Walili (Volubilis), aan de voet van de Zerhoun',
    verteller: 'Tala, elf jaar, dochter van een oliepersbaas die ziek is geworden',
    flap: 'Tala heeft de sleutel van de opslag en de opzichter wil hem hebben. Als de olie van de hele stad in gevaar komt, moet ze kiezen tussen gehoorzamen en gelijk hebben.',
    sleutel: 'De sleutel wordt in Walili gesmeed door Tala’s grootvader en gaat aan het eind mee met een Amazigh-karavaan de heuvels in.',
    echt: [
      'Volubilis — in het Arabisch Walili — was een echte Romeinse stad bij Meknès, met duizenden inwoners, badhuizen en straten van steen.',
      'De stad leefde van olijfolie. Er zijn tientallen oliepersen opgegraven, en ze werkten volgens hetzelfde idee als de persen die in Marokko nu nog gebruikt worden.',
      'De vloeren lagen vol mozaïek. Een deel ervan ligt er nog steeds, in de open lucht.',
      'De bevolking was grotendeels Amazigh; Romeins en Amazigh leven liepen hier door elkaar heen.',
    ],
    verzonnen: [
      'Tala, haar familie en de opzichter Marcus hebben niet bestaan.',
      'De brand in het verhaal is verzonnen. Er is geen bewijs van een grote brand in Walili in deze periode.',
      'De sleutel met de achtpuntige ster is verzonnen. De achtpuntige khatam is wel een echt en eeuwenoud Marokkaans motief.',
    ],
  },
  {
    nummer: 2, titel: 'De overkant', jaar: '711',
    waar: 'Tanger, en de zeestraat naar het noorden',
    verteller: 'Ayyur, twaalf, zoon van een schapenhoeder die de paarden verzorgt',
    flap: 'Een leger steekt over naar een land dat niemand kent. Ayyur mag mee om voor de paarden te zorgen — en ontdekt dat de man die iedereen volgt zelf ook bang is.',
    sleutel: 'De sleutel hangt aan de tuigage van een paard en blijft achter aan de overkant, in de zak van een schrijver.',
    echt: [
      'Tariq ibn Ziyad was een Amazigh-legerleider die in 711 met een leger de zeestraat overstak naar het zuiden van het huidige Spanje.',
      'De rots waar hij landde draagt nog zijn naam: Jabal Tariq, de berg van Tariq — verbasterd tot Gibraltar.',
      'Het grootste deel van zijn leger bestond uit Amazigh-soldaten uit Noord-Afrika.',
      'Het verhaal dat hij zijn schepen liet verbranden, is pas eeuwen later opgeschreven en wordt door historici niet als feit beschouwd.',
    ],
    verzonnen: [
      'Ayyur en zijn familie hebben niet bestaan.',
      'De gesprekken met Tariq zijn verzonnen. Over zijn karakter is bijna niets bekend.',
      'Dat de sleutel meereisde is verzonnen.',
    ],
  },
  {
    nummer: 3, titel: 'Wat Fatima bouwde', jaar: '859',
    waar: 'Fes, aan de oever van de rivier',
    verteller: 'Hind, dertien, weesmeisje dat water draagt voor de metselaars',
    flap: 'Een vrouw geeft haar hele erfenis uit aan een gebouw waarvan niemand weet waar het goed voor is. Hind draagt het water, telt de stenen — en begrijpt als eerste wat het worden moet.',
    sleutel: 'De sleutel ligt in het fundament, en wordt er jaren later weer uitgehaald bij een verbouwing.',
    echt: [
      'Fatima al-Fihri stichtte in 859 in Fes de al-Qarawiyyin: een moskee die uitgroeide tot een plek van onderwijs.',
      'Die instelling geldt als de oudste nog werkende universiteit ter wereld en staat als zodanig in het Guinness Book of Records en bij UNESCO.',
      'Ze betaalde de bouw uit de erfenis van haar vader, een koopman uit Kairouan in het huidige Tunesië.',
      'Haar zus Maryam stichtte in dezelfde stad de al-Andalusiyyin-moskee. Die staat er ook nog.',
      'Fes bestond toen uit twee aparte steden aan weerszijden van de rivier: een wijk van mensen uit Kairouan en een wijk van mensen uit Andalusië. De twee moskeeën van de twee zussen staan elk aan één kant.',
      'Fes zelf was kort daarvoor gesticht, onder Idris I en zijn zoon Idris II.',
      'De al-Qarawiyyin is sinds 859 nooit gesloten geweest. Er is geen jaar bekend waarin er niet werd onderwezen.',
    ],
    verzonnen: [
      'Hind heeft niet bestaan. Driss de metselaar, tante Rahma en de jongen bij de kamers ook niet.',
      'Over het dagelijks leven op de bouwplaats is weinig bekend; dat is ingevuld met wat we van andere bouwwerken uit die tijd weten.',
      'De scène waarin Fatima met Hind praat is verzonnen, en die waarin ze meeschept in de modder ook.',
      'Dat Fatima gevast zou hebben zolang de bouw duurde, is een overlevering. Het staat niet vast dat het zo is gegaan, en in het boek wordt het daarom ook verteld als iets wat verteld wordt.',
      'Dat het geld halverwege opraakte en dat de stad het werk overnam, is verzonnen. Hoe de bouw precies betaald is, weten we niet.',
    ],
  },
  {
    nummer: 4, titel: 'De stad die er nog niet was', jaar: '± 1070',
    waar: 'De vlakte waar Marrakech gebouwd wordt',
    verteller: 'Isli, twaalf, kameeldrijver uit het zuiden',
    flap: 'Er wordt een stad uit de grond gestampt op een plek waar niets is. Isli brengt stenen, en hoort van de vrouw die alles bestuurt waarom juist hier.',
    sleutel: 'De sleutel gaat mee in een zadeltas en blijft achter in een muur van de eerste stadspoort.',
    echt: [
      'Marrakech werd rond 1070 gesticht door de Almoraviden, onder Yusuf ibn Tashfin.',
      'Het land is naar deze stad genoemd: Marrakech werd in Europese talen Marokko.',
      'Zaynab an-Nafzawiyya was de vrouw van Yusuf ibn Tashfin en had grote invloed op het bestuur; middeleeuwse kroniekschrijvers noemen haar uitdrukkelijk.',
      'De Almoraviden legden het ondergrondse irrigatiestelsel aan — de khettara — dat de stad van water voorzag. Delen ervan liggen er nog.',
      'Vlak bij Marrakech lag al een stad: Aghmat, tegen de bergen aan. Die werd verlaten voor de nieuwe stad op de vlakte. Aghmat wordt nu opgegraven.',
      'De stadsmuur is van gestampte aarde (tabia) en is ruim negentien kilometer lang. De grond daar is rood, en daarom is de stad rood.',
      'Marrakech lag op het kruispunt van de karavaanwegen. Uit het zuiden kwam goud uit het rijk van Ghana en het gebied van het huidige Mali; daarheen ging zout.',
    ],
    verzonnen: [
      'Isli, zijn oom, de kameel Tamghart en de graver Brahim hebben niet bestaan.',
      'De gesprekken met Zaynab zijn verzonnen; wat zij werkelijk zei is niet overgeleverd.',
      'Het instorten van de zevende put is verzonnen. Dat het gevaarlijk werk was, is dat niet: bij het graven van khettara’s zijn door de eeuwen heen veel mensen omgekomen.',
      'Hoe de eerste markt is ontstaan weten we niet. Dat steden zo beginnen, weten we wel.',
    ],
  },
  {
    nummer: 5, titel: 'De wereld op één vel', jaar: '1154',
    waar: 'Ceuta, en het hof van koning Roger op Sicilië',
    verteller: 'Sanaa, veertien, dochter van een kaartenmaker',
    flap: 'Een geleerde uit Ceuta tekent een kaart van de hele wereld voor een christelijke koning. Sanaa slijpt zijn inkt — en ontdekt dat een kaart gevaarlijker is dan een zwaard.',
    sleutel: 'De sleutel wordt gebruikt als gewicht op een perkament en gaat mee terug naar Noord-Afrika.',
    echt: [
      'Muhammad al-Idrisi werd rond 1100 in Ceuta geboren en werkte aan het hof van koning Roger II van Sicilië.',
      'In 1154 voltooide hij de Tabula Rogeriana: een wereldkaart met een uitgebreid geografisch boek erbij.',
      'Zijn kaart was eeuwenlang de nauwkeurigste van de bekende wereld, en werd in Europa tot ver in de zestiende eeuw gebruikt.',
      'Op de kaart staat het zuiden boven — zo werden kaarten in de islamitische wereld toen getekend.',
      'De kaart bestaat uit zeventig bladen: zeven klimaatzones van zuid naar noord, elk in tien stukken van west naar oost.',
      'Al-Idrisi werkte door reizigers te ondervragen en hun antwoorden met elkaar te vergelijken. Wat maar door één man werd gezegd, nam hij niet over.',
      'Er is ook een zilveren versie gemaakt, van honderden ponden. Die is na de dood van Roger II verdwenen en vrijwel zeker omgesmolten.',
      'Op Sicilië werd onder Roger II in drie talen bestuurd: Arabisch, Grieks en Latijn. Zijn munten dragen Arabisch en Latijn.',
      'Het boek bij de kaart heet Nuzhat al-mushtaq: het genoegen van wie ernaar verlangt de horizon over te steken.',
    ],
    verzonnen: [
      'Sanaa en haar vader hebben niet bestaan.',
      'De intriges aan het hof in het verhaal zijn verzonnen, al was het hof van Roger II werkelijk een plek waar moslims, christenen en joden samenwerkten.',
      'De kapitein die de bocht in de kust tegenspreekt is verzonnen. Dat al-Idrisi oudere kaarten verbeterde met wat varenslui hem vertelden, is dat niet.',
      'Dat al-Idrisi door geloofsgenoten verweten werd dat hij voor een christelijke koning werkte, is overgeleverd; de gesprekken erover in dit boek zijn verzonnen.',
    ],
  },
  {
    nummer: 6, titel: 'Dertig jaar onderweg', jaar: '1325 – 1354',
    waar: 'Van Tanger naar Mekka, India, China en terug',
    verteller: 'Musa, dertien, schrijversleerling die meereist als hulpje',
    flap: 'Een jongeman uit Tanger vertrekt voor de bedevaart en komt dertig jaar later terug. Musa houdt bij wat hij ziet — en merkt dat zijn meester niet alles vertelt zoals het was.',
    sleutel: 'De sleutel reist de halve wereld rond in een reiskist en komt met Ibn Battuta mee terug naar Fes.',
    echt: [
      'Ibn Battuta vertrok in 1325 op eenentwintigjarige leeftijd uit Tanger voor de bedevaart naar Mekka.',
      'Hij reisde bijna dertig jaar en legde naar schatting meer dan honderdtwintigduizend kilometer af — veel meer dan Marco Polo.',
      'Hij bezocht onder andere Egypte, Perzië, India, de Malediven, mogelijk China, en het rijk van Mali.',
      'Terug in Marokko dicteerde hij zijn verhaal aan de schrijver Ibn Juzayy; dat boek heet de Rihla.',
      'Sommige delen van de Rihla zijn waarschijnlijk overgeschreven uit andere reisverslagen; daar wordt al eeuwen over gediscussieerd. Vooral over China zijn geleerden het oneens.',
      'In Delhi was hij acht jaar rechter onder sultan Muhammad ibn Tughluq, die even vrijgevig als gevaarlijk was. Ibn Battuta raakte in ongenade en trok zich terug bij een asceet buiten de stad.',
      'Daarna werd hij als gezant naar China gestuurd. Dat gezantschap is onderweg overvallen en de vloot is bij de kust van India vergaan.',
      'Op de Malediven werd hij opnieuw rechter en trouwde hij in de heersende familie.',
      'In 1348 reisde hij door Damascus tijdens de Zwarte Dood. Zijn beschrijving is een van de weinige ooggetuigenverslagen die we van de pest in het Midden-Oosten hebben, met de gezamenlijke processie van moslims, christenen en joden buiten de stadsmuren.',
      'Zijn moeder stierf kort voor zijn thuiskomst aan diezelfde pest.',
      'De vuurtoren van Alexandrië, een van de zeven wereldwonderen, stond bij zijn eerste bezoek nog half overeind en was bij zijn tweede bezoek door aardbevingen ingestort.',
    ],
    verzonnen: [
      'Musa heeft niet bestaan. De echte schrijver was Ibn Juzayy, en die was geen kind.',
      'De vijf kisten, de kist die overboord slaat en de aantekeningen die Musa uit zijn hoofd overschrijft zijn verzonnen.',
      'De volgorde van sommige reizen is vereenvoudigd, omdat de Rihla zelf op punten niet klopt.',
      'De gesprekken zijn verzonnen, ook dat over China — maar de twijfel erin is echt en wordt door geleerden gedeeld.',
    ],
  },
  {
    nummer: 7, titel: 'De jongen die twee namen kreeg', jaar: '± 1520',
    waar: 'Fes, de Middellandse Zee, en Rome',
    verteller: 'Hassan, vijftien, diplomatenzoon uit Fes',
    flap: 'Een jonge diplomaat uit Fes wordt op zee gevangen en aan de paus gegeven. Hij krijgt een nieuwe naam, een nieuw geloof en een nieuwe taal — en schrijft het boek waardoor Europa Afrika leerde kennen.',
    sleutel: 'De sleutel wordt in Rome verstopt in de band van een boek en komt jaren later met dat boek terug in Tunis.',
    echt: [
      'Al-Hassan ibn Muhammad al-Wazzan werd rond 1494 in Granada geboren en groeide op in Fes.',
      'Hij reisde als gezant door Noord-Afrika en werd rond 1518 door piraten gevangen en aan paus Leo X geschonken.',
      'Hij werd gedoopt als Johannes Leo de Medici en staat bekend als Leo Africanus.',
      'Zijn boek "Beschrijving van Afrika" (1526) was eeuwenlang de belangrijkste bron over Noord-Afrika in Europa.',
      'Als jongen werkte hij twee jaar als schrijver in de maristan van Fes, het gasthuis waar ook geesteszieken werden verpleegd.',
      'Hij reisde met de karavaan naar Timboektoe en beschreef onderweg Taghaza, de zoutmijn in de Sahara waar de huizen van zoutplaten zijn gebouwd.',
      'Over Timboektoe schreef hij dat er meer aan boeken werd verdiend dan aan welke andere koopwaar ook. Eeuwenlang geloofde Europa dat niet; sinds de jaren tachtig zijn er honderdduizenden handschriften uit de stad en omgeving boven water gekomen.',
      'Hij werd op 6 januari 1520 gedoopt in de Sint-Pieter, met paus Leo X als peetvader.',
      'In Italië gaf hij Arabisch en werkte hij met de Joodse arts Jacob Mantino — ook uit Spanje verdreven — aan een woordenboek Arabisch-Hebreeuws-Latijn. Het is nooit afgemaakt.',
      'Hij schreef zijn boek in het Italiaans, een taal die hij pas een paar jaar kende. In het oudste handschrift zijn zijn eigen, niet-Italiaanse zinswendingen nog te zien; latere uitgevers hebben die weggepoetst.',
      'In 1527 werd Rome geplunderd door onbetaalde huurlingen. Daarna komt hij in geen enkel document meer voor.',
      'Waarschijnlijk keerde hij later terug naar Noord-Afrika; over zijn laatste jaren is weinig zeker.',
    ],
    verzonnen: [
      'De gesprekken en zijn binnenwereld zijn verzonnen. Wat hij werkelijk dacht over zijn gedwongen bekering weten we niet — hij heeft er geen enkele regel over nagelaten.',
      'De drie verklaringen voor zijn doop staan er als mogelijkheden, niet als feit. De fabel van de vogel die vis kan zijn staat wél echt in zijn boek, en hij schrijft er zelf bij dat hij die vogel is.',
      'Dat hij in de Engelenburcht fouten verbeterde in de kantlijn van aardrijkskundige boeken, is verzonnen.',
      'De sleutel in de boekband is verzonnen.',
    ],
  },
  {
    nummer: 8, titel: 'Drie koningen, één dag', jaar: '1578',
    waar: 'Bij Ksar el-Kebir, aan de rivier de Loukkos',
    verteller: 'Driss, veertien, trommelaar in het leger',
    flap: 'Op één dag sterven er drie koningen in dezelfde veldslag. Driss slaat de trom, ziet het gebeuren, en begrijpt pas later wat het land daarmee wint en verliest.',
    sleutel: 'De sleutel raakt zoek op het slagveld en wordt gevonden door een soldaat die naar Marrakech trekt.',
    echt: [
      'De Slag bij de Drie Koningen (ook: Slag bij Ksar el-Kebir) vond plaats op 4 augustus 1578.',
      'Drie koningen kwamen om: de Portugese koning Sebastiaan, de afgezette sultan Abu Abdallah Mohammed en de zittende sultan Abd al-Malik.',
      'Portugal verloor er zijn koning en raakte kort daarna zijn zelfstandigheid kwijt aan Spanje.',
      'De nieuwe sultan werd Ahmad al-Mansur, de broer van Abd al-Malik.',
    ],
    verzonnen: [
      'Driss heeft niet bestaan.',
      'Het verloop van de slag is vereenvoudigd; ooggetuigen spreken elkaar op veel punten tegen.',
      'Dit deel gaat over een veldslag en er vallen doden. Het is geschreven voor lezers vanaf elf jaar.',
    ],
  },
  {
    nummer: 9, titel: 'Het paleis van suiker', jaar: '1578 – 1603',
    waar: 'Marrakech, het Badi-paleis',
    verteller: 'Lalla, twaalf, dochter van een tegelzetter',
    flap: 'Een sultan bouwt het mooiste paleis van zijn tijd en betaalt het met suiker en goud uit de woestijn. Lalla legt de tegels — en hoort waar dat goud vandaan komt.',
    sleutel: 'De sleutel wordt ingemetseld in een muur van het paleis en komt vrij als het paleis wordt afgebroken.',
    echt: [
      'Ahmad al-Mansur liet vanaf 1578 in Marrakech het Badi-paleis bouwen. "El Badi" betekent: de onvergelijkelijke.',
      'Het werd betaald uit de suikerhandel en uit goud, onder andere na de veldtocht naar het Songhai-rijk in 1591.',
      'Er werd marmer uit Italië gebruikt, naar verluidt betaald met suiker van gelijk gewicht.',
      'Rond 1700 liet sultan Moulay Ismail het paleis afbreken om Meknès te bouwen. Wat over is, is een ruïne die je nog kunt bezoeken.',
      'De veldtocht naar Songhai bracht rijkdom naar Marokko en verwoestte tegelijk een van de grootste rijken van West-Afrika, met de stad Timboektoe.',
    ],
    verzonnen: [
      'Lalla en haar vader hebben niet bestaan.',
      'De uitspraken van al-Mansur in dit boek zijn verzonnen.',
    ],
  },
  {
    nummer: 10, titel: 'De stad aan zee', jaar: '1764',
    waar: 'Essaouira, dat nog gebouwd moet worden',
    verteller: 'Yto, dertien, dochter van een visser',
    flap: 'Een sultan laat een havenstad bouwen op een winderige plek waar niemand woont, en vraagt een Franse architect om het te tekenen. Yto ziet haar strand veranderen in een stad met rechte straten.',
    sleutel: 'De sleutel wordt gevonden in het zand en gaat mee aan boord van een schip naar Amerika.',
    echt: [
      'Sultan Mohammed ben Abdallah liet vanaf 1764 de havenstad Essaouira (Mogador) aanleggen.',
      'Het ontwerp met de rechte straten en de vestingwerken werd gemaakt met hulp van Europese ingenieurs, onder wie de Fransman Théodore Cornut.',
      'De stad werd opengesteld voor handel met Europa en kende een grote joodse gemeenschap die een sleutelrol speelde in die handel.',
      'De naam Essaouira wordt meestal uitgelegd als "de kleine muur" of "de goed getekende".',
    ],
    verzonnen: [
      'Yto en haar familie hebben niet bestaan.',
      'De ontmoeting met de architect is verzonnen.',
    ],
  },
  {
    nummer: 11, titel: 'Het eerste land dat ja zei', jaar: '1777',
    waar: 'Tanger, Salé, en een schip naar de overkant',
    verteller: 'Brahim, veertien, hulpje van een havenschrijver',
    flap: 'Een jong land aan de andere kant van de oceaan vraagt om erkenning, en Marokko is het eerste dat antwoordt. Brahim schrijft de brieven over — en begrijpt dat een handtekening soms zwaarder weegt dan een leger.',
    sleutel: 'De sleutel ligt in een kist met documenten en blijft achter in het consulaat in Tanger.',
    echt: [
      'In 1777 verklaarde sultan Mohammed ben Abdallah dat Amerikaanse schepen vrij gebruik mochten maken van Marokkaanse havens.',
      'Marokko wordt daarmee gezien als een van de eerste landen die de Verenigde Staten erkende.',
      'In 1786 volgde het Marokkaans-Amerikaanse vriendschapsverdrag, dat nog altijd geldt: het is het oudste ononderbroken verdrag van de Verenigde Staten.',
      'Het Amerikaanse consulaat in Tanger, geschonken door de sultan, is het oudste Amerikaanse overheidsgebouw buiten de Verenigde Staten.',
    ],
    verzonnen: [
      'Brahim heeft niet bestaan.',
      'De inhoud van de gesprekken over het verdrag is verzonnen.',
    ],
  },
  {
    nummer: 12, titel: 'De berg die niet meeging', jaar: '1921 – 1926',
    waar: 'Het Rifgebergte',
    verteller: 'Itto, vijftien, dochter van een dorpsonderwijzer',
    flap: 'In de bergen van het Rif verzet een gemeenschap zich tegen twee grote legers tegelijk. Itto brengt boodschappen tussen de dorpen — en leert wat er gebeurt met een verhaal als de winnaars het opschrijven.',
    sleutel: 'De sleutel gaat mee in een boodschappentas en wordt begraven onder een vloer als het dorp ontruimd wordt.',
    echt: [
      'Tussen 1921 en 1926 vocht de Rif-republiek onder Abd el-Krim tegen Spanje en later ook tegen Frankrijk.',
      'In 1921 leed het Spaanse leger bij Annual een zware nederlaag.',
      'Er zijn in deze oorlog chemische wapens ingezet tegen de bevolking van het Rif. Spanje heeft dat lang ontkend.',
      'Marokko stond op dat moment onder Frans en Spaans protectoraat, sinds 1912.',
    ],
    verzonnen: [
      'Itto en haar familie hebben niet bestaan.',
      'Dit deel gaat over een oorlog. Het is geschreven voor lezers vanaf twaalf jaar en houdt het geweld buiten beeld, maar het is er wel.',
    ],
  },
  {
    nummer: 13, titel: 'Het jaar dat de koning terugkwam', jaar: '1953 – 1956',
    waar: 'Rabat, Casablanca, en een eiland ver weg',
    verteller: 'Nadia, veertien, dochter van een drukker',
    flap: 'De koning wordt het land uitgezet en het volk komt in opstand. In de drukkerij van haar vader ziet Nadia hoe gevaarlijk een stapel papier kan zijn.',
    sleutel: 'De sleutel zit in een vals boek waarin pamfletten worden verstopt, en blijft achter in Casablanca.',
    echt: [
      'In 1953 werd sultan Mohammed V door de Franse autoriteiten afgezet en verbannen, eerst naar Corsica en daarna naar Madagaskar.',
      'Zijn verbanning leidde tot grote onrust en verzet in het hele land.',
      'In november 1955 keerde hij terug; op 2 maart 1956 werd Marokko onafhankelijk van Frankrijk, kort daarna gevolgd door het Spaanse deel.',
      'Het verzet werd door heel verschillende groepen gedragen: stedelijke partijen, vakbonden, en gewapende groepen op het platteland.',
    ],
    verzonnen: [
      'Nadia en haar vader hebben niet bestaan.',
      'De pamfletten in het verhaal zijn verzonnen, al bestond ondergrondse drukkerij in deze jaren wel degelijk.',
    ],
  },
  {
    nummer: 14, titel: 'Zwart op wit', jaar: '2011',
    waar: 'Rabat, en een dorp in de Hoge Atlas',
    verteller: 'Anir, twaalf, kleinzoon van een vrouw die niet kan lezen',
    flap: 'Een taal die iedereen spreekt maar niemand mag opschrijven, krijgt eindelijk een plek. Anir leert zijn oma haar eigen naam schrijven in een alfabet dat ouder is dan Rome.',
    sleutel: 'De sleutel ligt in een koperen doos in het dorp, tussen dingen die niemand meer kan thuisbrengen.',
    echt: [
      'In 2011 werd Tamazight in de Marokkaanse grondwet opgenomen als officiële taal, naast het Arabisch.',
      'Tamazight wordt geschreven in het Tifinagh-alfabet, dat teruggaat op een schrift dat al meer dan tweeduizend jaar in Noord-Afrika gebruikt wordt.',
      'Het Koninklijk Instituut voor de Amazigh-cultuur (IRCAM) werd in 2001 opgericht en stelde de huidige schrijfwijze vast.',
      'In de praktijk duurde het jaren voordat de wet werd uitgevoerd; in 2019 werd dat verder geregeld.',
    ],
    verzonnen: [
      'Anir en zijn oma hebben niet bestaan.',
      'Het dorp in het verhaal is verzonnen, maar lijkt op dorpen die er werkelijk zijn.',
    ],
  },
  {
    nummer: 15, titel: 'De doos van jeddti', jaar: 'Nu',
    waar: 'Utrecht, en een dorp in de Hoge Atlas',
    verteller: 'Adil, dertien, geboren in Nederland',
    flap: 'Adil moet mee naar Marokko en wil niet. In de kast van zijn oma vindt hij een sleutel die op geen enkele deur past — en een reis van tweeduizend jaar komt uit bij hem.',
    sleutel: 'De sleutel komt bij Adil terecht. Hij is de vijftiende en de laatste, en hij mag zelf weten wat hij ermee doet.',
    echt: [
      'De veertien delen hiervoor spelen zich af rond gebeurtenissen die werkelijk hebben plaatsgevonden.',
      'Er wonen ongeveer vijf miljoen mensen van Marokkaanse afkomst buiten Marokko, de meesten in Europa.',
      'Veel families bewaren voorwerpen uit een huis waar niemand meer woont. Sleutels van achtergelaten huizen zijn daar een bekend voorbeeld van.',
    ],
    verzonnen: [
      'Adil en zijn familie zijn verzonnen — al zal hij veel lezers bekend voorkomen.',
      'De sleutel zelf is van begin tot eind verzonnen. Hij is bedacht om tweeduizend jaar aan elkaar te knopen, en dat is precies wat een verhaal mag doen.',
    ],
  },
]
