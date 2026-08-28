import type { LegalChrome, LegalCopy } from './types.js';

/**
 * The Dutch legal texts. These are the authoritative versions: the English
 * pages are translations of them, and each English page says so.
 *
 * Written to be read by the people it applies to — a painter in Zwolle and the
 * household hiring them — rather than by a lawyer. That is a legal requirement
 * and not a style preference: Article 12(1) asks for "clear and plain
 * language", and a privacy statement nobody finishes reading informs nobody.
 */
export const CHROME_NL: LegalChrome = {
  pageNames: {
    TERMS: 'Gebruiksvoorwaarden',
    PRIVACY: 'Privacybeleid',
    DISCLAIMER: 'Disclaimer',
    COOKIES: 'Cookieverklaring',
  },
  lastUpdated: 'Laatst gewijzigd',
  incompleteTitle: 'Nog niet compleet',
  incompleteBody:
    'Buurklus is nog niet als bedrijf ingeschreven. Deze gegevens horen hier te staan en ontbreken nog. Zolang dat zo is, is dit document niet af en kun je er geen rechten aan ontlenen.',
  incompleteFields: {
    legalName: 'de naam van het bedrijf achter Buurklus',
    kvk: 'het KvK-nummer',
    vatId: 'het btw-identificatienummer',
    address: 'het vestigingsadres',
    email: 'het e-mailadres voor privacyvragen',
    dpoEmail: 'de functionaris gegevensbescherming',
  },
  backToSite: 'Terug naar Buurklus',
  otherDocuments: 'Andere documenten',
  languageNote:
    'Dit is de Nederlandse versie. Bij verschil tussen de Nederlandse en de Engelse tekst geldt de Nederlandse.',
  tables: {
    data: 'Wat',
    purpose: 'Waarvoor',
    basis: 'Grondslag',
    period: 'Hoe lang',
    reason: 'Waarom die termijn',
    right: 'Recht',
    how: 'Hoe je het gebruikt',
    processor: 'Partij',
    role: 'Wat ze voor ons doen',
    location: 'Waar',
  },
  rights: [
    {
      right: 'Inzage (art. 15)',
      how: 'In de app onder Privacy en gegevens → Je gegevens downloaden. Je krijgt meteen een bestand met alles wat we van je hebben.',
    },
    {
      right: 'Overdraagbaarheid (art. 20)',
      how: 'Datzelfde bestand is JSON: leesbaar voor een mens en bruikbaar voor een ander systeem.',
    },
    {
      right: 'Rectificatie (art. 16)',
      how: 'Je naam, e-mailadres en profiel pas je zelf aan in de app. Klopt er iets anders niet, mail ons dan.',
    },
    {
      right: 'Verwijdering (art. 17)',
      how: 'In de app onder Privacy en gegevens → Account verwijderen. Dit kan niet ongedaan gemaakt worden.',
    },
    {
      right: 'Beperking (art. 18)',
      how: 'Denk je dat we gegevens ten onrechte verwerken, mail ons dan. We zetten de verwerking stil terwijl we het uitzoeken.',
    },
    {
      right: 'Bezwaar (art. 21)',
      how: 'Tegen verwerking op grond van gerechtvaardigd belang, bijvoorbeeld fraudebestrijding, kun je bezwaar maken per e-mail.',
    },
    {
      right: 'Toestemming intrekken (art. 7 lid 3)',
      how: 'Alleen relevant voor commerciële berichten. Eén schakelaar in de app, en je account blijft gewoon werken.',
    },
  ],
  processors: [
    {
      processor: 'Sms-provider',
      role: 'Verstuurt de inlogcode naar je telefoon. Krijgt je nummer en de code, niets anders.',
      location: 'EU (nog te contracteren)',
    },
    {
      processor: 'Hostingpartij',
      role: 'Draait de servers en de database waarop Buurklus staat.',
      location: 'EU (nog te contracteren)',
    },
    {
      processor: 'Betaaldienstverlener',
      role: 'Verwerkt abonnementsbetalingen. Nu niet actief: Buurklus is gratis en er wordt niets afgeschreven.',
      location: 'EU (nog te contracteren)',
    },
    {
      processor: 'Pushberichten (Apple, Google)',
      role: 'Bezorgt meldingen op je telefoon. Krijgt een apparaat-token en de tekst van de melding.',
      location: 'VS, op basis van de EU-modelcontractbepalingen',
    },
  ],
  dataCategories: [
    {
      data: 'Je mobiele nummer',
      purpose: 'Inloggen en je account herkennen. Je logt in met een code per sms, zonder wachtwoord.',
      basis: 'Uitvoering van de overeenkomst (art. 6 lid 1 sub b)',
    },
    {
      data: 'Je naam en e-mailadres',
      purpose: 'Je herkenbaar maken voor de vakman die je uitnodigt, en je bereiken over een klus.',
      basis: 'Uitvoering van de overeenkomst',
    },
    {
      data: 'De klus die je plaatst: omschrijving, foto’s, gemeente, adres, budget',
      purpose:
        'Vakmensen laten zien waar het over gaat zodat ze een offerte kunnen maken. Je straatadres delen we pas met de vakman aan wie je de klus gunt.',
      basis: 'Uitvoering van de overeenkomst',
    },
    {
      data: 'Offertes en berichten',
      purpose: 'Het gesprek tussen jou en de vakman mogelijk maken en bewaren zolang de klus loopt.',
      basis: 'Uitvoering van de overeenkomst',
    },
    {
      data: 'Beoordelingen die je schrijft',
      purpose: 'Andere klanten laten zien wat eerdere klanten van een vakman vonden.',
      basis: 'Uitvoering van de overeenkomst',
    },
    {
      data: 'Bedrijfsgegevens van vakmensen: KvK-nummer, btw-id, IBAN',
      purpose:
        'Controleren dat een vakman echt staat ingeschreven, en — als er ooit betaald wordt — factureren.',
      basis: 'Uitvoering van de overeenkomst en wettelijke verplichting (art. 6 lid 1 sub c)',
    },
    {
      data: 'Wanneer en vanaf welk IP-adres je akkoord ging met de voorwaarden',
      purpose: 'Kunnen aantonen wélke tekst je hebt geaccepteerd en wanneer.',
      basis: 'Wettelijke verplichting (art. 7 lid 1) en gerechtvaardigd belang',
    },
    {
      data: 'Inlogcodes, sessies en apparaat-tokens',
      purpose: 'Je veilig ingelogd houden en meldingen bezorgen.',
      basis: 'Uitvoering van de overeenkomst',
    },
    {
      data: 'Facturen en betaalgegevens',
      purpose: 'Boekhouding en de fiscale bewaarplicht.',
      basis: 'Wettelijke verplichting (art. 52 AWR)',
    },
    {
      data: 'Toestemming voor commerciële e-mail',
      purpose: 'Je af en toe iets sturen over Buurklus, als je daarom hebt gevraagd.',
      basis: 'Toestemming (art. 6 lid 1 sub a)',
    },
    {
      data: 'Je aanmelding op de wachtlijst: e-mailadres, gemeente, en bij een bedrijf ook vakgebieden en KvK-nummer',
      purpose:
        'Je laten weten wanneer Buurklus in jouw gemeente opengaat, en vooraf kunnen zien of daar genoeg vakmensen én klanten zijn.',
      basis: 'Toestemming (art. 6 lid 1 sub a)',
    },
  ],
};

