/**
 * De indeling van Marokko 360° in de vijf andere talen.
 *
 * De bladzijde van de reeks staat op darijaforkids.eu in zes talen. Zonder dit
 * bestand las een Duitse bezoeker een Duitse inleiding en daaronder zeventien
 * Nederlandse deeltitels — niet zichtbaar onvertaald maar gewoon stuk.
 *
 * **Wat hier wel en niet vertaald wordt.** Dit is redactionele tekst: wat een
 * deel bestrijkt en waarom de grens daar ligt. Het is mijn eigen afbakening en
 * geen bronmateriaal, dus het mag vertaald worden zonder dat er een bewering
 * verschuift. Zodra er hoofdstukken komen, geldt daar iets anders voor: een
 * bron wordt geciteerd in de taal waarin hij geschreven is, en een vertaalde
 * bewering draagt in de bronvermelding wie hem vertaald heeft.
 *
 * **En deze indeling staat nog niet vast.** `delen.ts` zegt het al: de
 * opdracht vraagt de indeling pas vast te stellen ná onderzoek. Verschuift
 * hij, dan verschuift dit mee — de id's blijven.
 *
 * Een deel dat hier ontbreekt valt terug op het Nederlands. Dat is dezelfde
 * afspraak als bij de twee verhalenreeksen.
 */

import type { Deel } from './types'

export interface Deelvertaling {
  titel: string
  /** Leeg bij een thematisch deel, net als in `delen.ts`. */
  periode?: string
  omvat: string
}

