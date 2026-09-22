/**
 * De titels van beide reeksen, per taal.
 *
 * De verhalen zelf staan in `src/content/` en zijn in het Nederlands
 * geschreven; de website is in zes talen. Een bezoeker die op de Spaanse
 * pagina een lijst met Nederlandse titels ziet, gelooft niet dat het boek in
 * het Spaans bestaat — en dat is precies wat hier verkocht wordt. Daarom
 * staan de titels hier vertaald, los van de verhalen, want dit is
 * winkelinrichting en geen inhoud.
 *
 * De volgorde is de volgorde van de delen. Wie een deel toevoegt, voegt hier
 * in elke taal een regel toe: de site rekent op gelijke lengtes en `Reeks`
 * dwingt dat af zodra je er een vergeet.
 */

export interface Reeks {
  /** Twaalf prentenboeken, 2 – 8 jaar. */
  sba: string[]
  /** Vijftien leesboeken, vanaf 9 jaar. */
  sleutels: string[]
  /** Het jaar van deel 15 — het enige jaartal dat een woord is. */
  nu: string
  /** Hoeveel woorden Darija er in een prentenboek zitten. */
  woorden: (n: number) => string
}

const nl: Reeks = {
  sba: [
    'Sba en de poorten van Fes', 'Sba en de berg die wit werd', 'Sba en de wind van de zee',
    'Sba en de markt van duizend dingen', 'Sba en het grote feest', 'Sba gaat naar school',
    'Sba en het huis met het dakterras', 'Sba en het dier dat zijn naam heeft',
    'Sba en de dokter van de medina', 'Sba en de dag die niet wilde eindigen',
    'Sba en de weg die niemand wist', 'Sba en mijn land',
  ],
  sleutels: [
    'De olijvenbrand', 'De overkant', 'Wat Fatima bouwde', 'De stad die er nog niet was',
    'De wereld op één vel', 'Dertig jaar onderweg', 'De jongen die twee namen kreeg',
    'Drie koningen, één dag', 'Het paleis van suiker', 'De stad aan zee',
    'Het eerste land dat ja zei', 'De berg die niet meeging', 'Het jaar dat de koning terugkwam',
    'Zwart op wit', 'De doos van jeddti',
  ],
  nu: 'Nu',
  woorden: (n) => `${n} woorden Darija`,
}

const fr: Reeks = {
  sba: [
    'Sba et les portes de Fès', 'Sba et la montagne devenue blanche', 'Sba et le vent de la mer',
    'Sba et le marché aux mille choses', 'Sba et la grande fête', 'Sba va à l’école',
    'Sba et la maison à la terrasse', 'Sba et l’animal qui porte son nom',
    'Sba et le médecin de la médina', 'Sba et le jour qui ne voulait pas finir',
    'Sba et le chemin que personne ne connaissait', 'Sba et mon pays',
  ],
  sleutels: [
    'L’incendie des oliviers', 'L’autre rive', 'Ce que Fatima a bâti', 'La ville qui n’existait pas encore',
    'Le monde sur une seule feuille', 'Trente ans sur les routes', 'Le garçon aux deux noms',
    'Trois rois, un seul jour', 'Le palais de sucre', 'La ville au bord de la mer',
    'Le premier pays qui a dit oui', 'La montagne qui n’a pas suivi', 'L’année du retour du roi',
    'Noir sur blanc', 'La boîte de jeddti',
  ],
  nu: 'Aujourd’hui',
  woorden: (n) => `${n} mots de darija`,
}

