import type { Vraag } from '../types';
import { kies, kiesUniek, type Rng } from '../rng';
import { keuzeVraag } from './helpers';

type Gen = (niveau: number, rng: Rng) => Vraag;

interface Tekst {
  titel: string;
  tekst: string;
  vragen: Array<{ stam: string; antwoord: string; afleiders: string[]; uitleg: string }>;
}

const TEKSTEN: Record<number, Tekst[]> = {
  1: [
    {
      titel: 'De verjaardag van opa',
      tekst:
        'Opa wordt vandaag zeventig. Noa heeft een tekening gemaakt van hun tuin, met de appelboom erop. Papa bakt een taart, maar hij is de suiker vergeten. Daarom smaakt de taart een beetje raar. Opa lacht en zegt dat het de lekkerste taart is die hij ooit heeft gehad.',
      vragen: [
        {
          stam: 'Waarom smaakt de taart raar?',
          antwoord: 'Er zit geen suiker in',
          afleiders: ['Hij is aangebrand', 'Hij is te oud', 'Er zit te veel zout in'],
          uitleg: 'In de tekst staat dat papa de suiker vergeten was.',
        },
        {
          stam: 'Wat vindt opa van de taart?',
          antwoord: 'Hij doet aardig en zegt dat hij lekker is',
          afleiders: ['Hij vindt hem echt vies', 'Hij eet hem niet op', 'Hij wordt boos'],
          uitleg: 'Opa lacht en zegt dat het de lekkerste taart ooit is. Dat is aardig bedoeld.',
        },
      ],
    },
    {
      titel: 'De verdwenen gymschoen',
      tekst:
        'Mees zoekt overal zijn linkergymschoen. Onder zijn bed ligt alleen een sok. In de gang staat zijn tas, maar die is leeg. Dan hoort hij geblaf in de tuin. Daar ligt Bikkel, de hond, tevreden op iets zwarts te kauwen.',
      vragen: [
        {
          stam: 'Waar vindt Mees zijn schoen waarschijnlijk?',
          antwoord: 'In de tuin, bij de hond',
          afleiders: ['Onder zijn bed', 'In zijn tas', 'In de gang'],
          uitleg: 'De laatste zin vertelt dat de hond in de tuin op iets zwarts kauwt. Dat is de schoen.',
        },
        {
          stam: 'Wat vond Mees onder zijn bed?',
          antwoord: 'Een sok',
          afleiders: ['Zijn schoen', 'Zijn tas', 'Niets'],
          uitleg: 'In de tweede zin staat: "Onder zijn bed ligt alleen een sok."',
        },
      ],
    },
  ],
  2: [
    {
      titel: 'Het gevonden konijn',
      tekst:
        'Op weg naar school ziet Liam een wit konijn in de berm zitten. Het beweegt niet. Liam vraagt bij de huizen in de straat of iemand het konijn kwijt is. Bij het derde huis doet een meisje open. Ze is haar konijn Pluis gisteravond kwijtgeraakt. Samen dragen ze Pluis terug in een doos. Liam komt te laat op school, maar de juf vindt het niet erg.',
      vragen: [
        {
          stam: 'Wat doet Liam als hij het konijn vindt?',
          antwoord: 'Hij vraagt in de straat wie het konijn kwijt is',
          afleiders: ['Hij neemt het mee naar school', 'Hij loopt door', 'Hij belt de dierenarts'],
          uitleg: 'In de tekst staat dat hij bij de huizen in de straat gaat vragen.',
        },
        {
          stam: 'Waarom vindt de juf het niet erg dat Liam te laat is?',
          antwoord: 'Omdat hij iemand geholpen heeft',
          afleiders: ['Omdat hij nooit te laat is', 'Omdat de les nog niet begon', 'Omdat hij een briefje had'],
          uitleg: 'Dat staat er niet letterlijk, maar het volgt uit het verhaal: hij was te laat omdat hij het konijn terugbracht.',
        },
      ],
    },
    {
      titel: 'Een nacht in de tent',
      tekst:
        'Fenna en haar vader slapen in de tuin in een tent. Ze hebben zaklampen, een dikke slaapzak en koekjes bij zich. Midden in de nacht wordt Fenna wakker van geritsel. Haar vader schijnt met de lamp naar buiten: het is een egel die tussen de bladeren zoekt. Fenna moet lachen van opluchting en valt daarna meteen weer in slaap.',
      vragen: [
        {
          stam: 'Waardoor wordt Fenna wakker?',
          antwoord: 'Door geritsel buiten de tent',
          afleiders: ['Door de regen', 'Door haar vader', 'Door een nachtmerrie'],
          uitleg: 'Er staat: "Midden in de nacht wordt Fenna wakker van geritsel."',
        },
        {
          stam: 'Hoe voelt Fenna zich aan het einde?',
          antwoord: 'Opgelucht',
          afleiders: ['Boos', 'Verdrietig', 'Bang'],
          uitleg: 'Ze "moet lachen van opluchting": het gevaar bleek een egel te zijn.',
        },
      ],
    },
  ],
  3: [
    {
      titel: 'Waarom de klok twee keer per jaar verspringt',
      tekst:
        'Twee keer per jaar gaat de klok een uur vooruit of achteruit. Dat heet zomertijd en wintertijd. Het idee komt uit een tijd waarin mensen energie wilden besparen: door de klok in de zomer vooruit te zetten, wordt het later donker en hoeft het licht minder lang aan. Onderzoekers twijfelen of dat nog werkt, want moderne lampen gebruiken weinig stroom. Bovendien slapen veel mensen de eerste dagen na de verandering slechter.',
      vragen: [
        {
          stam: 'Waarom is de zomertijd ooit ingevoerd?',
          antwoord: 'Om energie te besparen',
          afleiders: ['Om langer te kunnen sporten', 'Omdat de zon anders staat', 'Om scholen later te laten beginnen'],
          uitleg: 'De tekst zegt dat mensen energie wilden besparen door het later donker te laten worden.',
        },
        {
          stam: 'Waarom twijfelen onderzoekers of het nog werkt?',
          antwoord: 'Moderne lampen gebruiken weinig stroom',
          afleiders: ['Mensen slapen langer', 'Er zijn minder lampen', 'De zomers zijn korter'],
          uitleg: 'In de tekst staat dat moderne lampen weinig stroom gebruiken, waardoor de besparing klein is.',
        },
      ],
    },
    {
      titel: 'Waarom bijen belangrijk zijn',
      tekst:
        'Bijen vliegen van bloem naar bloem om nectar te halen. Onderweg blijft er stuifmeel aan hun pootjes plakken, dat ze weer afgeven bij de volgende bloem. Zo worden planten bestoven en kunnen er vruchten en zaden groeien. Ongeveer een derde van ons voedsel bestaat dankzij bestuiving. In Nederland gaat het echter slecht met veel wilde bijensoorten, vooral doordat er minder bloemrijke bermen zijn.',
      vragen: [
        {
          stam: 'Wat is de hoofdgedachte van deze tekst?',
          antwoord: 'Bijen zijn onmisbaar voor onze voedselvoorziening',
          afleiders: ['Bijen maken honing', 'Bermen moeten vaker gemaaid worden', 'Bijen steken mensen'],
          uitleg: 'De tekst legt uit hoe bestuiving werkt en dat een derde van ons voedsel ervan afhangt.',
        },
        {
          stam: 'Waardoor gaat het slecht met wilde bijen?',
          antwoord: 'Er zijn minder bloemrijke bermen',
          afleiders: ['Er zijn te veel bijen', 'Ze maken te weinig honing', 'Het is te koud'],
          uitleg: 'De laatste zin noemt bloemrijke bermen die verdwijnen als belangrijkste reden.',
        },
      ],
    },
  ],
  4: [
    {
      titel: 'De prijs van een gratis app',
      tekst:
        'Veel apps kosten niets om te downloaden. Toch verdienen de makers eraan. Sommige apps tonen advertenties: hoe langer je kijkt, hoe meer zij verdienen. Andere apps verkopen extra levens of kleding voor je spelfiguur. Een derde groep verzamelt gegevens over wat je doet en verkoopt die aan bedrijven die advertenties maken. Onderzoekers waarschuwen vooral voor die laatste groep, omdat gebruikers meestal niet doorhebben wat er precies wordt bijgehouden.',
      vragen: [
        {
          stam: 'Op welke drie manieren verdienen gratis apps geld, volgens de tekst?',
          antwoord: 'Advertenties, extra spullen verkopen, en gegevens doorverkopen',
          afleiders: ['Alleen advertenties', 'Abonnementen en advertenties', 'Donaties en advertenties'],
          uitleg: 'De tekst noemt achtereenvolgens advertenties, extra levens of kleding, en het verkopen van gegevens.',
        },
        {
          stam: 'Waarvoor waarschuwen onderzoekers vooral?',
          antwoord: 'Voor apps die stiekem gegevens verzamelen',
          afleiders: ['Voor te dure apps', 'Voor apps met veel advertenties', 'Voor apps die snel leeg zijn'],
          uitleg: 'De laatste zin zegt dat de waarschuwing vooral over die derde groep gaat.',
        },
      ],
    },
    {
      titel: 'Het verhaal achter de sneakers',
      tekst:
        'Een paar sneakers legt vaak een wereldreis af voordat het in de winkel ligt. Het rubber komt uit Thailand, het katoen uit India en de zolen worden in Vietnam aan elkaar gelijmd. Daarna gaan de schoenen per containerschip naar Rotterdam. Fabrikanten kiezen voor deze route omdat lonen in Azië laag zijn. Critici wijzen erop dat het transport veel CO₂ kost en dat werknemers weinig verdienen. Sommige merken laten daarom weer in Europa produceren, al is de schoen dan duurder.',
      vragen: [
        {
          stam: 'Waarom laten fabrikanten in Azië produceren?',
          antwoord: 'Omdat de lonen daar laag zijn',
          afleiders: ['Omdat het rubber daar beter is', 'Omdat er meer fabrieken zijn', 'Omdat transport goedkoop is'],
          uitleg: 'De tekst zegt letterlijk: "omdat lonen in Azië laag zijn".',
        },
        {
          stam: 'Welk nadeel van produceren in Europa noemt de tekst?',
          antwoord: 'De schoen wordt duurder',
          afleiders: ['Er is minder katoen', 'Het duurt langer', 'De kwaliteit is slechter'],
          uitleg: 'In de laatste zin staat: "al is de schoen dan duurder".',
        },
        {
          stam: 'Wat is het doel van deze tekst?',
          antwoord: 'Informeren over hoe sneakers gemaakt worden',
          afleiders: ['Sneakers verkopen', 'Waarschuwen voor namaak', 'Uitleggen hoe je schoenen poetst'],
          uitleg: 'De tekst geeft feiten en twee kanten van het verhaal, zonder iets aan te prijzen.',
        },
      ],
    },
  ],
  5: [
    {
      titel: 'Wie mag de straat gebruiken?',
      tekst:
        'In veel steden wordt de ruimte opnieuw verdeeld. Parkeerplaatsen verdwijnen en er komen fietspaden, bomen en bankjes voor terug. Voorstanders wijzen op schonere lucht, minder ongelukken en koelere straten in de zomer. Tegenstanders vinden dat winkeliers klanten verliezen en dat ouderen met een auto worden vergeten. Uit onderzoek in Utrecht en Groningen bleek dat winkels na de herinrichting juist meer omzet haalden, al gold dat niet voor elke straat.',
      vragen: [
        {
          stam: 'Welk argument gebruiken tegenstanders?',
          antwoord: 'Winkeliers zouden klanten verliezen',
          afleiders: ['De lucht wordt vuiler', 'Er komen meer ongelukken', 'Bomen zijn te duur'],
          uitleg: 'De tekst noemt bij tegenstanders het verlies van klanten en het vergeten van ouderen met een auto.',
        },
        {
          stam: 'Hoe verhoudt het onderzoek zich tot dat argument?',
          antwoord: 'Het spreekt het deels tegen: winkels haalden juist meer omzet',
          afleiders: ['Het bevestigt het volledig', 'Het gaat er niet over', 'Het laat zien dat alle straten erop achteruitgingen'],
          uitleg: 'Het onderzoek vond méér omzet, maar de tekst voegt toe dat dat niet voor elke straat gold. Dus deels.',
        },
        {
          stam: 'Wat zegt de laatste zinsnede "al gold dat niet voor elke straat" over de schrijver?',
          antwoord: 'Hij houdt een slag om de arm en overdrijft niet',
          afleiders: ['Hij is tegen de plannen', 'Hij vertrouwt het onderzoek niet', 'Hij vindt het onderwerp onbelangrijk'],
          uitleg: 'Door die toevoeging presenteert de schrijver het onderzoek genuanceerd in plaats van als bewijs.',
        },
      ],
    },
    {
      titel: 'Schermtijd: twee meningen',
      tekst:
        'Onderzoekers zijn het niet eens over schermtijd. De ene groep wijst op studies waarin kinderen die veel op een scherm kijken slechter slapen en zich minder goed concentreren. De andere groep vindt die studies te grof: het maakt volgens hen uit wát je doet. Samen een spelletje spelen of programmeren is iets anders dan urenlang video’s doorscrollen. Beide groepen zijn het over één ding eens: schermen vlak voor het slapen gaan is geen goed idee, omdat het licht de aanmaak van slaaphormoon remt.',
      vragen: [
        {
          stam: 'Waarover zijn beide groepen onderzoekers het eens?',
          antwoord: 'Schermen vlak voor het slapen zijn ongunstig',
          afleiders: ['Alle schermtijd is schadelijk', 'Schermtijd maakt niet uit', 'Kinderen moeten leren programmeren'],
          uitleg: 'De laatste zin begint met "Beide groepen zijn het over één ding eens".',
        },
        {
          stam: 'Wat is de kritiek van de tweede groep op de studies?',
          antwoord: 'Ze kijken niet naar wat je op het scherm doet',
          afleiders: ['Ze gebruiken te weinig kinderen', 'Ze zijn te oud', 'Ze zijn betaald door bedrijven'],
          uitleg: 'De tekst zegt dat het volgens hen uitmaakt wát je doet, niet alleen hoeveel.',
        },
        {
          stam: 'Welk woord past het best bij de toon van deze tekst?',
          antwoord: 'Afwegend',
          afleiders: ['Boos', 'Grappig', 'Overtuigend'],
          uitleg: 'De schrijver zet twee standpunten naast elkaar zonder partij te kiezen.',
        },
      ],
    },
  ],
};

export const begrijpend: Gen = (niveau, rng) => {
  const n = Math.min(5, Math.max(1, niveau));
  const tekst = kies(rng, TEKSTEN[n]);
  const vraag = kies(rng, tekst.vragen);
  return keuzeVraag(rng, {
    onderwerpId: 'lezen.begrijpend',
    niveau: n,
    context: `${tekst.titel}\n\n${tekst.tekst}`,
    stam: vraag.stam,
    antwoord: vraag.antwoord,
    afleiders: kiesUniek(rng, vraag.afleiders, Math.min(3, vraag.afleiders.length)),
    uitleg: vraag.uitleg,
  });
};

export const LEZEN_GENERATOREN: Record<string, Gen> = {
  'lezen.begrijpend': begrijpend,
};

export const AANTAL_TEKSTEN = Object.values(TEKSTEN).reduce((n, l) => n + l.length, 0);
