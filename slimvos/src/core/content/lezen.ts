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
