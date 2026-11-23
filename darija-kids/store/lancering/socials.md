# De socials op de lanceringsdag

Vier berichten voor vier kanalen. Te plakken zoals het staat.

**Nagekeken op 23 november: de lanceringsdag waarvoor dit geschreven is, is
voorbij.** Hier stond *"op de dag dat 1.4 in allebei de winkels staat — App
Store build 10, Play versiecode 8"*. Volgens `docs/STAND.md` (*24 oktober:
build 11 ligt bij Apple*) staat **1.5 — bij Apple build 11, bij Play
versiecode 10 — sinds 24 oktober in allebei de winkels**, 100% uitgerold. Alle
vier de berichten openen met *"Hij staat er … vanaf vandaag te downloaden"*, en
dat is niet waar. Dat is een besluit en geen redactiewerk: zie het eerste punt
onder *Vóór je plaatst*.

Het bericht voor het WhatsApp-kanaal staat apart, in
`store/lancering/kanaal.md`. Dit zijn Instagram, TikTok, YouTube en Facebook.

**Wat hieronder over geld staat, is van 23 november.** Er zijn geen gratis
lessen meer en geen proefperiode: de app is gratis te downloaden, de cursus is
een abonnement, en dat wordt op het eerste scherm gevraagd. Op het jaar loopt
een tijdelijke actie van 50%. De onderbouwing staat boven `magLeren` in
`src/engine/store.ts`; wat er in de consoles moet staat in `docs/STAND.md`.
Elke regel over geld in dit bestand is daarop nagekeken.

## Waarom niet één bericht, vier keer geplaatst

Dat is de fout die `store/kanaal-socials.md` uitlegt. De kanalen zijn aan de
volgers verkocht met het argument dat elk er iets anders laat zien: de platen
op Instagram, de film op YouTube, de vijftien seconden op TikTok, en Facebook
voor wie daar zit. Vier keer hetzelfde bericht maakt dat argument op de eerste
dag onwaar, en het is de dag waarop de meeste mensen voor het eerst kijken.

Dus krijgt elk kanaal het stuk van de lancering dat daar werkt:

| | Wie er kijkt | Wat het bericht doet |
|---|---|---|
| Instagram | volgt om de platen | de plaat doet het werk, het onderschrift meldt dat hij er is |
| TikTok | wist nog niet dat hij dit wilde | vijftien seconden, één ding: de eerste minuut in de app |
| YouTube | zocht hierop | de titel draagt de zoekwoorden, de beschrijving vertelt het hele verhaal |
| Facebook | leest meer, en is ouder | het langste stuk: waarom, wat het kost, en waar de app zelf aan twijfelt |

**En voor alle vier geldt: niemand hier weet welke versie dit is.** Hier stond
*"1.0 staat sinds 2 oktober stil in de App Store en Play heeft nooit iets
uitgebracht"*; dat is sinds oktober niet meer waar — bij Apple ging 1.4 op
4 oktober live en bij allebei de winkels staat 1.5 sinds 24 oktober
(`docs/STAND.md`). De conclusie verandert er niet door, maar de reden wel: niet
omdat er nooit iets is uitgebracht, maar omdat er bij 149 downloads en 38
Play-installaties bijna niemand zit voor wie dit een wijziging ís. Het
startscherm in vier stappen is dus geen wijziging die je aankondigt, het is
hoe de app begint. `store/wat-is-nieuw-1.4.md` zegt het al: dit is voor bijna
iedereen niet "wat is er nieuw" maar het eerste wat hij van de app ziet. Het
woord "nieuw" staat daarom in geen van de vier berichten.

## Wat er van beeld echt ligt

Alles hieronder is er in het Nederlands én in het Frans. Let op dat geen van
deze paden in git staat — `/brand/`, `/store/marketing/`, `/store/screenshots/`
en `/store/video/` staan alle vier in `.gitignore` — dus "het ligt er" geldt
per machine, en op een verse kloon ligt er niets. Alles komt terug met de
opdrachten onder de tabel; kijk dus eerst of het bestand er werkelijk staat
voor je het in een bericht plant.

| Wat | Waar | Formaat |
|---|---|---|
| De aankondigingsplaat | `store/marketing/nl/social-vierkant.png`, `social-verhaal.png` | 1080×1080 en 1080×1920 |
| De vijf campagneposts | `brand/social/posts/nl/1-oma-vierkant.png` t/m `5-geschiedenis-verhaal.png` | tien bestanden per taal |
| De introfilm | `store/video/nl/intro-breed.mp4` ligt er; `intro-vierkant.mp4` en `intro-verhaal.mp4` komen met `npm run intro` | 16:9, en 1:1 en 9:16 |
| Schermafdrukken | `store/screenshots/nl/iphone-65/1-pad.png` t/m `10-aanbod.png` | tien schermen |
| Profielfoto en omslagen | `brand/social/profielfoto.png`, `banner-youtube-nl.png`, `omslag-facebook-nl.png` | |
| Citaatplaten uit de boeken | `brand/citaten/nl/deel03-h1-vierkant.png` en acht andere | over de reeks, niet over de app |

