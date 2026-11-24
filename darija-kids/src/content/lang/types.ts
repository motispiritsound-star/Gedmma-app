/**
 * Everything a learner reads, in one language.
 *
 * The Arabic script and the Latin spelling of Darija never change, so a pack
 * only carries what is written in the learner's own language: the meanings,
 * the usage notes, the titles on the path and the stories.
 */
export interface ContentPack {
  /** Word id → meaning. Dutch and English live in words.ts instead. */
  meanings: Record<string, string>
  /** Word id → the short usage note under a new word. */
  notes: Record<string, string>
  /** Sentence id → the sentence in this language. */
  sentences: Record<string, string>
  /** Unit id → the line under the unit's Darija name. */
  units: Record<string, string>
  /**
   * Letter id → hoe die letter klinkt, in de taal van de lezer.
   *
   * Dit was het laatste stuk inhoud dat in het Nederlands bleef staan, en het
   * was zichtbaar: op 24 november stond in de Fránse app onder een letter
   * *"Se prononce : aa, zoals in “maan”"*. Het alfabetscherm is de tweede
   * schermafbeelding in beide winkels, dus het stond ook op de Franse
   * winkelbladzijde.
   *
   * Dit veld is geen gewone vertaling, en dat is de reden dat het een eigen
   * aantekening krijgt: een klank leg je uit met een woord dat de lezer al
   * kent. *"s van sok"* werkt alleen voor wie weet wat een sok is. In het
   * Frans hoort daar een Frans woord te staan — niet de vertaling van "sok".
   *
   * En een vergelijking die in de ene taal werkt, bestaat in de andere niet:
   * de `kha` is in het Nederlands *"ch van lachen"*, maar het Frans heeft die
   * klank niet en moet hem omschrijven. De `ghayn` is in het Nederlands
   * *"zoals de Franse r"* — een zin die in het Frans niets uitlegt.
   */
  /*
   * Optioneel in het type, verplicht in de toets.
   *
   * Het type kan niet eisen dat er achtentwintig bij naam in staan -- het ziet
   * een `Record<string, string>` en is tevreden met een lege. Dat kán
   * `lettersvertaald.test.ts` wel, en die eist het ook. Verplicht maken hier
   * zou dus geen echte zekerheid toevoegen, en het zou wel betekenen dat de
   * bundel niet bouwt zolang een taal nog aan het vertalen is. Deze tak
   * deployt de website bij elke push.
   */
  letters?: Record<string, string>
  /** Lesson id → its title. The key `toets` covers every checkpoint. */
  lessons: Record<string, string>
  /** Lesson id → the tip shown once before that lesson. */
  tips: Record<string, { title: string; body: string }>
  /**
   * History card id → the pieces of text on it.
   *
   * `jaar` only where the year is a word rather than a number: "11e eeuw" has
   * to be translated, "1777" does not.
   */
  history: Record<string, { titel: string; body: string; wist: string; jaar?: string }>
  stories: Record<string, {
    title: string
    intro: string
    /** One per line of the dialogue, in order. */
    lines: string[]
    quiz: { q: string; options: string[] }[]
  }>
}