const FR: Record<string, Deelvertaling> = {
  m1: {
    titel: 'Le pays et ses premiers habitants',
    periode: 'jusqu’à ± 1000 av. J.-C.',
    omvat: 'Paysage, climat et archéologie : ce que le sol dit de ceux qui vivaient ici avant l’écriture. Commence par le paysage lui-même, parce que l’Atlas, le Rif, le Souss et le Sahara expliquent le reste de la série.',
  },
  m2: {
    titel: 'La Maurétanie, Carthage et Rome',
    periode: '± 1000 av. J.-C. – Ve siècle',
    omvat: 'Les contacts phéniciens et puniques le long de la côte, le royaume de Maurétanie, la province romaine de Maurétanie Tingitane et les villes qui vont avec. Va jusqu’au moment où la ville cesse d’être romaine, et non jusqu’à une date politique : c’est ce que montrent les fouilles.',
  },
  m3: {
    titel: 'Les premiers siècles islamiques et la naissance de Fès',
    periode: 'VIIe – Xe siècle',
    omvat: 'L’arrivée de l’islam, les premières dynasties, et Fès qui passe de campement à ville. Ici figure aussi ce qu’il advint de la population plus ancienne : ce n’est pas un pays vide qui recommence.',
  },
  m4: {
    titel: 'Les Almoravides, le Sahara et Marrakech',
    periode: 'XIe – XIIe siècle',
    omvat: 'Un mouvement venu du sud, le commerce transsaharien qui le porte, et la ville qui en naît. Les routes commerciales ne sont pas ici un décor mais le sujet.',
  },
  m5: {
    titel: 'Les Almohades au Maghreb et en al-Andalus',
    periode: 'XIIe – XIIIe siècle',
    omvat: 'Un empire qui couvrait les deux rives du Détroit. Renvoie à la série al-Andalus plutôt que de la refaire.',
  },
  m6: {
    titel: 'Les Mérinides : Fès, l’enseignement et la ville',
    periode: 'XIIIe – XVe siècle',
    omvat: 'Médersas, architecture et croissance urbaine. Le tome où le savoir et l’enseignement portent le récit à la place des batailles.',
  },
  m7: {
    titel: 'Un siècle de ruptures : côtes, ports et puissances nouvelles',
    periode: 'XVe – XVIe siècle',
    omvat: 'Fin du Moyen Âge et début de l’époque moderne : comptoirs portugais et espagnols sur la côte, puissances régionales à l’intérieur, et la question de savoir qui tient les ports. Dans la commande ce tome s’appelle « changements politiques et régionaux » ; c’est un titre vide pour un siècle où tout se décide justement sur la côte.',
  },
  m8: {
    titel: 'Les Saadiens : Marrakech, le sucre et l’or',
    periode: 'XVIe – début XVIIe siècle',
    omvat: 'Commerce, constructions et les batailles que les sources portent réellement. Ce qui se dit de la bataille de Ksar el-Kébir et de l’expédition vers le Songhaï figure ici avec ses sources et avec le doute.',
  },
  m9: {
    titel: 'Les Alaouites, Meknès et la formation d’un État',
    periode: 'XVIIe – XVIIIe siècle',
    omvat: 'Formation de l’État, diplomatie avec l’Europe et le monde atlantique, et la construction de Meknès.',
  },
  m10: {
    titel: 'Le XIXe siècle : commerce, réformes et pression extérieure',
    periode: '1800 – 1912',
    omvat: 'Les villes, les traités de commerce, les tentatives de réforme et la présence européenne croissante qui débouche sur le protectorat.',
  },
  m11: {
    titel: 'Protectorat, résistance et indépendance',
    periode: '1912 – 1956',
    omvat: 'Le protectorat français et le protectorat espagnol, le Rif, des histoires régionales qui n’entrent pas dans un seul récit national, et le chemin vers 1956.',
  },
  m12: {
    titel: 'Depuis 1956 : société, villes et diaspora',
    periode: '1956 – aujourd’hui',
    omvat: 'Politique, croissance urbaine, migration et les communautés hors du Maroc. Le tome le plus proche du lecteur, et donc celui qui demande le plus de retenue : ne prendre parti pour personne, mais montrer ce qui fait débat.',
  },
  m13: {
    titel: 'Villes et lieux à travers les siècles',
    omvat: 'Thématique. Pour chaque ville, toute la chronologie d’affilée, pour le lecteur qui entre par un lieu plutôt que par un siècle.',
  },
  m14: {
    titel: 'Régions, paysages et routes',
    omvat: 'Thématique. Rif, Atlas, Souss, côte atlantique, oasis, Sahara et les routes entre eux. Ici figurent les histoires qui disparaissent dès qu’on découpe par dynastie.',
  },
  m15: {
    titel: 'Gens, langues, savoirs et vie quotidienne',
    omvat: 'Thématique. Communautés, langues, religion, artisanat, agriculture, architecture, sciences et vie ordinaire — le tome où l’encyclopédie parle des gens au lieu des souverains.',
  },
  a1: {
    titel: 'Al-Andalus : ce que c’était et comment c’est devenu',
    omvat: 'Commence par la question de ce que « al-Andalus » signifie dans les sources, comment cela varie selon l’époque et selon l’auteur, et pourquoi ce n’est pas la même chose que l’Andalousie d’aujourd’hui. Ensuite l’histoire ibérique elle-même.',
  },
  a2: {
    titel: 'De l’autre côté du Détroit : villes, savoirs et communautés',
    omvat: 'Les villes, les savants, l’architecture et les communautés qui y vivaient, et les liens avec l’Afrique du Nord sans faire d’al-Andalus la préhistoire du Maroc. La limite entre les tomes 1 et 2 n’est pas fixée : elle doit sortir de la recherche, pas d’un partage commode.',
  },
}