Terug te maken met `npm run marketing`, `npm run social` (eerst
`npm run preview`), `npm run intro`, `npm run screenshots`, `npm run brand`
en `npm run citaten`.

**Wat er níét ligt: een beeld van het startscherm in vier stappen.** Geen van
de tien schermafdrukken is het, geen van de vijf campagneposts, en geen van de
zeven scènes in de introfilm. Dat is precies het stuk dat TikTok nodig heeft,
en het is met een schermopname op een toestel in tien minuten gemaakt. Verzin
er geen bestand bij.

## Twee dingen die eerst gerepareerd moeten

### 1. De slotkaart van de introfilm: de tekst is om, de opname nog niet

**Nagekeken op 23 november: de helft hiervan is gedaan.** Hier stond dat de
slotkaart twee regels droeg die niet meer konden — `cta` zei in alle zes de
talen *"Gratis beginnen"* ("Commencer gratuitement", "Kostenlos starten",
"Empezar gratis", "Inizia gratis", "Start free") en `price` zei *"Vanaf € 5,00
per maand"*, een omrekening zonder het afgeschreven bedrag ernaast, precies
waarop Apple onder richtlijn 3.1.2(c) heeft afgewezen. Dat is sinds commit
`dca8cd8` niet meer de stand:

| | Wat er nu staat |
|---|---|
| `cta` in `dev/intro-copy.ts` | *Gratis downloaden* — en dat mag, want de app ís gratis te downloaden; alleen de cursus is een abonnement (zie de aantekening boven `magLeren` in `src/engine/store.ts`) |
| `price` in `dev/intro-copy.ts` | *€ 59,99 per jaar · € 5,00 per maand* — het afgeschreven bedrag voorop, de omrekening erachter |
| `src/site/intro.test.ts` | omgedraaid: hij eist nu beide bedragen met het afgeschreven bedrag eerst, en laat een woord voor "gratis" alleen toe in dezelfde adem als downloaden |

Hier stond ook dat die test het oude eiste — *"precies `planOf('jaar').perMonth`,
€ 5,00 en niets anders"* — en dat hij dus mee moest veranderen. Dat is gebeurd.
`docs/STAND.md` zegt het onder *23 november: de films*: **"De promofilm uit de
app mag wel — die is nu waar."**

**Met opzet de staande prijs en niet de actie van € 29,99.** Deze film staat in
git en wordt niet opnieuw gezet als een actie afloopt; de actie hoort op de
plekken die wél meebewegen — de winkelafbeeldingen en de teksten hieronder.

**Wat er nog wél moet: de upload.** De opname zelf is om —
`store/video/<taal>/intro-breed.mp4` is wat `scripts/make-siteassets.mjs` tot
de zes nieuwe `site-assets/film/<taal>/intro.mp4` heeft hercodeerd, dus die
draagt de goede slotkaart. Wat er nog op YouTube staat is de oude. Let op het
staartje: YouTube vervangt het bestand onder een bestaande link niet, dus een
nieuwe opname is een nieuwe link. Die link staat op twee plekken buiten
YouTube:

| Waar | Wat er blijft staan als je hem vergeet |
|---|---|
| `src/site/links.ts`, bij `FILM_YOUTUBE` | `scripts/make-site.mjs` zet hem op de site; die wijst dan nog naar de film met de oude prijskaart |
| Play Console → *Main store listing → Video* | de winkelpagina speelt de oude film |

Play bijwerken doet `npm run play -- --tekst --video` met het adres erachter:
het volledige `https://www.youtube.com/watch?v=` plus de code die YouTube na
de upload geeft. Plak je iets anders, dan weigert
`scripts/play-vermelding.mjs` het met een melding en zet hij geen half adres
in de vermelding.

Voor Instagram en TikTok is het minder erg: de slotkaart begint op 25,2
seconden (`TITLE + 7 × HOLD` in `dev/intro.ts`), dus een fragment van vijftien
seconden komt er niet aan toe.

### 2. Vier beelden zeggen "binnenkort"

`brand/social/binnenkort-vierkant-<taal>.png`,
`brand/social/binnenkort-staand-<taal>.png` en
`brand/reeksplaten/<taal>/app-vierkant.png` en `app-verhaal.png` zijn gemaakt
voor de tijd dat de app nog in beoordeling lag. Op die laatste twee staat
letterlijk "Binnenkort · twee minuten per dag · vanaf 6 jaar". Op de dag dat
hij er staat is dat het verkeerde beeld, en op de vierde regel van een
onderschrift valt dat niemand meer op.

