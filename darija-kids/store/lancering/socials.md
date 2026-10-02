# De socials op de lanceringsdag

Vier berichten voor vier kanalen, op de dag dat 1.4 in allebei de winkels
staat — App Store build 10, Play versiecode 8. Te plakken zoals het staat.

Het bericht voor het WhatsApp-kanaal staat apart, in
`store/lancering/kanaal.md`. Dit zijn Instagram, TikTok, YouTube en Facebook.

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

**En voor alle vier geldt: niemand hier weet wat 1.4 is.** 1.0 staat sinds
2 oktober stil in de App Store en Play heeft nooit iets uitgebracht. Het
startscherm in vier stappen is dus geen wijziging die je aankondigt, het is
hoe de app begint. `store/wat-is-nieuw-1.4.md` zegt het al: dit is voor bijna
iedereen niet "wat is er nieuw" maar het eerste wat hij van de app ziet. Het
woord "nieuw" staat daarom in geen van de vier berichten.

## Wat er van beeld echt ligt

Alles hieronder staat er nu, in het Nederlands én in het Frans. Wat in
`brand/` staat, staat in `.gitignore` en komt met één opdracht terug.

| Wat | Waar | Formaat |
|---|---|---|
| De aankondigingsplaat | `store/marketing/nl/social-vierkant.png`, `social-verhaal.png` | 1080×1080 en 1080×1920 |
| De vijf campagneposts | `brand/social/posts/nl/1-oma-vierkant.png` t/m `5-geschiedenis-verhaal.png` | tien bestanden per taal |
| De introfilm | `store/video/nl/intro-vierkant.mp4`, `intro-verhaal.mp4`, `intro-breed.mp4` | 1:1, 9:16, 16:9 |
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

### 1. De introfilm noemt een prijs die niet bestaat

Op de laatste kaart van `store/video/<taal>/intro-*.mp4` staat **"Vanaf
€ 4,99 per maand"**. Die prijs bestaat niet. Hij staat in `dev/intro.ts`
(`price`, in alle zes de talen) en er is geen test die hem nakijkt.

Twee redenen waarom dit de film tegenhoudt en niet alleen een slordigheid is.
Het is een bedrag dat nergens anders voorkomt — het abonnement is € 6,99 per
maand of € 59,99 per jaar. En het is een omrekening per maand van een bedrag
dat per jaar wordt afgeschreven: Apple wees 1.0 af op richtlijn 3.1.2(c) omdat
precies zo'n omrekening duidelijker stond dan het bedrag dat van de rekening
gaat.

De film is de lanceringsvideo op YouTube. Daar is niets weg te knippen, dus
daar moet `dev/intro.ts` eerst goed en moet `npm run intro` opnieuw. Let op
het staartje: YouTube vervangt het bestand onder een bestaande link niet, dus
een nieuwe opname is een nieuwe link, en die link staat ook in Play Console →
*Main store listing → Video*. Bijwerken kan met
`npm run play -- --tekst --video <de nieuwe YouTube-link>`.

Voor Instagram en TikTok is het minder erg: de slotkaart begint op 25,2
seconden (`TITLE + 7 × HOLD` in `dev/intro.ts`), dus een fragment van vijftien
seconden komt er niet aan toe.

### 2. Drie beelden zeggen "binnenkort"

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

Beide adressen bestaan al vóór de release zichtbaar is. Een 404 betekent dus
niet dat het adres fout is, maar dat de release op jou wacht — bij Play onder
*Publishing overview → Manage*, bij Apple onder *Manually release this
version*. Open ze op een toestel voordat je plaatst, niet op de Mac en niet in
een tabblad waar je al ingelogd bent.

En geen derde bestemming. `darijaforkids.eu` staat al afgedrukt op de platen
en in de YouTube-beschrijving; in de berichten zelf staan twee plekken om
heen te gaan, niet drie.

---

# Instagram

## Welke plaat

**`brand/social/posts/nl/1-oma-vierkant.png`** — "Je kind verstaat oma wel. /
Antwoorden lukt alleen niet." Dat is de enige plaat die een scherm uit de
echte app laat zien én de regel draagt waar dit hele project om staat. Voor
een publiek dat de app vandaag voor het eerst ziet, doet de herkenbare vraag
meer dan een merkkaart.

Wil je één plaat die de naam van de app noemt, dan is dat
`store/marketing/nl/social-vierkant.png` — warm, de khatam, "Leer Darija, de
taal van thuis". Als carrousel werken ze samen: eerst de vraag, dan de naam.

