# Leerstof toevoegen of corrigeren

Alle leerstof staat in `src/content/`. Er is geen database en geen CMS: het zijn
getypte lijsten, zodat een fout een compileerfout is en niet iets dat een kind
later tegenkomt.

## Een woord toevoegen

`src/content/words.ts` is één lijst. Elke regel is één woord of één zin:

```ts
w('khobz', 'خبز', 'khobz', 'brood', 'bread', 'eten', '🍞', 'In Marokko eet je bijna alles met khobz.'),
//  id      schrift  latijn   nl       en       thema   emoji  uitleg (optioneel)
```

Regels die gelden:

- **Het id verandert nooit.** De voortgang en de herhaalkaartjes van elke
  leerling hangen eraan. Een woord hernoemen betekent dat kinderen hun
  voortgang op dat woord kwijt zijn.
- **Het schrift is verplicht** en moet echt Arabisch schrift zijn; de test
  controleert dat.
- **De Latijnse schrijfwijze** gebruikt de cijfers die Marokkanen zelf typen:
  3 = ع, 7 = ح, 9 = ق, en verder kh = خ, gh = غ, sh = ش.
- **Een hele zin** krijgt `true` als laatste argument. Zinnen worden geoefend
  met het woordenbankje in plaats van met typen.
- **De uitleg is voor een kind**, niet voor een taalkundige. Eén zin, concreet,
  liefst iets dat je kunt gebruiken.

## Een zin toevoegen

`src/content/sentences.ts` hangt zinnen aan een les-id. Elke les krijgt er twee;
ze komen aan het eind van de ronde, nadat de losse woorden geoefend zijn.

```ts
'eten-1': [
  S('eten-1-a', 'بغيت أتاي بالسكر عافاك', 'bghit atay b ssokkar 3afak',
    'Ik wil thee met suiker, alsjeblieft.', 'I would like tea with sugar, please.'),
],
```

Regels die gelden:

- **Het id begint met het les-id.** De les pakt zijn zinnen automatisch op; je
  hoeft `curriculum.ts` niet aan te raken.
- **Het Arabisch plakt de voorzetsels vast** zoals Marokkanen ze typen:
  وبسلامة, بالسكر, فالدار. De Latijnse schrijfwijze houdt ze juist los, want
  daar wordt het woordenbankje uit geknipt.
- **De uitspraak gaat per woord.** Staat er een woord in dat de stem verkeerd
  leest, zet het dan in `SPOKEN_WORD` in `src/content/pronunciation.ts` — één
  keer, en elke zin waarin het voorkomt klinkt meteen goed.
- **Frans, Duits en Spaans** komen uit `src/content/lang/*.ts`, sleutel
  `sentences`. Een ontbrekende vertaling is een testfout.

## Een letter aanpassen

`src/content/alphabet.ts` bevat de 31 letters met hun begin-, midden- en
eindvorm, en `LETTER_GROUPS` bepaalt in welke lessen ze vallen — gegroepeerd op
skelet, want ب ت ث verschillen alleen in puntjes. De unit *Lhruf* wordt daar
automatisch uit gebouwd; de tips staan in `curriculum.ts`.

## Een les of unit toevoegen

`src/content/curriculum.ts`. Een unit is een lijst lessen, en de toets aan het
eind wordt automatisch samengesteld uit alles wat de unit leerde — die hoef je
dus niet bij te houden.

```ts
unit('eten', 'الماكلة', 'Lmakla', 'Eten, drinken en thee', '🍽️', 'A1', 'saffron', [
  { title: 'Op tafel', words: ['khobz', 'lma', 'atay'], tip: { title: '…', body: '…' } },
])
```

Een les heeft drie tot een stuk of negen woorden. Meer maakt de ronde te lang;
de generator kapt af op veertien oefeningen en dan komt niet alles aan bod.

Een `tip` verschijnt eenmalig voordat de les begint. Gebruik hem voor de
grammatica die op dat moment nodig is (de ka- van *kanakol*, het `ma … sh` van
*ma fhemtsh*), niet voor een verhaal over de taal in het algemeen.

## Verhalen en letters

`src/content/stories.ts` en `src/content/alphabet.ts` werken hetzelfde: getypte
lijsten, met een test die controleert dat elke regel vertaald is, dat elke
quizvraag een antwoord heeft dat bestaat, en dat elk voorbeeldwoord bij een
letter ook echt in het woordenboek staat.

## Controleren

```bash
npm test
```

De inhoudstests controleren onder andere: geen dubbele ids, elk woord heeft
schrift én beide vertalingen, elke les wijst naar bestaande woorden, elke toets
dekt precies zijn unit, en het leerpad behandelt minstens 90% van het
woordenboek.