## Waar de links komen

Ze staan in geen enkel plakbaar blok hieronder, om dezelfde reden als in
`store/lancering/kanaal.md`: een blok met een gat erin wordt geplakt mét het
gat. Ze komen erbij op het moment van plaatsen, per kanaal op de plek die dat
kanaal ervoor heeft.

| Kanaal | Waar de link hoort | Waarom daar |
|---|---|---|
| Instagram | het veld *Links* in de bio | een onderschrift maakt geen klikbare link; het onderschrift wijst naar de bio |
| TikTok | het linkveld in de bio | mag alleen bij een zakelijk account, en dat staat al zo (`docs/SOCIAL.md`) |
| YouTube | twee regels onderaan de beschrijving | daar zijn ze klikbaar en blijven ze staan |
| Facebook | twee regels onder de tekst | daar leest de lezer ze als laatste |

De twee adressen, Android eerst — dezelfde volgorde en dezelfde vorm als in
`store/lancering/kanaal.md`:

| De regel die je typt | Wat erachter komt |
|---|---|
| `🤖 Android —` | `play.google.com/store/apps/details?id=app.darijaforkids.learn` — dat is `playStoreUrl()` in `src/site/links.ts` |
| `📱 iPhone en iPad —` | het adres uit `STORE.apple` in `src/site/links.ts`, nu `apps.apple.com/app/id6813964474` |

**Allebei de pagina's staan open.** Hier stond dat een 404 betekende dat de
release nog op jou wachtte; sinds 24 oktober staat 1.5 bij Apple op *Ready for
Distribution* en bij Play op 100% uitgerold (`docs/STAND.md`). Krijg je hier nu
een 404, dan is het het adres en niet de release. Open ze op een toestel
voordat je plaatst, niet op de Mac en niet in een tabblad waar je al ingelogd
bent.

En geen derde bestemming. `darijaforkids.eu` staat al afgedrukt op de platen
en in de YouTube-beschrijving; in de berichten zelf staan twee plekken om
heen te gaan, niet drie.

---

# Instagram

## Welke plaat

**`brand/social/posts/nl/1-oma-vierkant.png`** — "Je kind verstaat oma wel. /
Antwoorden lukt alleen niet." Alle vijf de campagneposts laten een scherm uit
de echte app zien — `scripts/make-social.mjs` fotografeert per post een route:
`/leren`, `/woorden`, `/letters`, `/verhalen`, `/geschiedenis`. Deze is de
enige die opent met de regel waar dit hele project om staat; de andere vier
openen met een getal, een prijs of een functie. Voor een publiek dat de app
vandaag voor het eerst ziet, doet de herkenbare vraag meer dan een merkkaart.

Wil je één plaat die de naam van de app noemt, dan is dat
`store/marketing/nl/social-vierkant.png` — warm, de khatam, "Leer Darija, de
taal van thuis". Als carrousel werken ze samen: eerst de vraag, dan de naam.

In het Frans staan beide bestanden klaar onder `brand/social/posts/fr/` en
`store/marketing/fr/`.

Twee dingen die níét op deze plek horen. `brand/social/binnenkort-vierkant-nl.png`
zegt "binnenkort". En `store/video/nl/intro-vierkant.mp4` is de film, geen
plaat; die kan er de dag erna staan. De prijskaart is inmiddels in orde (zie
hierboven), maar het vierkante bestand zelf moet nog gezet worden met
`npm run intro`.

## Het onderschrift

```
Hij staat er.

Darijaforkids is vanaf vandaag te downloaden, op iPhone en op Android.

Je kind verstaat jeddti wel. Antwoorden lukt alleen niet. Daar begint deze
app. 17 units, van de letters tot afdingen op de souq. 304 woorden, 100
zinnen, 432 opnames — allemaal ingesproken door een Marokkaanse stem, geen
computerstem.

Geen account, niets in te vullen, geen advertenties, en er wordt niets van je
kind verzameld. Hij werkt offline.

De app is gratis te downloaden; de cursus is een abonnement, en na het betalen
staat alles open. Nu de helft van de jaarprijs: € 29,99 voor het eerste jaar
(€ 2,50 per maand) in plaats van € 59,99, met het e-boek erbij. Of € 6,99 per
maand. De actie loopt tot [EINDDATUM]; opzeggen doe je in de winkel zelf.

De twee links staan in de bio.

#darija #marokko #tweedetaal
```

## La légende