const DE: Record<string, Deelvertaling> = {
  m1: {
    titel: 'Das Land und seine frühesten Bewohner',
    periode: 'bis ± 1000 v. Chr.',
    omvat: 'Landschaft, Klima und Archäologie: was der Boden über die sagt, die hier lebten, bevor geschrieben wurde. Beginnt bei der Landschaft selbst, weil Atlas, Rif, Souss und Sahara den Rest der Reihe erklären.',
  },
  m2: {
    titel: 'Mauretanien, Karthago und Rom',
    periode: '± 1000 v. Chr. – 5. Jahrhundert',
    omvat: 'Phönizische und punische Kontakte entlang der Küste, das Königreich Mauretanien, die römische Provinz Mauretania Tingitana und die Städte, die dazugehören. Läuft bis die Stadt aufhört, römisch zu sein, und nicht bis zu einem politischen Datum: das ist es, was die Grabungen zeigen.',
  },
  m3: {
    titel: 'Die ersten islamischen Jahrhunderte und die Entstehung von Fès',
    periode: '7. – 10. Jahrhundert',
    omvat: 'Die Ankunft des Islam, die frühen Dynastien, und Fès von der Siedlung zur Stadt. Hierher gehört auch, was mit der älteren Bevölkerung geschah: das ist kein leeres Land, das neu anfängt.',
  },
  m4: {
    titel: 'Die Almoraviden, die Sahara und Marrakesch',
    periode: '11. – 12. Jahrhundert',
    omvat: 'Eine Bewegung, die aus dem Süden kommt, der Transsaharahandel, der sie trägt, und die Stadt, die daraus hervorgeht. Die Handelsrouten sind hier kein Hintergrund, sondern die Hauptsache.',
  },
  m5: {
    titel: 'Die Almohaden im Maghreb und in al-Andalus',
    periode: '12. – 13. Jahrhundert',
    omvat: 'Ein Reich, das beide Seiten der Meerenge umfasste. Verweist auf die al-Andalus-Reihe, statt sie zu wiederholen.',
  },
  m6: {
    titel: 'Die Meriniden: Fès, Bildung und die Stadt',
    periode: '13. – 15. Jahrhundert',
    omvat: 'Medresen, Baukunst und städtisches Wachstum. Der Band, in dem Wissen und Bildung die Geschichte tragen statt der Schlachten.',
  },
  m7: {
    titel: 'Ein Jahrhundert der Brüche: Küsten, Häfen und neue Mächte',
    periode: '15. – 16. Jahrhundert',
    omvat: 'Spätmittelalter und frühe Neuzeit: portugiesische und spanische Niederlassungen an der Küste, regionale Mächte im Landesinneren, und die Frage, wer die Häfen beherrscht. Im Auftrag heißt dieser Band „politische und regionale Veränderungen“; das ist ein leerer Titel für ein Jahrhundert, in dem gerade die Küste alles entscheidet.',
  },
  m8: {
    titel: 'Die Saadier: Marrakesch, Zucker und Gold',
    periode: '16. – frühes 17. Jahrhundert',
    omvat: 'Handel, Bauwerke und die Schlachten, die die Quellen wirklich tragen. Was über die Schlacht von Ksar el-Kebir und über den Zug nach Songhai gesagt wird, steht hier mit Quellen und mit dem Zweifel dabei.',
  },
  m9: {
    titel: 'Die Alawiden, Meknès und die Bildung eines Staates',
    periode: '17. – 18. Jahrhundert',
    omvat: 'Staatsbildung, Diplomatie mit Europa und der atlantischen Welt, und der Bau von Meknès.',
  },
  m10: {
    titel: 'Das 19. Jahrhundert: Handel, Reform und Druck von außen',
    periode: '1800 – 1912',
    omvat: 'Städte, Handelsverträge, Reformversuche und die wachsende europäische Präsenz, die auf das Protektorat hinausläuft.',
  },
  m11: {
    titel: 'Protektorat, Widerstand und Unabhängigkeit',
    periode: '1912 – 1956',
    omvat: 'Das französische und das spanische Protektorat, der Rif, regionale Geschichten, die in keine einzige nationale Erzählung passen, und der Weg zu 1956.',
  },
  m12: {
    titel: 'Seit 1956: Gesellschaft, Städte und Diaspora',
    periode: '1956 – heute',
    omvat: 'Politik, städtisches Wachstum, Migration und die Gemeinschaften außerhalb Marokkos. Der Band, der dem Leser am nächsten steht und deshalb die meiste Zurückhaltung verlangt: nicht Partei ergreifen, aber zeigen, worüber gestritten wird.',
  },
  m13: {
    titel: 'Städte und Orte durch die Jahrhunderte',
    omvat: 'Thematisch. Pro Stadt die ganze Zeitleiste am Stück, für den Leser, der über einen Ort einsteigt statt über ein Jahrhundert.',
  },
  m14: {
    titel: 'Regionen, Landschaften und Routen',
    omvat: 'Thematisch. Rif, Atlas, Souss, Atlantikküste, Oasen, Sahara und die Routen dazwischen. Hier stehen die Geschichten, die wegfallen, sobald man nach Dynastien einteilt.',
  },
  m15: {
    titel: 'Menschen, Sprachen, Wissen und Alltag',
    omvat: 'Thematisch. Gemeinschaften, Sprachen, Religion, Handwerk, Landwirtschaft, Architektur, Wissenschaft und das gewöhnliche Leben — der Band, in dem die Enzyklopädie von Menschen handelt statt von Herrschern.',
  },
  a1: {
    titel: 'Al-Andalus: was es war und wie es dazu kam',
    omvat: 'Beginnt mit der Frage, was „al-Andalus“ in den Quellen bedeutet, wie das je nach Zeit und Autor verschieden ist, und warum es nicht dasselbe ist wie das heutige Andalusien. Danach die iberische Geschichte selbst.',
  },
  a2: {
    titel: 'Über die Meerenge: Städte, Wissen und Gemeinschaften',
    omvat: 'Städte, Gelehrte, Baukunst und die Gemeinschaften, die dort lebten, und die Verbindungen nach Nordafrika, ohne al-Andalus zur Vorgeschichte Marokkos zu machen. Die Grenze zwischen Band 1 und 2 steht noch nicht fest: sie soll aus der Forschung kommen und nicht aus einer bequemen Teilung.',
  },
}