export const LEGAL_NL: LegalCopy = {
  PRIVACY: {
    title: 'Privacybeleid',
    metaDescription:
      'Wat Buurklus van je verwerkt, waarom, hoe lang we het bewaren en wat je ermee kunt.',
    intro:
      'Buurklus brengt klanten en vakmensen bij elkaar. Daarvoor hebben we gegevens van je nodig — niet meer dan dat. Hieronder staat precies wat we verwerken, waarom, hoe lang, en wat je eraan kunt doen.',
    sections: [
      {
        heading: 'Wie is verantwoordelijk',
        paragraphs: [
          'De verwerkingsverantwoordelijke is de partij die bepaalt wat er met je gegevens gebeurt. Voor Buurklus is dat:',
        ],
        generated: 'operator',
      },
      {
        heading: 'Wat we verwerken en waarom',
        paragraphs: [
          'Elke regel hieronder noemt ook de grondslag: de reden dat we die gegevens mógen verwerken. Voor bijna alles is dat “uitvoering van de overeenkomst”: zonder je telefoonnummer kunnen we je niet inloggen, en zonder je klusomschrijving kan niemand een offerte maken.',
          'Toestemming staat er maar één keer bij, en dat is geen toeval. Toestemming moet je vrij kunnen weigeren en altijd kunnen intrekken. Dat kan bij commerciële e-mail, en niet bij je telefoonnummer — daarom noemen we dat laatste ook geen toestemming.',
        ],
        generated: 'dataCategories',
      },
      {
        heading: 'Wat we niet doen',
        list: [
          'We verkopen je gegevens niet. Aan niemand, ook niet geanonimiseerd als “marktonderzoek”.',
          'We plaatsen geen advertentie- of trackingcookies en gebruiken geen analytics die je over websites heen volgt.',
          'We laden geen lettertypen, kaarten of scripts van servers van derden. De website haalt alles van onze eigen domeinen, zodat je browser geen contact legt met partijen waar je niet om hebt gevraagd.',
          'We nemen geen besluiten over jou die uitsluitend geautomatiseerd tot stand komen en gevolgen voor je hebben.',
        ],
      },
      {
        heading: 'Met wie we gegevens delen',
        paragraphs: [
          'Twee soorten. Ten eerste andere gebruikers: een vakman die jouw klus in zijn gebied ziet, krijgt je omschrijving, je gemeente en je wijk. Je straatadres en je telefoonnummer krijgt hij pas als jij hem de klus gunt. Andersom zie jij van een vakman zijn bedrijfsnaam, KvK-controle en beoordelingen.',
          'Ten tweede verwerkers: partijen die iets voor ons uitvoeren en niets voor zichzelf met je gegevens mogen doen. Met elk van hen sluiten we een verwerkersovereenkomst.',
        ],
        generated: 'processors',
      },
      {
        heading: 'Doorgifte buiten de Europese Economische Ruimte',
        paragraphs: [
          'De servers van Buurklus staan in de EU. Eén onderdeel valt daarbuiten: pushberichten lopen via Apple en Google, die in de Verenigde Staten zitten. Daarvoor gelden de modelcontractbepalingen van de Europese Commissie. Wil je dat vermijden, zet dan pushberichten uit; de app blijft verder gewoon werken.',
        ],
      },
      {
        heading: 'Hoe lang we gegevens bewaren',
        paragraphs: [
          'Elke termijn hieronder wordt daadwerkelijk uitgevoerd door een opruimtaak die elke nacht draait. De lijst komt uit dezelfde plek in de code als die taak, zodat deze pagina niets kan beloven wat niet gebeurt.',
        ],
        generated: 'retention',
      },
      {
        heading: 'Je rechten',
        paragraphs: [
          'Je hebt de rechten hieronder, en je hoeft daar geen reden voor te geven. Wat in de app kan, kan meteen; voor de rest reageren we binnen 30 dagen.',
        ],
        generated: 'rights',
      },
      {
        heading: 'Wat er gebeurt als je je account verwijdert',
        paragraphs: [
          'Je naam, telefoonnummer, e-mailadres, adres, foto’s en berichtteksten worden gewist. Je account blijft als lege huls bestaan, want er hangen dingen aan die niet van jou alleen zijn.',
          'Je beoordelingen blijven staan, zonder je naam en zonder de tekst: het cijfer is de reputatie van de vakman en de basis waarop andere klanten kiezen. De andere kant van een gesprek is niet van jou om te wissen. En facturen moeten we zeven jaar bewaren van de Belastingdienst; die worden losgekoppeld van je account maar niet vernietigd. De AVG staat dit uitdrukkelijk toe (art. 17 lid 3).',
        ],
      },
      {
        heading: 'Beveiliging',
        paragraphs: [
          'Verkeer met de app en de website loopt over TLS. Inlogcodes en sessietokens slaan we alleen gehasht op, zodat ze bij een datalek niet bruikbaar zijn. Wachtwoorden hebben we niet, want je logt in met een code per sms. Toegang tot de database is beperkt tot wie die nodig heeft voor het draaien van de dienst.',
          'Absolute veiligheid bestaat niet. Ontdek je een kwetsbaarheid, meld die dan bij ons voordat je die met anderen deelt; we reageren en we gaan niet achter je aan.',
        ],
      },
      {
        heading: 'Leeftijd',
        paragraphs: [
          'Je moet 16 jaar of ouder zijn om een account te maken. Dat is de leeftijd die de Nederlandse uitvoeringswet hanteert voor diensten als deze. We vragen je dat te bevestigen bij het aanmaken van je account; we controleren het niet, en dat zeggen we hier liever eerlijk dan dat we doen alsof.',
          'Weet je dat een kind onder de 16 een account heeft, laat het ons weten. Dan verwijderen we het.',
        ],
      },
      {
        heading: 'Wijzigingen',
        paragraphs: [
          'Verandert dit beleid, dan krijgt het een nieuwe datum en vragen we je bij de eerstvolgende keer inloggen opnieuw akkoord. We houden bij welke versie je hebt geaccepteerd, zodat altijd duidelijk is welke tekst voor jou gold.',
        ],
      },
      {
        heading: 'Klacht indienen',
        paragraphs: [
          'Ben je het ergens niet mee eens, mail ons dan eerst — dat is meestal sneller. Kom je er met ons niet uit, dan heb je het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens. Dat recht heb je altijd, ook als je ons niet eerst hebt benaderd.',
        ],
      },
    ],
  },

  TERMS: {
    title: 'Gebruiksvoorwaarden',
    metaDescription:
      'De afspraken tussen jou en Buurklus: wat we wel en niet doen, wat het kost, en waar je aan toe bent.',
    intro:
      'Dit zijn de afspraken tussen jou en Buurklus. Ze gelden vanaf het moment dat je een account maakt. Lees ze een keer door — het is kort gehouden en het gaat over jouw geld en jouw werk.',
    sections: [
      {
        heading: 'Wie we zijn',
        generated: 'operator',
      },
      {
        heading: 'Wat Buurklus is, en vooral wat het niet is',
        paragraphs: [
          'Buurklus is een plek waar klanten hun klus beschrijven en vakmensen daarop reageren met een offerte. Wij brengen jullie bij elkaar. Daar houdt onze rol op.',
          'De overeenkomst over het werk sluit je rechtstreeks met de vakman of met de klant. Wij zijn daar geen partij bij. We voeren geen werk uit, we houden geen toezicht op de uitvoering, we bepalen geen prijzen en we innen geen geld voor het werk. Gaat er iets mis met de klus, dan is dat een zaak tussen jou en de andere partij.',
          'Dat betekent ook: wij garanderen niet dat een vakman goed werk levert, op tijd komt of verzekerd is. Wat we wél doen is controleren dat een vakman een KvK-nummer heeft opgegeven, en beoordelingen van eerdere klanten laten zien. Dat is informatie om je keuze op te baseren, geen keurmerk van ons.',
        ],
      },
      {
        heading: 'Je account',
        list: [
          'Je moet 16 jaar of ouder zijn.',
          'Eén account per persoon of bedrijf. Je account is van jou; je geeft je inlogcodes aan niemand.',
          'De gegevens die je opgeeft kloppen. Een vakman geeft het KvK-nummer op waaronder hij daadwerkelijk staat ingeschreven.',
          'Je mag je account op elk moment verwijderen, in de app, zonder opzegtermijn en zonder reden.',
        ],
      },
      {
        heading: 'Als je een klus plaatst',
        paragraphs: [
          'Beschrijf de klus zo compleet als je kunt: dat scheelt vragen en levert bruikbaardere offertes. Je straatadres en je telefoonnummer blijven verborgen voor vakmensen totdat je de klus aan iemand gunt.',
          'Een klus staat open voor maximaal zes offertes. Dat is bewust: meer offertes maken de keuze niet beter en zorgen vooral voor vakmensen die voor niets werk hebben gestoken in een reactie.',
          'Je bent nergens toe verplicht. Bevalt geen enkele offerte, dan gun je de klus niet en trek je hem in.',
        ],
      },
      {
        heading: 'Als je vakman bent',
        list: [
          'Je hebt een geldig KvK-nummer nodig. Dat geldt ook voor zzp’ers.',
          'Klussen bekijken kost niets. Pas als je een offerte verstuurt, gaat er één van je maandtegoed af.',
          'Trekt de klant de klus in vóórdat hij gegund is, dan krijg je die offerte terug. Verlies je gewoon van een concurrent, dan niet: je betaalde voor de kans, niet voor de uitkomst.',
          'Je offerte is een echt aanbod. Zet erin wat de klant kan verwachten, en houd je eraan.',
          'Je rondt de klus af met de klant, niet via ons. Je factureert de klant rechtstreeks. Wij nemen geen commissie over je omzet.',
        ],
      },
      {
        heading: 'Wat het kost',
        paragraphs: [
          'Op dit moment niets. Buurklus is gratis voor klanten en voor vakmensen. Er is geen abonnement, geen commissie, en we vragen je geen betaalgegevens.',
          'Dat blijft niet eeuwig zo — een platform dat niets kost, bestaat op een dag niet meer. Als we gaan rekenen, geldt het volgende, en daar houden we ons aan: je hoort het minstens 30 dagen van tevoren, per e-mail en in de app; er wordt nooit automatisch iets afgeschreven; en zonder dat jij uitdrukkelijk akkoord geeft blijft je account gratis, met hetzelfde maandtegoed als nu.',
          'Ga je later wél betalen, dan gelden de prijzen die op dat moment in de app staan, exclusief btw. Betaalde abonnementen zijn maandelijks opzegbaar.',
        ],
      },
      {
        heading: 'Beoordelingen',
        paragraphs: [
          'Alleen een klant die een klus heeft laten afronden kan die klus beoordelen, en maar één keer. Dat is precies waarom de beoordelingen op Buurklus iets waard zijn.',
          'Schrijf wat je vindt, ook als het niet vleiend is. We verwijderen een beoordeling niet omdat een vakman er ongelukkig mee is. We verwijderen wel beoordelingen die beledigend zijn, persoonsgegevens van anderen bevatten, of aantoonbaar over iets anders gaan dan de uitgevoerde klus. De vakman krijgt één keer publiek de gelegenheid te reageren.',
        ],
      },
      {
        heading: 'Wat niet mag',
        list: [
          'Nepklussen plaatsen, of klussen plaatsen namens iemand anders zonder dat die dat weet.',
          'Je voordoen als een ander bedrijf, of een KvK-nummer gebruiken dat niet van jou is.',
          'Beoordelingen kopen, verkopen, ruilen of zelf schrijven.',
          'Andere gebruikers benaderen voor iets anders dan de klus waarvoor jullie contact hebben.',
          'De dienst geautomatiseerd uitlezen, overbelasten of proberen binnen te dringen.',
          'Discriminerende, bedreigende of anderszins onrechtmatige inhoud plaatsen.',
        ],
        paragraphs: [
          'Doe je een van deze dingen, dan kunnen we je account blokkeren of verwijderen. Bij iets ernstigs doen we aangifte.',
        ],
      },
      {
        heading: 'Aansprakelijkheid',
        paragraphs: [
          'We doen ons best om Buurklus te laten werken, maar we beloven geen ononderbroken beschikbaarheid en geen foutloze werking. Onderhoud, storingen en fouten horen erbij.',
          'Wij zijn niet aansprakelijk voor schade die voortkomt uit het werk zelf, uit de afspraken die jij met de andere partij maakt, of uit het handelen van andere gebruikers. Dat is de kern van wat hierboven staat: wij zijn geen partij bij die overeenkomst.',
          'Voor zover wij wel aansprakelijk zouden zijn, is die aansprakelijkheid beperkt tot het bedrag dat je in de twaalf maanden daarvoor aan Buurklus hebt betaald. Zolang Buurklus gratis is, is dat nul. Deze beperking geldt niet bij opzet of bewuste roekeloosheid van onze kant, en niet waar de wet haar niet toestaat — bijvoorbeeld bij dood of lichamelijk letsel.',
          'Ben je consument, dan doen deze voorwaarden niets af aan je dwingende wettelijke rechten.',
        ],
      },
      {
        heading: 'Beëindigen',
        paragraphs: [
          'Je kunt op elk moment stoppen door je account te verwijderen. Wij kunnen een account beëindigen als je deze voorwaarden overtreedt, of als we met Buurklus stoppen. In dat laatste geval laten we het minstens 30 dagen van tevoren weten, zodat je je gegevens kunt downloaden en lopende klussen kunt afronden.',
        ],
      },
      {
        heading: 'Klachten en geschillen',
        paragraphs: [
          'Heb je een klacht over Buurklus zelf, mail ons dan. We reageren binnen 30 dagen inhoudelijk.',
          'Komen we er niet uit, dan kun je naar de Nederlandse rechter. Op deze voorwaarden is Nederlands recht van toepassing. Ben je consument, dan mag je ook naar de rechter in het land waar je woont, en kun je gebruikmaken van het Europese ODR-platform.',
        ],
      },
      {
        heading: 'Wijzigingen',
        paragraphs: [
          'We kunnen deze voorwaarden aanpassen. De gewijzigde versie krijgt een nieuwe datum en we vragen je opnieuw akkoord bij de eerstvolgende keer dat je inlogt. Ga je niet akkoord, dan kun je je account verwijderen; de oude voorwaarden blijven gelden voor wat er daarvoor gebeurd is.',
        ],
      },
    ],
  },

  DISCLAIMER: {
    title: 'Disclaimer',
    metaDescription:
      'Waar Buurklus wel en niet voor instaat: de rol van het platform, de informatie op de site en de prijzen.',
    intro:
      'Kort samengevat waar Buurklus wel en niet voor instaat. Dit hoort bij de gebruiksvoorwaarden en vervangt die niet.',
    sections: [
      {
        heading: 'Wij zijn niet de uitvoerder',
        paragraphs: [
          'Buurklus voert geen klussen uit en is geen partij bij de overeenkomst tussen een klant en een vakman. De afspraken over prijs, planning, uitvoering, garantie en betaling maak je onderling.',
        ],
      },
      {
        heading: 'Wat de KvK-controle wel en niet betekent',
        paragraphs: [
          'Een vakman geeft bij aanmelding een KvK-nummer op. Dat zegt dat het bedrijf bestaat en staat ingeschreven. Het zegt niets over vakbekwaamheid, verzekering, financiële gezondheid of hoe het werk uitpakt. Vraag bij grotere klussen zelf om referenties, een verzekeringsbewijs en een schriftelijke opdrachtbevestiging.',
        ],
      },
      {
        heading: 'Prijzen op deze site zijn indicaties',
        paragraphs: [
          'De richtprijzen per vakgebied zijn bedoeld om je een idee te geven van de orde van grootte, zodat je een offerte kunt plaatsen. Het zijn geen offertes en er kunnen geen rechten aan worden ontleend. Wat een klus kost, staat pas in de offerte van de vakman.',
        ],
      },
      {
        heading: 'Beoordelingen zijn meningen van klanten',
        paragraphs: [
          'Beoordelingen komen van klanten die de klus daadwerkelijk hebben laten afronden. Het zijn hun ervaringen en hun woorden, geen oordeel van Buurklus. We controleren wie er mag beoordelen, niet of iemand gelijk heeft.',
        ],
      },
      {
        heading: 'Informatie en beschikbaarheid',
        paragraphs: [
          'We doen ons best de informatie op deze site kloppend en actueel te houden, maar we kunnen niet garanderen dat alles op elk moment volledig en juist is. Aan kennelijke fouten kun je geen rechten ontlenen.',
          'Buurklus kan tijdelijk niet bereikbaar zijn door onderhoud of een storing. We streven naar zo min mogelijk onderbreking, maar beloven geen ononderbroken beschikbaarheid.',
        ],
      },
      {
        heading: 'Links naar andere sites',
        paragraphs: [
          'Staat er een link naar een website van iemand anders, dan is die site niet van ons en zijn wij niet verantwoordelijk voor de inhoud of het privacybeleid ervan.',
        ],
      },
    ],
  },

  COOKIES: {
    title: 'Cookieverklaring',
    metaDescription:
      'Buurklus plaatst geen trackingcookies. Wat er wél op je apparaat wordt opgeslagen, en waarom.',
    intro:
      'Deze pagina is korter dan je gewend bent, omdat er weinig te melden valt: Buurklus zet geen trackingcookies en meet je gedrag niet.',
    sections: [
      {
        heading: 'Geen cookiebanner, en waarom niet',
        paragraphs: [
          'Toestemming is nodig voor cookies en vergelijkbare technieken die niet strikt noodzakelijk zijn: advertentiecookies, analytics die je herkent, sociale plug-ins. Die gebruiken we geen van alle. Wat overblijft is techniek die nodig is om je ingelogd te houden, en daarvoor is geen toestemming vereist (art. 11.7a lid 3 Telecommunicatiewet).',
          'Een banner die om toestemming vraagt voor iets waar geen toestemming voor nodig is, is geen extra zorgvuldigheid maar ruis. Daarom staat hij er niet.',
        ],
      },
      {
        heading: 'Wat er wel op je apparaat staat',
        list: [
          'In de app: je sessietokens, in de beveiligde opslag van je telefoon (Keychain op iOS, Keystore op Android). Daarmee blijf je ingelogd zonder telkens een sms-code.',
          'In de browserversie van de app: dezelfde tokens, in localStorage. Dat is minder goed beveiligd dan de beveiligde opslag op een telefoon, en daarom raden we de app aan als je hem hebt.',
          'Je taalkeuze, zodat de site niet elke keer opnieuw in het Nederlands begint als je Engels wilt.',
        ],
        paragraphs: [
          'Verder niets. Log je uit of verwijder je je account, dan wordt dit alles gewist.',
        ],
      },
      {
        heading: 'Geen externe scripts of lettertypen',
        paragraphs: [
          'De website laadt lettertypen, afbeeldingen en scripts uitsluitend van onze eigen domeinen. Er gaat dus geen verzoek naar Google Fonts, een advertentienetwerk of een analyticspartij op het moment dat je deze pagina opent. Dat is bewust: zo’n verzoek geeft je IP-adres door aan een partij waar je niets mee te maken hebt, voordat je iets hebt kunnen kiezen.',
        ],
      },
      {
        heading: 'Als dit verandert',
        paragraphs: [
          'Gaan we ooit iets meten waarvoor toestemming nodig is, dan vragen we die eerst, met een keuze die je ook echt kunt weigeren, en dan staat het hier beschreven voordat het aan staat.',
        ],
      },
    ],
  },
};