```
Elle est là.

Darijaforkids est téléchargeable depuis aujourd'hui, sur iPhone et sur
Android.

Ton enfant comprend jeddti. C'est répondre qui ne vient pas. C'est là que
commence cette application. 17 unités, de l'alphabet jusqu'au marchandage au
souk. 304 mots, 100 phrases, 432 enregistrements — tous dits par une voix
marocaine, aucune voix de synthèse.

Sans compte, rien à remplir, sans publicité, et rien n'est collecté sur ton
enfant. Elle fonctionne hors ligne.

L'application se télécharge gratuitement ; le cours, lui, est un abonnement, et
tout s'ouvre dès le paiement. En ce moment l'année est à moitié prix : 29,99 €
la première année (soit 2,50 € par mois) au lieu de 59,99 €, livre numérique
compris. Ou 6,99 € par mois. Offre valable jusqu'au [EINDDATUM] ; on résilie
dans la boutique elle-même.

Les deux liens sont dans la bio.

#darija #maroc #languematernelle
```

De plaat in het Frans is `brand/social/posts/fr/1-oma-vierkant.png`.

---

# TikTok

Vijftien seconden, en één ding — dat is wat `store/kanaal-socials.md` aan
TikTok heeft toegewezen. Hier is dat ene ding de eerste minuut in de app, en
het is het enige beeld dat vandaag met een schermopname op een toestel te
maken is: geen acteurs, geen oma aan de telefoon.

**Het beeld dat je opneemt:** een verse installatie, de vier stappen
doorlopen, en dan de eerste les. Staand, 9:16. Elke scène blijft drie seconden
staan; dat is dezelfde regel als in `store/kanaal-sleutels.md` en
`docs/VIDEO.md`.

**Let op wat er sinds 23 november tussen stap vier en die eerste les staat: het
abonnementsscherm.** `Poort` in `src/App.tsx` stuurt iedereen zonder
abonnement naar `/volledig`, en het welkomstscherm met de vier stappen komt
dáárvoor — zie de aantekening boven `magLeren` in `src/engine/store.ts`. Op een
verse installatie is dit filmpje dus niet in één doorloop op te nemen: neem het
abonnement (of zet een eerdere aankoop terug) vóór je de laatste drie seconden
opneemt. En knip die kassa er niet tussenuit op een manier die suggereert dat
de les uit zichzelf volgt op het instellen — dat zou met beelden de belofte
doen die hieronder in woorden verboden is.

**De tekst in beeld moet het alleen af kunnen.** De meeste mensen kijken zonder
geluid (`store/kanaal-sleutels.md`), dus de gesproken regels komen er bovenop
en vervangen niets. En geen logo in de eerste drie seconden; die staan ten
dienste van de eerste regel.

| Tijd | Beeld | In beeld | Gesproken |
|---|---|---|---|
| 0:00–0:03 | De app opent. De talenlijst, een vinger kiest Nederlands. | Je kind verstaat jeddti. Antwoorden lukt alleen niet. | "Je kind verstaat jeddti wel. Antwoorden lukt alleen niet." |
| 0:03–0:06 | Stap twee: een naam getypt, een dier aangetikt. | Een naam. Een dier. | "Dus begint het hier. Een naam, een dier." |
| 0:06–0:09 | Stap drie: de drie manieren van meelezen, één wordt gekozen. | Arabisch schrift, de klanken, of allebei. | "Hoe hij meeleest: het Arabische schrift, de klanken in ons eigen alfabet, of allebei." |
| 0:09–0:12 | Stap vier: een kleur aangetikt. De knop en de voortgangsbalk kleuren mee. | Zijn kleur, op zijn knoppen. | "En een kleur. Die zit daarna op zijn knoppen en op zijn voortgang." |
| 0:12–0:15 | De eerste les. Een woord in Arabisch schrift, de stem zegt het. | Darijaforkids · Nu € 29,99 het eerste jaar | "Dan beginnen de lessen. Nu het eerste jaar voor de helft: € 29,99." |

Het enige geluid naast de stem is het woord dat de app zelf uitspreekt. Dat is
een opname van een Marokkaanse stem, en het is het enige in dit filmpje dat
een ander niet in een middag namaakt.

Onder de video:

```
De eerste minuut in Darijaforkids. Vanaf vandaag te downloaden, op iPhone en
op Android — de link staat in de bio.

#darija #marokko #darijaforkids
```

## Quinze secondes

Zelfde opname, Franse tekst in beeld.