const ES: Record<string, Deelvertaling> = {
  m1: {
    titel: 'El país y sus primeros habitantes',
    periode: 'hasta ± 1000 a.C.',
    omvat: 'Paisaje, clima y arqueología: lo que el suelo dice de quienes vivían aquí antes de que se escribiera. Empieza por el paisaje mismo, porque el Atlas, el Rif, el Sus y el Sáhara explican el resto de la serie.',
  },
  m2: {
    titel: 'Mauritania, Cartago y Roma',
    periode: '± 1000 a.C. – siglo V',
    omvat: 'Contactos fenicios y púnicos a lo largo de la costa, el reino de Mauritania, la provincia romana de Mauritania Tingitana y las ciudades que le corresponden. Llega hasta que la ciudad deja de ser romana, y no hasta una fecha política: eso es lo que muestran las excavaciones.',
  },
  m3: {
    titel: 'Los primeros siglos islámicos y el nacimiento de Fez',
    periode: 'siglos VII – X',
    omvat: 'La llegada del islam, las primeras dinastías, y Fez de asentamiento a ciudad. Aquí entra también qué pasó con la población anterior: este no es un país vacío que empieza de nuevo.',
  },
  m4: {
    titel: 'Los almorávides, el Sáhara y Marrakech',
    periode: 'siglos XI – XII',
    omvat: 'Un movimiento que viene del sur, el comercio transahariano que lo sostiene, y la ciudad que nace de ello. Las rutas comerciales no son aquí el decorado sino el asunto.',
  },
  m5: {
    titel: 'Los almohades en el Magreb y en al-Ándalus',
    periode: 'siglos XII – XIII',
    omvat: 'Un imperio que abarcaba las dos orillas del Estrecho. Remite a la serie de al-Ándalus en lugar de repetirla.',
  },
  m6: {
    titel: 'Los meriníes: Fez, la enseñanza y la ciudad',
    periode: 'siglos XIII – XV',
    omvat: 'Madrasas, arquitectura y crecimiento urbano. El tomo en el que el saber y la enseñanza llevan el relato en lugar de las batallas.',
  },
  m7: {
    titel: 'Un siglo de rupturas: costas, puertos y nuevas potencias',
    periode: 'siglos XV – XVI',
    omvat: 'Final de la Edad Media y principio de la Edad Moderna: establecimientos portugueses y españoles en la costa, poderes regionales en el interior, y la cuestión de quién controla los puertos. En el encargo este tomo se llama «cambios políticos y regionales»; es un título vacío para un siglo en el que todo se decide precisamente en la costa.',
  },
  m8: {
    titel: 'Los saadíes: Marrakech, el azúcar y el oro',
    periode: 'siglo XVI – principios del XVII',
    omvat: 'Comercio, construcciones y las batallas que las fuentes sostienen de verdad. Lo que se dice de la batalla de Ksar el-Kebir y de la expedición al Songhay va aquí con sus fuentes y con la duda incluida.',
  },
  m9: {
    titel: 'Los alauíes, Mequinez y la formación de un Estado',
    periode: 'siglos XVII – XVIII',
    omvat: 'Formación del Estado, diplomacia con Europa y con el mundo atlántico, y la construcción de Mequinez.',
  },
  m10: {
    titel: 'El siglo XIX: comercio, reforma y presión exterior',
    periode: '1800 – 1912',
    omvat: 'Las ciudades, los tratados comerciales, los intentos de reforma y la presencia europea creciente que desemboca en el protectorado.',
  },
  m11: {
    titel: 'Protectorado, resistencia e independencia',
    periode: '1912 – 1956',
    omvat: 'El protectorado francés y el español, el Rif, historias regionales que no caben en un solo relato nacional, y el camino hacia 1956.',
  },
  m12: {
    titel: 'Desde 1956: sociedad, ciudades y diáspora',
    periode: '1956 – hoy',
    omvat: 'Política, crecimiento urbano, migración y las comunidades fuera de Marruecos. El tomo más cercano al lector y por eso el que más contención exige: no tomar partido, pero sí mostrar sobre qué se discute.',
  },
  m13: {
    titel: 'Ciudades y lugares a lo largo de los siglos',
    omvat: 'Temático. Por cada ciudad, toda la cronología seguida, para el lector que entra por un lugar en vez de por un siglo.',
  },
  m14: {
    titel: 'Regiones, paisajes y rutas',
    omvat: 'Temático. Rif, Atlas, Sus, costa atlántica, oasis, Sáhara y las rutas entre ellos. Aquí están las historias que desaparecen en cuanto se divide por dinastías.',
  },
  m15: {
    titel: 'Gente, lenguas, saberes y vida cotidiana',
    omvat: 'Temático. Comunidades, lenguas, religión, artesanía, agricultura, arquitectura, ciencia y vida corriente: el tomo en el que la enciclopedia trata de personas en lugar de gobernantes.',
  },
  a1: {
    titel: 'Al-Ándalus: qué fue y cómo llegó a serlo',
    omvat: 'Empieza por la pregunta de qué significa «al-Ándalus» en las fuentes, cómo varía según la época y según el autor, y por qué no es lo mismo que la Andalucía de hoy. Después, la historia ibérica misma.',
  },
  a2: {
    titel: 'Al otro lado del Estrecho: ciudades, saberes y comunidades',
    omvat: 'Ciudades, sabios, arquitectura y las comunidades que vivieron allí, y las conexiones con el norte de África sin convertir al-Ándalus en la prehistoria de Marruecos. El límite entre el tomo 1 y el 2 aún no está fijado: debe salir de la investigación y no de un reparto cómodo.',
  },
}

