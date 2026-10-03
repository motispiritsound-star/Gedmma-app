# Marokko 360° — redactionele opzet

Een feitelijke, door bronnen onderbouwde digitale encyclopedie over de
geschiedenis van Marokko, in vijftien delen, gevolgd door twee delen over
al-Andalus. Voor lezers van ongeveer twaalf jaar tot volwassen.

Dit is **niet** *De sleutels van Marokko*. Die reeks is fictie met een waar
decor: verzonnen hoofdpersonen, echte gebeurtenissen, en achterin een bladzijde
die uitlegt wat echt gebeurd is. Marokko 360° is het omgekeerde: alleen wat
controleerbaar is, met de bron erbij. De twee reeksen staan los van elkaar, ze
delen geen bladzijden, en ze verwijzen hoogstens naar elkaar.

## 1. De naam

De werktitel is **Marokko 360° — De historische encyclopedie van Marokko**. Die
is niet stilzwijgend gewijzigd; in de code heet de reeks nog zo.

**Voorstel: laat de "360°" vallen en noem de reeks *De geschiedenis van
Marokko*.** Drie redenen:

1. **Zoekverkeer.** In `make-site.mjs` staat al de vaststelling dat wie zoekt op
   "geschiedenis van Marokko voor kinderen" vrijwel niets vindt. Dat is precies
   de zoekterm die deze reeks zou moeten winnen, en "360°" komt in geen enkele
   zoekopdracht voor.
2. **Zes talen.** "360°" is in het Nederlands een beeldspraak uit de
   marketingtaal. In het Frans, Spaans, Italiaans en Arabisch leest het eerder
   als een camerabegrip. Een reekstitel die in één taal werkt, werkt niet.
3. **Het dateert.** "360°" is de taal van een bepaald jaar. Een encyclopedie
   hoort over tien jaar nog te kunnen heten zoals ze heet.

Wat "360°" wil zeggen — dat het niet alleen over dynastieën gaat maar ook over
regio's, talen en het dagelijks leven — staat beter in de ondertitel en in de
delen 13 tot en met 15 zelf.

**De beslissing is aan de eigenaar.** Tot die genomen is blijft de werktitel
staan.

## 2. Bronnenhiërarchie

In deze volgorde, en een lagere trede kan een hogere niet vervangen:

| Trede | Wat | Waarvoor |
|---|---|---|
| **primair** | inscriptie, document, kaart, kroniek, opgravingsverslag | de bewering zelf, met de beperkingen van de bron erbij |
| **academisch** | peer-reviewed artikel, wetenschappelijke monografie | de bewering, en de stand van het onderzoek |
| **erfgoed** | universiteit, archief, museum, UNESCO-dossier | wat beschermd is, waar iets ligt, in welke staat |
| **naslag** | encyclopedie, handboek, overzichtswerk | een bron *vinden*, nooit een bewering dragen |

Zoekmachines, Wikipedia, blogs en sociale media staan niet in deze tabel. Ze
mogen gebruikt worden om te ontdekken dát een bron bestaat. Daarna moet die bron
zelf open.

Talen: Arabisch, Amazigh, Frans, Engels en Spaans waar het onderwerp daarom
vraagt. Een geschiedenis van Marokko die alleen uit Franse en Engelse bronnen is
opgebouwd, heeft een blinde vlek die je niet ziet zolang je er niet naar zoekt.

## 3. De regel die alles draagt

Een hoofdstuk bestaat uit blokken. Een blok dat iets beweert, draagt bron-id's
en een zekerheid. Verbindende tekst beweert niets nieuws.

Een hoofdstuk mag pas op de openbare site als:

1. elk feitelijk blok naar minstens één bron wijst;
2. die bronnen in het register staan;
3. per blok minstens één bron de stand **gelezen** heeft;
4. een betwiste bewering zegt waaróver de discussie gaat;
5. de tijdlijn onder dezelfde regels valt — een jaartal is een bewering;
6. er een "wat weten we zeker en waarover bestaat discussie" is;
7. en de stand van het hoofdstuk op `gepubliceerd` staat.

Dit staat in `src/content/encyclopedie/index.ts` en wordt afgedwongen door
`encyclopedie.test.ts`. Niet omdat niemand te vertrouwen is, maar omdat een
reeks van vijftien delen altijd ergens half staat, en half werk anders vanzelf
op de site belandt.

Een hoofdstuk verschijnt alleen in een taal die het werkelijk heeft. Geen
terugval op het Nederlands.

## 4. Vast hoofdstukformat

1. een korte, feitelijke verhalende opening;
2. "in het kort";
3. plaats en periode;
4. de context en het verhaal;
5. belangrijke personen, plaatsen en begrippen;
6. een tijdlijn met gecontroleerde data of een duidelijke marge;
7. een kaart of locatie, alleen als die iets toevoegt;
8. een controleerbaar weetje;
9. "wat weten we zeker en waarover bestaat discussie?";
10. bronnen en verder lezen;
11. verwante hoofdstukken.

Leesniveaus (*kort uitgelegd*, *lees het verhaal*, *verdieping*) zijn een
uitbreiding van het blokmodel en nog niet gebouwd.

## 5. Twee plekken waar ik anders indeel dan de opdracht

**Deel 7.** De opdracht noemt dit "de politieke en regionale veranderingen van
de late middeleeuwen en vroege moderne tijd". Dat is een lege titel voor een
periode waarin juist één ding alles bepaalt: wie de havens beheerst. Het deel
heet daarom *Een eeuw van breuken: kusten, havens en nieuwe machten*, en de
Portugese en Spaanse vestigingen zijn er de ruggengraat van in plaats van een
voetnoot.

**Al-Andalus, de verdeling over twee delen.** De opdracht vraagt twee delen. De
verdeling die nu in de code staat (deel 1 begrip en wording, deel 2 steden,
kennis en gemeenschappen) is een werkverdeling, geen historische. Welke
gebeurtenis de delen scheidt, hoort uit het onderzoek te komen. Dat staat zo in
`delen.ts` en moet daar blijven staan tot het beantwoord is.

## 6. Wat historisch niet mag

- Geen verzonnen citaten, dialogen, gedachten of personages.
- Geen moderne staten, grenzen of identiteiten die op elke periode worden
  teruggeprojecteerd.
- Geen misleidend precieze kaarten en tijdlijnen: waar een grens of datering
  onzeker is, staat dat erbij. `Moment.wanneer` is daarom tekst en
  `Moment.jaar` alleen een sorteersleutel.
- Geen lange overgenomen passages, en geen beeld zonder licentie die hergebruik
  toestaat. Bij elk beeld: bron, maker, licentie.

## 7. Stand van zaken

Zie `docs/MAROKKO360_BRONNEN.md` voor waarom er op dit moment nul bronnen
gelezen zijn en dus nul hoofdstukken publiceerbaar.