| Temps | Image | À l'écran | Dit à voix haute |
|---|---|---|---|
| 0:00–0:03 | L'application s'ouvre. La liste des langues, un doigt choisit le français. | Ton enfant comprend jeddti. C'est répondre qui ne vient pas. | « Ton enfant comprend jeddti. C'est répondre qui ne vient pas. » |
| 0:03–0:06 | Étape deux : un prénom tapé, un animal choisi. | Un prénom. Un animal. | « Alors ça commence ici. Un prénom, un animal. » |
| 0:06–0:09 | Étape trois : les trois façons de lire, une est choisie. | L'écriture arabe, les sons, ou les deux. | « Comment il lit : l'écriture arabe, les sons dans notre alphabet, ou les deux. » |
| 0:09–0:12 | Étape quatre : une couleur choisie. Le bouton et la barre de progression se colorent. | Sa couleur, sur ses boutons. | « Et une couleur. Elle sera ensuite sur ses boutons et sur sa progression. » |
| 0:12–0:15 | La première leçon. Un mot en écriture arabe, la voix le dit. | Darijaforkids · 29,99 € la première année | « Puis les leçons commencent. En ce moment, la première année est à moitié prix : 29,99 €. » |

```
La première minute dans Darijaforkids. Téléchargeable depuis aujourd'hui, sur
iPhone et sur Android — le lien est dans la bio.

#darija #maroc #darijaforkids
```

---

# YouTube

De video is `store/video/nl/intro-breed.mp4`, nu geüpload als
`youtube.com/watch?v=3iHXGpubnaI` en op *Niet vermeld*. Hier stond dat de
prijskaart eerst gerepareerd moest worden; dat is gebeurd (zie hierboven). Wat
er nog moet is de nieuwe opname uploaden — de film onder die link is nog de
oude — en daarna op openbaar zetten.

De film laat zeven schermen uit de echte app zien en niet het startscherm in
vier stappen; die scène bestaat nog niet. De beschrijving beschrijft dus de
app, en zegt nergens "zoals je in de film ziet".

## De titel

```
Darija leren voor kinderen: Marokkaans-Arabisch — Darijaforkids
```

De zoekwoorden staan vooraan en de merknaam achteraan, om dezelfde reden als
bij het naamveld in `docs/SOCIAL.md`: YouTube zoekt hierop, en de merknaam
staat al in de kanaalnaam. *Darija* en *Marokkaans-Arabisch* staan er beide,
want er wordt op beide gezocht en de helft van de ouders weet niet dat het
hetzelfde is.

## De beschrijving

De eerste twee regels zijn wat iemand in de zoekresultaten ziet, dus daar
staat waar de app voor is en niet dat hij vandaag uitkomt.

```
Darijaforkids leert kinderen Darija: het Marokkaans-Arabisch dat mensen in
Marokko thuis en op straat spreken. Niet het Standaardarabisch uit een
schoolboek, maar de taal waarin je met jeddi en jeddti belt.

Vanaf vandaag te downloaden, in allebei de winkels. De links staan onderaan.

HOE HET BEGINT
Je kiest in vier stappen wie je bent. Een naam, een dier, hoe je meeleest — in
Arabisch schrift, in de klanken van ons eigen alfabet, of allebei — en een
kleur. Die kleur zit daarna op je knoppen, op je voortgang en om je avatar.
Daarna beginnen de lessen.

WAT ERACHTER LIGT
• 17 units, van de letters tot afdingen op de souq
• 304 woorden en 100 zinnen
• 432 opnames, allemaal ingesproken door een Marokkaanse stem — geen
  computerstem
• Geen account, geen advertenties, geen trackers. Er gaat niets naar een
  server
• Werkt offline

De uitleg staat in zes talen: Nederlands, Frans, Duits, Spaans, Italiaans en
Engels.

WAT HET KOST
De app is gratis te downloaden; de cursus is een abonnement, en dat wordt op
het eerste scherm gevraagd. Na het betalen staat alles in één keer open.
€ 59,99 per jaar met het e-boek erbij, of € 6,99 per maand. Nu de helft van de
jaarprijs: € 29,99 voor het eerste jaar (€ 2,50 per maand), tot [EINDDATUM].
Opzeggen doe je in de winkel zelf.

darijaforkids.eu
info@darijaforkids.eu

#darija #marokko
```

Geen kapittels: de film duurt een halve minuut. Geen Franse variant: op
YouTube staat per taal een eigen opname (`store/video/fr/intro-breed.mp4`) en
die krijgt zijn eigen titel en beschrijving in het Frans — dat is een tweede
upload, niet een tweede onderschrift.

---

# Facebook

Het langste van de vier. Hier zitten de ooms en tantes die geen kanalen volgen
en die wel doorlezen, en hier kan iemand reageren. Dat is de plek om de dingen
te zeggen die elders niet passen: waarom de app bestaat, wat er per winkel
anders is, en waar de app zelf een voorbehoud maakt.

Dit is het bericht voor de **pagina**. Voor een bericht in een ouder- of
familiegroep staat er al een in `store/social.md` — persoonlijk, met "ik" erin,
en met de weg erheen in `docs/LANCERING.md` §7. Die twee verschillen met opzet
en moeten niet door elkaar lopen.