const de: Reeks = {
  sba: [
    'Sba und die Tore von Fès', 'Sba und der Berg, der weiß wurde', 'Sba und der Wind vom Meer',
    'Sba und der Markt der tausend Dinge', 'Sba und das große Fest', 'Sba geht zur Schule',
    'Sba und das Haus mit der Dachterrasse', 'Sba und das Tier, das seinen Namen trägt',
    'Sba und der Arzt der Medina', 'Sba und der Tag, der nicht enden wollte',
    'Sba und der Weg, den niemand kannte', 'Sba und mein Land',
  ],
  sleutels: [
    'Das Olivenfeuer', 'Die andere Seite', 'Was Fatima baute', 'Die Stadt, die es noch nicht gab',
    'Die Welt auf einem Blatt', 'Dreißig Jahre unterwegs', 'Der Junge mit zwei Namen',
    'Drei Könige, ein Tag', 'Der Palast aus Zucker', 'Die Stadt am Meer',
    'Das erste Land, das Ja sagte', 'Der Berg, der nicht mitging', 'Das Jahr, in dem der König zurückkam',
    'Schwarz auf weiß', 'Die Kiste von jeddti',
  ],
  nu: 'Heute',
  woorden: (n) => `${n} Wörter Darija`,
}

const es: Reeks = {
  sba: [
    'Sba y las puertas de Fez', 'Sba y la montaña que se volvió blanca', 'Sba y el viento del mar',
    'Sba y el mercado de las mil cosas', 'Sba y la gran fiesta', 'Sba va a la escuela',
    'Sba y la casa con azotea', 'Sba y el animal que lleva su nombre',
    'Sba y el médico de la medina', 'Sba y el día que no quería terminar',
    'Sba y el camino que nadie conocía', 'Sba y mi país',
  ],
  sleutels: [
    'El incendio de los olivos', 'La otra orilla', 'Lo que Fátima construyó', 'La ciudad que todavía no existía',
    'El mundo en una sola hoja', 'Treinta años de camino', 'El niño de los dos nombres',
    'Tres reyes, un solo día', 'El palacio de azúcar', 'La ciudad junto al mar',
    'El primer país que dijo sí', 'La montaña que no se fue', 'El año en que volvió el rey',
    'Negro sobre blanco', 'La caja de jeddti',
  ],
  nu: 'Hoy',
  woorden: (n) => `${n} palabras en dariya`,
}

const it: Reeks = {
  sba: [
    'Sba e le porte di Fès', 'Sba e la montagna che diventò bianca', 'Sba e il vento del mare',
    'Sba e il mercato delle mille cose', 'Sba e la grande festa', 'Sba va a scuola',
    'Sba e la casa con la terrazza', 'Sba e l’animale che porta il suo nome',
    'Sba e il medico della medina', 'Sba e il giorno che non voleva finire',
    'Sba e la strada che nessuno conosceva', 'Sba e il mio paese',
  ],
  sleutels: [
    'L’incendio degli ulivi', 'L’altra sponda', 'Quello che Fatima costruì', 'La città che non c’era ancora',
    'Il mondo su un solo foglio', 'Trent’anni in cammino', 'Il ragazzo dai due nomi',
    'Tre re, un solo giorno', 'Il palazzo di zucchero', 'La città sul mare',
    'Il primo paese che disse sì', 'La montagna che non seguì', 'L’anno in cui il re tornò',
    'Nero su bianco', 'La scatola di jeddti',
  ],
  nu: 'Oggi',
  woorden: (n) => `${n} parole in darija`,
}

const en: Reeks = {
  sba: [
    'Sba and the gates of Fes', 'Sba and the mountain that turned white', 'Sba and the wind from the sea',
    'Sba and the market of a thousand things', 'Sba and the big feast', 'Sba goes to school',
    'Sba and the house with the roof terrace', 'Sba and the animal with his name',
    'Sba and the doctor of the medina', 'Sba and the day that would not end',
    'Sba and the road nobody knew', 'Sba and my country',
  ],
  sleutels: [
    'The olive fire', 'The other side', 'What Fatima built', 'The city that wasn’t there yet',
    'The world on one sheet', 'Thirty years on the road', 'The boy with two names',
    'Three kings, one day', 'The palace of sugar', 'The city by the sea',
    'The first country that said yes', 'The mountain that would not go',
    'The year the king came back', 'Black on white', 'Jeddti’s box',
  ],
  nu: 'Today',
  woorden: (n) => `${n} Darija words`,
}

export const DELEN: Record<string, Reeks> = { nl, fr, de, es, it, en }