In het Frans staan beide bestanden klaar onder `brand/social/posts/fr/` en
`store/marketing/fr/`.

Twee dingen die níét op deze plek horen. `brand/social/binnenkort-vierkant-nl.png`
zegt "binnenkort". En `store/video/nl/intro-vierkant.mp4` is de film, geen
plaat; die kan er de dag erna staan, en pas nadat de prijskaart gerepareerd is.

## Het onderschrift

```
Hij staat er.

Darijaforkids is vanaf vandaag te downloaden, op iPhone en op Android.

Je kind verstaat jeddti wel. Antwoorden lukt alleen niet. Daar begint deze
app. 17 units, van de letters tot afdingen op de souq. 304 woorden, 100
zinnen, 432 opnames — allemaal ingesproken door een Marokkaanse stem, geen
computerstem.

De eerste vier lessen zijn gratis. Geen account, niets in te vullen, geen
advertenties. Hij werkt offline.

Daarna € 6,99 per maand, of € 59,99 per jaar met het e-boek erbij. Drie dagen
om het te proberen, opzeggen doe je in de winkel zelf.

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

Les quatre premières leçons sont gratuites. Sans compte, rien à remplir, sans
publicité. Elle fonctionne hors ligne.

Ensuite 6,99 € par mois, ou 59,99 € par an avec le livre numérique. Trois
jours pour l'essayer, et on résilie dans la boutique elle-même.

Les deux liens sont dans la bio.

#darija #maroc #languematernelle
```

De plaat in het Frans is `brand/social/posts/fr/1-oma-vierkant.png`.

---

# TikTok

Vijftien seconden, en één ding: de eerste minuut in de app. Dat is wat
`store/kanaal-socials.md` aan TikTok heeft toegewezen, en het is het enige
beeld dat vandaag met een schermopname op een toestel te maken is — geen
acteurs, geen oma aan de telefoon.

**Het beeld dat je opneemt:** een verse installatie, de vier stappen
doorlopen, en dan de eerste les. Staand, 9:16. Elke scène blijft drie seconden
staan; dat is dezelfde regel als in `store/kanaal-sleutels.md` en
`docs/VIDEO.md`.

**De tekst in beeld moet het alleen af kunnen.** De helft kijkt zonder geluid
(`docs/LANCERING.md` §5), dus de gesproken regels komen er bovenop en vervangen
niets. En geen logo in de eerste drie seconden; die staan ten dienste van de
eerste regel.

| Tijd | Beeld | In beeld | Gesproken |
|---|---|---|---|
| 0:00–0:03 | De app opent. De talenlijst, een vinger kiest Nederlands. | Je kind verstaat jeddti. Antwoorden lukt alleen niet. | "Je kind verstaat jeddti wel. Antwoorden lukt alleen niet." |
| 0:03–0:06 | Stap twee: een naam getypt, een dier aangetikt. | Een naam. Een dier. | "Dus begint het hier. Een naam, een dier." |
| 0:06–0:09 | Stap drie: de drie manieren van meelezen, één wordt gekozen. | Arabisch schrift, de klanken, of allebei. | "Hoe hij meeleest: het Arabische schrift, de klanken in ons eigen alfabet, of allebei." |
| 0:09–0:12 | Stap vier: een kleur aangetikt. De knop en de voortgangsbalk kleuren mee. | Zijn kleur, op zijn knoppen. | "En een kleur. Die zit daarna op zijn knoppen en op zijn voortgang." |
| 0:12–0:15 | De eerste les. Een woord in Arabisch schrift, de stem zegt het. | Darijaforkids · De eerste vier lessen zijn gratis | "Dan beginnen de lessen. De eerste vier zijn gratis." |

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
| 0:12–0:15 | La première leçon. Un mot en écriture arabe, la voix le dit. | Darijaforkids · Les quatre premières leçons sont gratuites | « Puis les leçons commencent. Les quatre premières sont gratuites. » |

```
La première minute dans Darijaforkids. Téléchargeable depuis aujourd'hui, sur
iPhone et sur Android — le lien est dans la bio.

#darija #maroc #darijaforkids
```

---

# YouTube