```
Hij staat er. Darijaforkids is vanaf vandaag te downloaden, op iPhone en op
Android. De links staan onder dit bericht.

WAAR HET OVER GAAT
Een taal verdwijnt in één generatie. Het kind verstaat jeddti nog wel, maar
antwoordt in het Nederlands, en dan vertaalt de ouder. Darijaforkids leert
kinderen Darija — het Marokkaans-Arabisch dat mensen in Marokko thuis en op
straat spreken, niet het Standaardarabisch uit een schoolboek.

WAT JE OPENT
Eerst vier stappen: een naam, een dier, hoe je meeleest — in Arabisch schrift,
in de klanken van ons eigen alfabet, of allebei — en een kleur. Die kleur zit
daarna op je knoppen, op je voortgang en om je avatar. Daarna beginnen de
lessen.

WAT ERACHTER LIGT
17 units, van de letters tot afdingen op de souq. 304 woorden en 100 zinnen.
432 opnames, allemaal ingesproken door een Marokkaanse stem, geen
computerstem. De uitleg staat in zes talen: Nederlands, Frans, Duits, Spaans,
Italiaans en Engels, dus ook voor de neefjes en nichtjes over de grens.

WAT EEN KIND HIER NIET DOET
Er is geen account en er is niets in te vullen. Geen advertenties, geen
trackers. Alles blijft op het toestel; er gaat niets naar een server. De app
werkt offline, ook in het vliegtuig en in Marokko.

WAT HET KOST
De app is gratis te downloaden. De cursus is een abonnement, en dat wordt op
het eerste scherm gevraagd; na het betalen staat alles in één keer open, geen
porties. € 59,99 per jaar met het e-boek erbij, of € 6,99 per maand.

En nu de helft van de jaarprijs: € 29,99 voor het eerste jaar (€ 2,50 per
maand) in plaats van € 59,99. Tijdelijk, tot [EINDDATUM]. Opzeggen doe je in
de winkel zelf. Bij Apple deelt het hele gezin één abonnement, tot zes
personen. Bij Google niet.

EERLIJK OVER DE TAAL
Darija verschilt per stad en per familie en heeft geen officiële spelling. De
app kiest de vorm die je in Casablanca en Rabat het meest hoort. Zegt jouw oma
het anders, dan heeft jouw oma gelijk — dat zegt de app zelf ook.
```

Het beeld eronder: `store/marketing/nl/social-vierkant.png`, of
`store/video/nl/intro-vierkant.mp4` zodra dat bestand gezet is — de slotkaart
is al in orde, maar van de vier vormen staat alleen `intro-breed` er; de
vierkante komt met `npm run intro`.

Geen hashtags. Op Facebook doen ze niets, en vijf woorden met een hekje
ervoor onder een bericht van een pagina lezen als een advertentie.

---

# De hashtags

Hoogstens drie, en alleen waar ze iets doen.

| Kanaal | Welke | Waarom |
|---|---|---|
| Instagram nl | `#darija #marokko #tweedetaal` | de drie uit `store/social.md`: woorden die een ouder zelf zou typen |
| Instagram fr | `#darija #maroc #languematernelle` | hetzelfde, in de taal van de lezer |
| TikTok | `#darija #marokko #darijaforkids` | hier zoekt men op onderwerp, en de merknaam maakt de reeks terugvindbaar |
| YouTube | `#darija #marokko` | de eerste twee staan boven de titel; meer verdringt de titel zelf |
| Facebook | geen | ze doen daar niets |

`#darijaforkids` verdient zijn plek alleen op TikTok: daar komt elke dag iets
bij, en dan is één woord waaronder dat bij elkaar staat nuttig. Op Instagram
en Facebook staat de naam al in het account.

# Wat er niet in staat, en waarom

- **Geen aantal.** Geen volgers, geen downloads, geen recensies, geen sterren.
  Hier stond dat die er niet zijn; dat is sinds oktober niet meer waar —
  `docs/STAND.md` telt 149 downloads bij Apple, 38 installaties bij Play en
  vijf betaalde plannen. Het besluit blijft, want dat zijn geen getallen
  waarmee je iemand overhaalt, en recensies en sterren zijn er inderdaad niet.
  De beoordeling vraag je op dag 3 (`docs/GO-LIVE.md`, *De dagen erna*).
- **Geen citaat van een ouder en geen kind dat iets tegen zijn oma zegt.** Dat
  is de sterkste post die dit project kan hebben, en hij is vandaag onmogelijk
  echt te hebben. Dag 7, met een ouder die het zelf opstuurt.