const IT: Record<string, Deelvertaling> = {
  m1: {
    titel: 'Il paese e i suoi primi abitanti',
    periode: 'fino a ± 1000 a.C.',
    omvat: 'Paesaggio, clima e archeologia: ciò che il suolo dice di chi viveva qui prima che si scrivesse. Comincia dal paesaggio stesso, perché l’Atlante, il Rif, il Souss e il Sahara spiegano il resto della collana.',
  },
  m2: {
    titel: 'La Mauretania, Cartagine e Roma',
    periode: '± 1000 a.C. – V secolo',
    omvat: 'Contatti fenici e punici lungo la costa, il regno di Mauretania, la provincia romana di Mauretania Tingitana e le città che vi appartengono. Arriva fino a quando la città smette di essere romana, non fino a una data politica: è ciò che mostrano gli scavi.',
  },
  m3: {
    titel: 'I primi secoli islamici e la nascita di Fès',
    periode: 'VII – X secolo',
    omvat: 'L’arrivo dell’islam, le prime dinastie, e Fès che da insediamento diventa città. Qui rientra anche che cosa accadde alla popolazione più antica: non è un paese vuoto che ricomincia.',
  },
  m4: {
    titel: 'Gli almoravidi, il Sahara e Marrakech',
    periode: 'XI – XII secolo',
    omvat: 'Un movimento che viene dal sud, il commercio transahariano che lo sostiene, e la città che ne nasce. Le rotte commerciali qui non sono lo sfondo ma l’argomento.',
  },
  m5: {
    titel: 'Gli almohadi nel Maghreb e in al-Andalus',
    periode: 'XII – XIII secolo',
    omvat: 'Un impero che copriva entrambe le sponde dello Stretto. Rimanda alla collana su al-Andalus invece di rifarla.',
  },
  m6: {
    titel: 'I merinidi: Fès, l’istruzione e la città',
    periode: 'XIII – XV secolo',
    omvat: 'Madrase, architettura e crescita urbana. Il volume in cui il sapere e l’istruzione reggono il racconto al posto delle battaglie.',
  },
  m7: {
    titel: 'Un secolo di fratture: coste, porti e nuove potenze',
    periode: 'XV – XVI secolo',
    omvat: 'Tardo medioevo e prima età moderna: insediamenti portoghesi e spagnoli sulla costa, poteri regionali nell’entroterra, e la questione di chi controlla i porti. Nella commessa questo volume si chiama «cambiamenti politici e regionali»; è un titolo vuoto per un secolo in cui è proprio la costa a decidere tutto.',
  },
  m8: {
    titel: 'I saadiani: Marrakech, lo zucchero e l’oro',
    periode: 'XVI – inizio XVII secolo',
    omvat: 'Commercio, costruzioni e le battaglie che le fonti reggono davvero. Quel che si dice della battaglia di Ksar el-Kebir e della spedizione verso il Songhai sta qui con le fonti e con il dubbio.',
  },
  m9: {
    titel: 'Gli alauiti, Meknès e la formazione di uno Stato',
    periode: 'XVII – XVIII secolo',
    omvat: 'Formazione dello Stato, diplomazia con l’Europa e con il mondo atlantico, e la costruzione di Meknès.',
  },
  m10: {
    titel: 'L’Ottocento: commercio, riforme e pressione esterna',
    periode: '1800 – 1912',
    omvat: 'Le città, i trattati commerciali, i tentativi di riforma e la crescente presenza europea che sfocia nel protettorato.',
  },
  m11: {
    titel: 'Protettorato, resistenza e indipendenza',
    periode: '1912 – 1956',
    omvat: 'Il protettorato francese e quello spagnolo, il Rif, storie regionali che non entrano in un unico racconto nazionale, e la strada verso il 1956.',
  },
  m12: {
    titel: 'Dal 1956: società, città e diaspora',
    periode: '1956 – oggi',
    omvat: 'Politica, crescita urbana, migrazione e le comunità fuori dal Marocco. Il volume più vicino al lettore e perciò quello che richiede più misura: non prendere parte, ma mostrare su che cosa si discute.',
  },
  m13: {
    titel: 'Città e luoghi attraverso i secoli',
    omvat: 'Tematico. Per ogni città l’intera cronologia di seguito, per il lettore che entra da un luogo invece che da un secolo.',
  },
  m14: {
    titel: 'Regioni, paesaggi e rotte',
    omvat: 'Tematico. Rif, Atlante, Souss, costa atlantica, oasi, Sahara e le rotte fra loro. Qui stanno le storie che spariscono appena si divide per dinastie.',
  },
  m15: {
    titel: 'Persone, lingue, saperi e vita quotidiana',
    omvat: 'Tematico. Comunità, lingue, religione, artigianato, agricoltura, architettura, scienza e vita ordinaria: il volume in cui l’enciclopedia parla di persone invece che di sovrani.',
  },
  a1: {
    titel: 'Al-Andalus: che cosa fu e come lo divenne',
    omvat: 'Comincia dalla domanda su che cosa significhi «al-Andalus» nelle fonti, come questo cambi a seconda del periodo e dell’autore, e perché non sia la stessa cosa dell’Andalusia di oggi. Poi la storia iberica stessa.',
  },
  a2: {
    titel: 'Oltre lo Stretto: città, saperi e comunità',
    omvat: 'Città, studiosi, architettura e le comunità che vi vivevano, e i legami con il Nordafrica senza fare di al-Andalus la preistoria del Marocco. Il confine fra il volume 1 e il 2 non è ancora fissato: deve venire dalla ricerca e non da una divisione comoda.',
  },
}