De video is `store/video/nl/intro-breed.mp4`, nu geüpload als
`youtube.com/watch?v=3iHXGpubnaI` en op *Niet vermeld*. Eerst de prijskaart
repareren en opnieuw opnemen — zie hierboven — en daarna op openbaar zetten.

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
De eerste vier lessen zijn gratis en blijven gratis. Daarna € 6,99 per maand,
of € 59,99 per jaar met het e-boek erbij. Drie dagen om het te proberen, en
opzeggen doe je in de winkel zelf.

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
De eerste vier lessen zijn gratis en blijven gratis. Daarna € 6,99 per maand,
of € 59,99 per jaar met het e-boek erbij. Drie dagen om het te proberen, en
opzeggen doe je in de winkel zelf. Bij Apple deelt het hele gezin één
abonnement, tot zes personen. Bij Google niet.

EERLIJK OVER DE TAAL
Darija verschilt per stad en per familie en heeft geen officiële spelling. De
app kiest de vorm die je in Casablanca en Rabat het meest hoort. Zegt jouw oma
het anders, dan heeft jouw oma gelijk — dat zegt de app zelf ook.
```

Het beeld eronder: `store/marketing/nl/social-vierkant.png`, of
`store/video/nl/intro-vierkant.mp4` zodra de film opnieuw is gemaakt.

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
  Die zijn er niet, en op de dag van de lancering is dat ook het eerlijke
  beeld. De beoordeling vraag je op dag 3 (`docs/LANCERING.md` §16).
- **Geen citaat van een ouder en geen kind dat iets tegen zijn oma zegt.** Dat
  is de sterkste post die dit project kan hebben, en hij is vandaag onmogelijk
  echt te hebben. Dag 7, met een ouder die het zelf opstuurt.
- **Geen "€ 5,00 per maand".** Dat is € 59,99 gedeeld door twaalf, en het is
  de omrekening waarop Apple 1.0 afwees onder richtlijn 3.1.2(c). Dezelfde
  reden dat de introfilm zijn slotkaart kwijt moet.
- **Gezinsdeling staat alleen op Facebook.** Bij Apple deelt het gezin één
  abonnement, bij Google niet, en dat is een goed argument met een voorbehoud
  eraan vast. `store/lancering/kanaal.md` laat het daarom weg uit één bericht
  voor twee winkels. Op Facebook is er ruimte om beide winkels in twee korte
  zinnen te noemen; in een onderschrift van drie regels of in vijftien
  seconden is er dat niet, en daar staat het dus niet.
- **Geen "nieuw".** Zie boven: er is bijna niemand voor wie dit een wijziging
  is.
- **Geen datum, geen aftelling, geen "eindelijk", geen terugblik op twee jaar
  werk.** Er is met opzet niet afgeteld (`docs/LANCERING.md` §16), en een
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
de app anders doet, dan het schrift, dan dat beginnen gratis is, en tot slot
het stuk dat mensen doorsturen. Eén per keer, twee per week. Schrijf ze niet
opnieuw.

# Vóór je plaatst

1. **De film is opnieuw gemaakt.** `dev/intro.ts` zonder de prijsregel,
   `npm run intro` gedraaid, de nieuwe opname geüpload, en de nieuwe link in
   Play Console gezet. Zolang dat niet gebeurd is, gaat de YouTube-video niet
   op openbaar en gaat er geen filmfragment naar Instagram of TikTok.
2. **De YouTube-video staat op openbaar.** Hij staat nu op *Niet vermeld*,
   met opzet, en die stand verandert niet van zichzelf.
3. **De handle `@darijaforkidsapp` is gezet** (Instellingen → Kanaal →
   Geavanceerd). Zonder dat geeft `youtube.com/@darijaforkidsapp` een
   foutpagina, en dat adres staat in het bericht aan het WhatsApp-kanaal.
4. **De Facebook-pagina heeft een gebruikersnaam.** Anders is het adres
   `facebook.com/profile.php?id=…`, en dat is niet af te drukken en niet door
   te sturen.
5. **Beide winkelpagina's openen op een toestel.** Niet op de Mac, niet in een
   tabblad waar je al ingelogd bent. Een verkeerd adres onder een bericht is
   niet terug te nemen.
6. **De versie die live staat is 1.4** — bij Apple build 10, bij Play
   versiecode 8. Dit is het eerste bericht waarin dat uitmaakt: er staat één
   app in twee winkels.
7. **De profielen staan niet leeg.** Profielfoto en omslag uit
   `brand/social/`, en op Instagram liever al twee of drie platen. Wie op een
   leeg profiel aankomt, komt niet terug om nog eens te kijken
   (`store/kanaal-socials.md`).
8. **Lees de vier berichten naast elkaar.** Als twee ervan hetzelfde zeggen in
   een andere lengte, is er één te veel. Dan is dit bestand voor niets
   geschreven.