- **Geen omrekening per maand die alleen staat.** € 5,00 is € 59,99 gedeeld
  door twaalf en € 2,50 is € 29,99 gedeeld door twaalf, en zo'n omrekening is
  precies waarop Apple 1.0 afwees onder richtlijn 3.1.2(c). Hierboven staat ze
  daarom nooit als eerste getal, maar tussen haakjes achter het bedrag dat
  werkelijk wordt afgeschreven: "€ 29,99 voor het eerste jaar (€ 2,50 per
  maand)". Om diezelfde reden is de slotkaart van de introfilm op 23 november
  omgezet: daar stond de omrekening alleen, en er staat nu *€ 59,99 per jaar ·
  € 5,00 per maand* — zie hierboven.
- **Geen gratis les en geen proefperiode.** Niet in een onderschrift, niet in
  beeld, niet gesproken. Sinds 23 november zijn ze er niet, en een belofte
  over geld die de winkel niet nakomt is bij Apple richtlijn 2.3.1 — en die
  geldt woordelijk "whether within or outside of the App Store", dus ook voor
  een bericht op Facebook. Wat er in de plaats van komt verkoopt beter: gratis
  te downloaden, 432 opnames van een echte stem, geen advertenties, er wordt
  niets verzameld, werkt offline, en nu de helft van de jaarprijs.
- **Gezinsdeling staat alleen op Facebook.** Bij Apple deelt het gezin één
  abonnement, bij Google niet, en dat is een goed argument met een voorbehoud
  eraan vast. `store/lancering/kanaal.md` laat het daarom weg uit één bericht
  voor twee winkels. Op Facebook is er ruimte om beide winkels in twee korte
  zinnen te noemen; in een onderschrift van drie regels of in vijftien
  seconden is er dat niet, en daar staat het dus niet.
- **Geen "nieuw".** Zie boven: er is bijna niemand voor wie dit een wijziging
  is.
- **Geen datum, geen aftelling, geen "eindelijk", geen terugblik op twee jaar
  werk.** Er is met opzet niet afgeteld (`docs/GO-LIVE.md`), en een
  bericht dat begint met hoe lang het duurde gaat over de maker en niet over
  de app.
- **Geen functie die niet nagekeken is.** Alles wat in de vier berichten
  staat, staat in `docs/STAND.md` of in `src/content/`. De vormen van elke
  letter, de spelletjes, de geschiedeniskaarten en de herhaalstapel zitten
  allemaal in de app en staan allemaal in `store/listing.nl.md` — maar niet in
  deze vier berichten, want vier berichten die alles noemen zijn vier keer
  hetzelfde bericht.
- **Geen tweede verzoek.** Elk bericht vraagt één ding, en dat is: haal hem
  op. Geen beoordeling, geen boeken, geen openingsactie, geen "wat zegt jouw
  familie voor brood" eronder. Die vraag is de post van dag 3 in
  `store/social.md` en hij werkt alleen als hij alleen staat.

# De dagen erna staan er al

Dit bestand gaat over één dag. De vijf posts daarna zijn al gemaakt én al
geschreven: de beelden in `brand/social/posts/<taal>/`, de bijschriften in
`store/social.md`, en de volgorde is de campagne — eerst het probleem, dan wat
de app anders doet, dan het schrift, dan de prijs, en tot slot het stuk dat
mensen doorsturen. Eén per keer, twee per week. Schrijf ze niet opnieuw.

**Op één na, en die is al om.** De vierde ging over dat beginnen gratis is.
Hier stond dat hij herschreven moest worden; dat is gebeurd in commit
`2c8e998` — hij heet nu *4 — Eén abonnement, alles open* en zegt in zes talen
dat de app gratis te downloaden is en de cursus een abonnement. Zie de
aantekening boven `magLeren` in `src/engine/store.ts`.

Wat er nog wél aan mankeert: hij noemt alleen de staande prijs (€ 59,99 per
jaar, dat is € 5,00 per maand, of € 6,99 per maand) en niet de tijdelijke
€ 29,99 voor het eerste jaar. Dat is de haak van deze campagne, en deze post is
de plek waar hij hoort. De tekst staat in `store/social.md` en niet hier.

# Vóór je plaatst

**Eerst het besluit dat bovenaan dit bestand openstaat: wat kondig je aan?**
Alle vier de berichten openen met *"Hij staat er … vanaf vandaag te
downloaden"*, en dat is sinds 24 oktober niet waar (`docs/STAND.md`). Twee
uitwegen, en dit document kiest er geen: de berichten gaan over de app die er
al is — dan moet *vanaf vandaag* eruit, in nl en fr, inclusief de twee
onderschriften onder de TikTok- en Instagram-video — of ze gaan over de
tijdelijke actie op het jaarabonnement, en dan is de actie de kop en niet een
regel onderaan. Op een Facebook-pagina met het bereik dat deze campagne wil,
is een onjuiste openingszin het eerste wat iemand leest.