const EN: Record<string, Deelvertaling> = {
  m1: {
    titel: 'The land and its earliest inhabitants',
    periode: 'to ± 1000 BCE',
    omvat: 'Landscape, climate and archaeology: what the ground says about who lived here before anything was written down. It starts with the landscape itself, because the Atlas, the Rif, the Souss and the Sahara explain the rest of the series.',
  },
  m2: {
    titel: 'Mauretania, Carthage and Rome',
    periode: '± 1000 BCE – 5th century',
    omvat: 'Phoenician and Punic contact along the coast, the kingdom of Mauretania, the Roman province of Mauretania Tingitana and the towns that go with it. It runs until the town stops being Roman rather than to a political date: that is what the excavations show.',
  },
  m3: {
    titel: 'The first Islamic centuries and the making of Fez',
    periode: '7th – 10th century',
    omvat: 'The arrival of Islam, the early dynasties, and Fez from settlement to city. What happened to the older population belongs here too: this is not an empty country starting over.',
  },
  m4: {
    titel: 'The Almoravids, the Sahara and Marrakesh',
    periode: '11th – 12th century',
    omvat: 'A movement that comes out of the south, the trans-Saharan trade that carries it, and the city that comes of it. The trade routes are not the backdrop here but the subject.',
  },
  m5: {
    titel: 'The Almohads in the Maghreb and al-Andalus',
    periode: '12th – 13th century',
    omvat: 'An empire that covered both sides of the Strait. It points forward to the al-Andalus series instead of doing it over.',
  },
  m6: {
    titel: 'The Marinids: Fez, learning and the city',
    periode: '13th – 15th century',
    omvat: 'Madrasas, architecture and urban growth. The volume where knowledge and teaching carry the story instead of battles.',
  },
  m7: {
    titel: 'A century of breaks: coasts, ports and new powers',
    periode: '15th – 16th century',
    omvat: 'The late medieval and early modern period: Portuguese and Spanish footholds on the coast, regional powers inland, and the question of who holds the ports. The brief calls this volume “political and regional changes”; that is an empty title for a century in which the coast decides everything.',
  },
  m8: {
    titel: 'The Saadians: Marrakesh, sugar and gold',
    periode: '16th – early 17th century',
    omvat: 'Trade, buildings and the battles the sources actually carry. What is said about the battle of Ksar el-Kebir and about the march on Songhai belongs here with its sources and with the doubt attached.',
  },
  m9: {
    titel: 'The Alaouites, Meknes and the making of a state',
    periode: '17th – 18th century',
    omvat: 'State formation, diplomacy with Europe and the Atlantic world, and the building of Meknes.',
  },
  m10: {
    titel: 'The nineteenth century: trade, reform and pressure from outside',
    periode: '1800 – 1912',
    omvat: 'Towns, trade treaties, attempts at reform, and the growing European presence that ends in the protectorate.',
  },
  m11: {
    titel: 'Protectorate, resistance and independence',
    periode: '1912 – 1956',
    omvat: 'The French and the Spanish protectorate, the Rif, regional histories that do not fit one national story, and the road to 1956.',
  },
  m12: {
    titel: 'Since 1956: society, cities and diaspora',
    periode: '1956 – now',
    omvat: 'Politics, urban growth, migration and the communities outside Morocco. The volume closest to the reader, and for that reason the one that asks for the most restraint: take nobody’s side, but show what is being argued over.',
  },
  m13: {
    titel: 'Cities and places down the centuries',
    omvat: 'Thematic. Per city the whole timeline in one run, for the reader who comes in by a place rather than by a century.',
  },
  m14: {
    titel: 'Regions, landscapes and routes',
    omvat: 'Thematic. Rif, Atlas, Souss, Atlantic coast, oases, Sahara and the routes between them. Here are the histories that drop out the moment you divide things up by dynasty.',
  },
  m15: {
    titel: 'People, languages, knowledge and daily life',
    omvat: 'Thematic. Communities, languages, religion, craft, farming, architecture, science and ordinary life — the volume where the encyclopedia is about people instead of rulers.',
  },
  a1: {
    titel: 'Al-Andalus: what it was and how it came to be',
    omvat: 'It begins with what “al-Andalus” means in the sources, how that differs by period and by author, and why it is not the same thing as today’s Andalusia. Then the Iberian history itself.',
  },
  a2: {
    titel: 'Across the Strait: cities, learning and communities',
    omvat: 'Cities, scholars, architecture and the communities that lived there, and the connections with North Africa without turning al-Andalus into the prehistory of Morocco. Where volume 1 ends and volume 2 begins is not settled: that should come out of the research, not out of a convenient split.',
  },
}

export const DEEL_VERTALINGEN: Record<string, Record<string, Deelvertaling>> =
  { fr: FR, de: DE, es: ES, it: IT, en: EN }

/**
 * Een deel in een taal, over het Nederlandse deel heen gelegd.
 *
 * Een taal die het deel niet heeft, krijgt het Nederlands terug. Dat is
 * dezelfde afspraak als bij `sleutelflapIn` en `flapIn`: zichtbaar onvertaald
 * is beter dan een bladzijde die omvalt.
 */
export const encdeelIn = (taal: string, basis: Deel): Deel => {
  const vertaald = DEEL_VERTALINGEN[taal]?.[basis.id]
  if (!vertaald) return basis
  return { ...basis, titel: vertaald.titel, periode: vertaald.periode, omvat: vertaald.omvat }
}
