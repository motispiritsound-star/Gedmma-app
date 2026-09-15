# 21 — Kanaal 2: lage drempel, en publiceren zonder dat jij erbij hoeft

Status: gebouwd en getest.
Datum: 2026-09-15.

## De vraag

> "begin eerst met een laagdrempelig low budget kanaal met simpele productie
> die wel geld in het laatje brengt waarbij deze regel niet nodig is"

Met die regel: *publiceer niets zonder mijn expliciete toestemming*.

Dat kan, en het kanaal dat je zoekt stond al bovenaan je eigen lijst. Maar de
reden dát het kan is belangrijker dan de uitkomst, dus die eerst.

## Waarom die regel bij het ene kanaal wel moet en bij het andere niet

De goedkeuringsstap bestaat niet omdat toestemming op zichzelf goed is. Hij
bestaat om te voorkomen dat een fout die niemand heeft gezien onomkeerbaar naar
buiten gaat.

Hoe erg dat is, hangt af van het soort fout dat je kúnt maken:

| | Ergste geval | Kan software dit controleren? |
|---|---|---|
| Een overlevering verkeerd graderen | je misleidt mensen over hun geloof | nee — dit is een oordeel |
| Een medisch advies dat niet klopt | iemand doet iets schadelijks | nee |
| Een getal uit een CBS-tabel verkeerd overnemen | je hebt je vergist | **ja** |

Bij de eerste twee moet er een mens kijken, en daar verandert geen enkele
instelling iets aan. Bij de derde is de controle mechanisch: staat het getal in
het script hetzelfde als in de bron waarnaar het verwijst? Dat kan een machine,
en beter dan een mens die het voor de vijftiende week op rij nakijkt.

**Je regel is dus niet overbodig geworden. Hij is niet van toepassing op een
kanaal dat alleen rekent en niet duidt.**

## Het kanaal: Hoe Nederland werkt

Score **86/100** — de hoogste van alle kandidaten, en dat was al zo voordat je
deze vraag stelde (zie `docs/17`).

Waarom het past bij wat je vraagt:

- **Laag budget.** Het beeld is diagrammen, doorsneden en kaarten. Geen
  generatieve video, en dat is de post die dit project duur maakt (`docs/06`).
  Per video blijven Claude en de stem over: enkele euro's, geen tientallen.
- **Simpele productie.** Eén mechanisme per video, één tekening die het draagt.
- **Controleerbaar.** Rijkswaterstaat, TenneT, ProRail, CBS, de waterschappen en
  de drinkwaterbedrijven publiceren alles gratis en in detail. Elke claim is een
  getal met een vindplaats.
- **Nul beleidsrisico.** Geen gevoelige categorie, geen auteursrechtrisico, geen
  onderwerp waarop geautomatiseerde kanalen worden beëindigd.
- **Raakt nooit op.** Sluizen, hoogspanning, spoor, zeekabels, drinkwater,
  dijken, gemalen, het frequentiespectrum.

Eerlijk over de zwakte, want die is er: **de advertentiewaarde is laag.** Dit is
geen premiumcategorie zoals financiën of zakelijke software. Het verdient aan
volume en aan een archief dat blijft draaien, niet aan een hoge RPM. En de
drempel van YouTube zelf blijft staan — abonnees en kijkuren moet je nog steeds
halen, en dat gaat bij geen enkel kanaal snel.

De wachtrij staat klaar in `content/wachtrij-nederland.yaml`, met zes
afleveringen.

## Publiceren zonder dat jij erbij hoeft

Er zijn nu drie standen, in `.env`:

```bash
PUBLISH_MODE=handmatig     # privé op je kanaal; jij maakt hem openbaar
PUBLISH_MODE=uitgesteld    # gaat na PUBLISH_DELAY_HOURS vanzelf openbaar
PUBLISH_MODE=direct        # meteen openbaar
```

**Mijn advies is `uitgesteld` met 24 uur**, en niet `direct`. Het verschil kost
je niets in werk: bij allebei hoef je niets te doen om een video online te
krijgen. Het verschil is dat je bij uitgesteld een dag hebt waarin je hem nog
kunt tegenhouden — in YouTube Studio terugzetten op privé, klaar.

Dat is nog steeds toestemming. Alleen andersom: je geeft hem door niet in te
grijpen in plaats van door te tekenen. Wat je overhoudt is de pauzeknop, en dat
is het enige deel van de regel dat er werkelijk toe doet.

`direct` bestaat en je mag hem zetten. Maar dan is er geen weg terug, en de
winst is een dag sneller online zijn.

### De grendel

```bash
CLAIM_PROFILE=controleerbaar   # alleen dan mag uitgesteld of direct
CLAIM_PROFILE=oordeel          # alles blijft handmatig
```

Bij `oordeel` valt elke andere stand terug op handmatig. Dat staat in code, in
`src/domain/publicatie.ts`, en is niet met een instelling te omzeilen — een
verkeerde regel in `.env` mag je kanaal niet kosten. Vergeten in te vullen
betekent `oordeel`: veilig, niet snel.

Voor je islamitische kanaal blijft het dus handmatig, hoe je `PUBLISH_MODE` ook
zet. Dat is geen inconsistentie maar het hele punt.

### Waar de grens ligt bij kanaal 2

Zodra een aflevering gaat **duiden** in plaats van **rekenen** — waarom het
beleid verkeerd is, wie schuld heeft, wat er zou moeten gebeuren — hoort hij niet
meer onder `controleerbaar`. Dan zet je hem terug op handmatig voor die video.
Dat is jouw beoordeling, en het is de enige plek in dit kanaal waar die nodig is.

## Zo begin je

```bash
git pull
npm run wachtrij -- --bestand content/wachtrij-nederland.yaml
```

En in `.env`:

```bash
PUBLISH_MODE=uitgesteld
PUBLISH_DELAY_HOURS=24
CLAIM_PROFILE=controleerbaar
```

Let op: dat zijn instellingen voor je hele installatie, niet per kanaal. Draai je
beide kanalen vanaf dezelfde computer, zet `CLAIM_PROFILE` dan op `oordeel` en
haal hem alleen omhoog op het moment dat je kanaal 2 uploadt. Anders staat de
grendel open terwijl je aan het verkeerde kanaal werkt.

## Wat ik je nog steeds zou aanraden

Laat video 1 van kanaal 1 niet liggen. Hij staat op één ding te wachten: je
reviewer. Dat kost jou geen minuut en geen euro, en het is het enige wat er nog
tussen jou en je eerste gepubliceerde video staat.