1. **De actie van € 29,99 staat werkelijk in beide consoles, in alle vijf de
   eurolanden.** Dit is de eerste regel omdat elk bericht hierboven die prijs
   noemt. Wat je waar zet staat in `docs/STAND.md` onder *23 november: de
   tijdelijke actie van 50% op het jaar*. Staat de aanbieding er nog niet, dan
   gaat de hele actieregel eruit en noem je alleen € 59,99 per jaar of € 6,99
   per maand — een bericht dat een prijs belooft die de winkel niet rekent is
   bij Apple richtlijn 2.3.1, en dat geldt woordelijk "whether within or
   outside of the App Store". Controleer het op het aankoopvenster zelf, op een
   toestel, in de app uit de winkel: de console zegt wat er ingesteld is, niet
   wat de koper leest.
2. **`[EINDDATUM]` is overal vervangen.** Hij staat in het onderschrift van
   Instagram (nl en fr), in de YouTube-beschrijving en in het Facebook-bericht.
   Dezelfde datum als de einddatum die je in de twee consoles hebt gezet — een
   actie zonder einddatum is bij Apple gewoon de nieuwe prijs, en in een
   campagne een bewering die je niet kunt onderbouwen. Zoek erop voordat je
   plaatst; punthaken en blokhaken worden meegeplakt.
3. **De proefperiode van drie dagen staat uit.** Bij Apple bij beide
   abonnementen, bij Google `proef-jaar` en `proef-maand` — `docs/GO-LIVE.md`
   zegt waar. Geen enkel bericht hierboven noemt nog drie gratis dagen, dus
   zolang de winkel ze wél geeft zegt de advertentie iets anders dan het
   aankoopvenster. Bij `app.darijaforkids.yearly` doet de actie uit stap 1 dit
   in één handeling; bij Maand niet.
4. **De nieuwe film is geüpload.** De slotkaart zelf is om in commit
   `dca8cd8` — `dev/intro-copy.ts` zegt nu *Gratis downloaden* en *€ 59,99 per
   jaar · € 5,00 per maand*, en `src/site/intro.test.ts` bewaakt het; zie
   hierboven. Hier stond dat die twee nog moesten gebeuren. Wat er nog wél
   moet: de nieuwe opname naar YouTube, en de nieuwe link in
   `src/site/links.ts` én in Play Console. Zolang dat niet gebeurd is, gaat de
   YouTube-video niet op openbaar en gaat er geen filmfragment naar Instagram
   of TikTok.
5. **De YouTube-video staat op openbaar.** Hij staat nu op *Niet vermeld*,
   met opzet, en die stand verandert niet van zichzelf.
6. **De handle `@darijaforkidsapp` is gezet** (Instellingen → Kanaal →
   Geavanceerd). Zonder dat geeft `youtube.com/@darijaforkidsapp` een
   foutpagina, en dat adres staat in het bericht aan het WhatsApp-kanaal.
7. **De Facebook-pagina heeft een gebruikersnaam.** Anders is het adres
   `facebook.com/profile.php?id=…`, en dat is niet af te drukken en niet door
   te sturen.
8. **Beide winkelpagina's openen op een toestel.** Niet op de Mac, niet in een
   tabblad waar je al ingelogd bent. Een verkeerd adres onder een bericht is
   niet terug te nemen.
9. **Kijk welke versie er live staat.** Dat is sinds 24 oktober 1.5 — bij
   Apple build 11, bij Play versiecode 10 (`docs/STAND.md`). Hier stond *"1.4,
   bij Apple build 10, bij Play versiecode 8"*, en dat is 1.4 — bij Apple live
   sinds 4 oktober, bij Play sinds 13 oktober. En let op het tweede deel: de
   app met de betaalmuur bij de
   download is commit `123a8c1` en die is **nog niet ingediend** — in
   `docs/STAND.md` blokkeert het accepteren van de Apple Developer Program
   License Agreement al het andere. Zolang dat zo is geeft de app uit de winkel
   nog acht gratis lessen, terwijl deze vier berichten zeggen dat de cursus een
   abonnement is dat op het eerste scherm gevraagd wordt. Die kant is niet wat
   Apple 2.3.1 bestraft, maar het is wél een verschil tussen de advertentie en
   wat de lezer aantreft.
10. **De profielen staan niet leeg.** Profielfoto en omslag uit
    `brand/social/`, en op Instagram liever al twee of drie platen. Wie op een
    leeg profiel aankomt, komt niet terug om nog eens te kijken
    (`store/kanaal-socials.md`).
11. **Lees de vier berichten naast elkaar.** Als twee ervan hetzelfde zeggen in
    een andere lengte, is er één te veel. Dan is dit bestand voor niets
    geschreven.
