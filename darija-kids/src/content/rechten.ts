/**
 * De rechtenregel achterin elk boek.
 *
 * Twee dingen, en niet meer. Een regel die zegt van wie het is, en een zin
 * die vraagt het niet door te geven.
 *
 * Wat hier met opzet níet staat is een boetebedrag. Dat leest als een
 * dreigement in een boek voor kinderen, en het werkt ook niet: een boete in
 * de kleine lettertjes van een consumentenkoop is in de Europese Unie een
 * oneerlijk beding en daar staat een rechter niet bij stil. Wie het toch
 * doorstuurt, stuurt het door — daar helpt geen som tegen.
 *
 * Wat wél helpt staat in de laatste zin: vraag om de link in plaats van de
 * kopie. Dat is het enige verzoek waar iemand gehoor aan kan geven zonder
 * zich een dief te voelen, en het is meteen het verzoek waar wij iets aan
 * hebben.
 */
export const RECHTEN: Record<string, { regel: string; zin: string }> = {
  nl: {
    regel: 'Alle rechten voorbehouden.',
    zin: 'Dit boek is gekocht voor één gezin. Kopiëren of verder verspreiden mag niet — niet op school, niet in een groepsapp, niet op een website. Wil iemand het ook lezen, stuur hem dan de link; daar kunnen wij van verder.',
  },
  fr: {
    regel: 'Tous droits réservés.',
    zin: 'Ce livre a été acheté pour une seule famille. Le copier ou le diffuser n’est pas autorisé — ni à l’école, ni dans un groupe de discussion, ni sur un site. Si quelqu’un veut le lire aussi, envoyez-lui le lien ; c’est ce qui nous permet de continuer.',
  },
  de: {
    regel: 'Alle Rechte vorbehalten.',
    zin: 'Dieses Buch wurde für eine Familie gekauft. Es zu kopieren oder weiterzugeben ist nicht erlaubt — nicht in der Schule, nicht in einem Gruppenchat, nicht auf einer Website. Möchte jemand es auch lesen, schick ihm den Link; davon können wir weitermachen.',
  },
  es: {
    regel: 'Todos los derechos reservados.',
    zin: 'Este libro se compró para una sola familia. Copiarlo o difundirlo no está permitido: ni en la escuela, ni en un grupo de mensajes, ni en una web. Si alguien más quiere leerlo, envíale el enlace; eso es lo que nos permite seguir.',
  },
  it: {
    regel: 'Tutti i diritti riservati.',
    zin: 'Questo libro è stato comprato per una sola famiglia. Copiarlo o diffonderlo non è consentito: né a scuola, né in un gruppo di messaggi, né su un sito. Se qualcuno vuole leggerlo, mandagli il link; è quello che ci permette di continuare.',
  },
  en: {
    regel: 'All rights reserved.',
    zin: 'This book was bought for one family. Copying or sharing it is not allowed — not at school, not in a group chat, not on a website. If someone else would like to read it, send them the link; that is what keeps this going.',
  },
}

/** Het jaar waarin de reeks is uitgegeven; één plek, zodat het nergens anders verjaart. */
export const RECHTEN_JAAR = 2026

/** De twee regels achter elkaar, klaar om af te drukken. */
export const rechtenVan = (taal: string): { kop: string; zin: string } => {
  const r = RECHTEN[taal] ?? RECHTEN.nl!
  return {
    kop: `© ${RECHTEN_JAAR} Venship · darijaforkids.eu · KvK 77780868 · ${r.regel}`,
    zin: r.zin,
  }
}
