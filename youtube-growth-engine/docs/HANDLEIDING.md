# Handleiding — van niets naar je eerste upload

Geschreven voor zo min mogelijk werk aan jouw kant. Per stap staat er wat **jij**
doet en wat **het systeem** doet. De stappen waar jij aan de beurt bent, kosten
samen ongeveer **anderhalf uur, eenmalig**.

> **Eerlijk vooraf.** Stap 1 tot en met 7 werken vandaag. Stap 8 — echte stem en
> echte beelden — wacht op jouw providerkeuze; tot dan draait de pipeline met
> placeholderbeeld. Je kunt dus vandaag een volledige video privé op je kanaal
> zetten en het hele proces doorlopen, maar hij is nog niet publiceerbaar.
> Zie [§8](#stap-8--echte-stem-en-echte-beelden).

---

## Voordat je begint: één keer kijken zonder iets te installeren

```bash
cd youtube-growth-engine
npm install
npm run demo
```

Duurt een minuut, kost niets, vraagt geen enkele sleutel. Je ziet vier
producties langskomen waarvan er drie worden afgewezen, en je krijgt in `out/`
twee echte MP4's, twee SRT-bestanden en een werkboek als PDF.

**Kijk vooral naar de afwijzingen.** Dat is waar het systeem zijn werk doet.

---

## Stap 1 — Zeg wat je wilt (10 min, jij)

Open `config/defaults.yaml` en loop hem door. Alles staat al ingevuld; je hoeft
alleen te wijzigen wat je anders wilt. De regels met `source: default` zijn
keuzes die ik voor je heb gemaakt.

Het enige dat je écht zelf moet invullen:

```yaml
religious:
  quran_translation: "NOG TE KIEZEN"      # ← zie stap 6
  reviewer_name: ""                        # ← zie stap 7
```

**Het systeem doet:** alle keuzes vastleggen met wie ze maakte, zodat later
terug te zien is wat jouw beslissing was en wat de mijne.

---

## Stap 2 — Installeer wat er op je computer moet staan (15 min, jij)

```bash
npm run doctor
```

Die vertelt je precies wat er ontbreekt en wat je ervoor moet doen. Draai hem na
elke stap opnieuw tot alles op `OK` staat.

Wat hij kan vragen:

| | macOS | Windows | Ubuntu |
|---|---|---|---|
| Node 20+ | `brew install node` | `winget install OpenJS.NodeJS` | `sudo apt install nodejs` |
| FFmpeg | `brew install ffmpeg` | `winget install Gyan.FFmpeg` | `sudo apt install ffmpeg` |
| Chrome | waarschijnlijk al | waarschijnlijk al | `sudo apt install chromium` |

Chrome is alleen voor het werkboek naar PDF. Heb je het niet, dan krijg je HTML —
die druk je in elke browser af.

---

## Stap 3 — Claude-sleutel (5 min, jij)

1. Ga naar `console.anthropic.com`, maak een API-sleutel.
2. Kopieer `.env.example` naar `.env` en zet de sleutel erin:

```bash
cp .env.example .env
```

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**Reken op € 4 tot € 6 per long-form video** aan onderzoek, script en poorten.
Zet een uitgavelimiet in de Anthropic-console; het systeem heeft daarnaast eigen
plafonds in `.env` (`BUDGET_PER_MONTH_CENTS=10000`, dus € 100).

---

## Stap 4 — Google en je YouTube-kanaal koppelen (20 min, jij — eenmalig)

Dit is de omslachtigste stap en daarna nooit meer.

1. **Kanaal.** Maak het YouTube-kanaal aan als je dat nog niet hebt, en
   doorloop de verificatie (telefoonnummer). Zonder verificatie mag je geen
   video's langer dan 15 minuten uploaden en geen eigen thumbnail zetten.
2. **Google Cloud project.** Ga naar `console.cloud.google.com`, maak een
   project, en zet onder *APIs & Services → Library* deze twee aan:
   - YouTube Data API v3
   - YouTube Analytics API
3. **Toestemmingsscherm** — *APIs & Services → OAuth consent screen*. Dit is de
   stap waar iedereen op vastloopt en hij staat in geen enkele tutorial goed:
   - **User type: External.** Kies je "Internal" zonder Workspace-organisatie,
     dan werkt het niet.
   - App-naam en support-e-mail invullen.
   - **Audience → Test users → voeg jezelf toe.** Doe je dit niet, dan blokkeert
     Google je straks met `access_denied` en zoek je een uur naar de reden.

4. **OAuth client.** *APIs & Services → Credentials → Create credentials →
   OAuth client ID*, type **Desktop app**. Klik na het aanmaken op
   **Download JSON**.

   Laat dat bestand vervolgens uitlezen — dan hoef je niets over te typen, en
   overtypen is precies waar een client secret stukgaat op één weggevallen
   teken:

```bash
npm run google:env
```

   Hij zoekt zelf het nieuwste `client_secret_*.json` in je Downloads-map, maakt
   `.env` aan als die er nog niet is, en zet de twee waarden erin. Staat het
   bestand ergens anders, geef het pad dan mee:

```bash
npm run google:env -- /pad/naar/client_secret_....json
```

   Liever met de hand? Dan zijn dit de twee regels in `.env`:

```bash
GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=...
```

5. **Koppelen:**

```bash
npm run youtube:connect
```

Gaat er iets mis, dan vertaalt dat commando Google's foutcode naar wat je moet
doen — `access_denied` betekent vrijwel altijd de testgebruiker uit stap 3.

Er verschijnt een link, je geeft toestemming in je browser, klaar.

**Het systeem vraagt maar twee rechten:** uploaden en analytics lezen. Geen
recht om te reageren, te liken of te abonneren — automatische engagement is
daarmee niet verboden maar technisch onmogelijk. Ondertiteling via de API zou
een breder recht vragen dat óók schrijftoegang tot reacties geeft; dat staat uit.
Je SRT-bestand upload je met de hand, dat kost twintig seconden.

---

## Stap 5 — Stem kiezen (20 min, jij — en dit kan ik niet voor je doen)

Nederlands is de taal waarin een synthetische stem het snelst wordt ontmaskerd,
en geen enkele specificatie voorspelt dat. Je moet luisteren.

1. Maak bij twee of drie aanbieders een proefaccount.
2. Laat elk dezelfde **honderd woorden uit een echt script** voorlezen — niet hun
   demotekst. Neem er een Arabische naam en een vakterm in op.
3. Laat het aan iemand horen die je niet vertelt dat het AI is.
4. Kies, en zet de sleutel in `.env` bij `TTS_API_KEY`.

Let bij de keuze op: commerciële licentie inbegrepen, en **timestamps per teken**
in de API — daar komt de ondertiteling uit, zonder aparte spraakherkenning.

---

## Stap 6 — Koranvertaling kiezen (15 min, jij)

De meeste Nederlandse Koranvertalingen zijn auteursrechtelijk beschermd werk.
"Het is de Koran" is geen vrijbrief voor de vertaling ervan.

Kies er één waarvan het gebruik aantoonbaar is toegestaan, en zet hem in
`config/defaults.yaml`:

```yaml
religious:
  quran_translation: "naam van de vertaling"
  quran_translation_licence: "waar de toestemming staat"
```

Het systeem citeert daarna **woordelijk** uit die vertaling en genereert er
nooit zelf een. Een door het model geproduceerde vertaling blokkeert de build,
ook als hij correct lijkt.

Hetzelfde geldt voor **recitatie-audio**: de opname van een reciteur is een
beschermde uitvoering. Gebruik geen recitatie zonder licentie.

---

## Stap 7 — Reviewer regelen (30 min, jij — de belangrijkste stap)

Je zei dat je iemand kent. Regel het nu, niet vlak voor je eerste publicatie:
zonder reviewer maakt het systeem materiaal dat niemand kan vrijgeven.

Wat je afspreekt:

- **Wat ze krijgen:** per video een dossier met het script en per claim de
  bron erbij — soera en ayah, of collectie, nummer en gradering. Geen 1.400
  woorden zonder verwijzingen.
- **Wat je vraagt:** klopt de toeschrijving, is een oordeel te stellig
  geformuleerd, ontbreekt er een vermelding dat geleerden verschillen.
- **Tijd:** reken op 20 tot 30 minuten per video.
- **Vergoeding:** € 15 – € 30 per video is gebruikelijk. Neem dat mee in je
  budget; het past níét binnen de € 100 en dat is een echte keuze.

```bash
RELIGIOUS_REVIEWER_NAME="naam"
```

---

## Stap 8 — Echte stem en echte beelden (10 min, jij)

De adapters staan er. Je hoeft alleen sleutels in `.env` te zetten.

```bash
# Beeld en videoclips — per aanroep, maandelijks opzegbaar
FAL_KEY=

# Alleen voor thumbnails: beter in leesbare tekst in beeld
GEMINI_API_KEY=

# Stem — pas invullen ná de stemtest uit stap 5
TTS_API_KEY=
TTS_VOICE_ID=
```

Ontbreekt er een? Dan valt alleen die rol terug op de mock en draait de rest
gewoon door. `npm run produce` zegt bij elke stap wat echt is en wat niet.

Wat dit per maand kost bij 1 video per week, gemeten:

```
194 stills + 26 thumbnails + 108 seconden clip  =  EUR 12,70
```

Zie [`docs/15`](15-tools-en-connectors.md) voor waarom dit per aanroep gaat en
niet via een abonnement.

---

## Stap 9 — Je eerste video (30 min, grotendeels het systeem)

```bash
npm run produce -- --topic "de eerste moskee in Medina"

# of een Short — een eigen productie met een eigen stelling,
# geen knipsel uit de long-form
npm run produce -- --topic "..." --format short
```

Onderwerpen uit `knowledge/onderwerpen.yaml` worden automatisch gebruikt; met
`--topic` overrule je dat.

**Het systeem doet**, in ongeveer twintig minuten:

1. bepaalt of er een stelling in te vullen is — zo niet, stopt het hier;
2. zoekt bronnen en registreert per claim de vindplaats;
3. schrijft het script;
4. controleert de religieuze herkomst — een hadith zonder gradering blokkeert;
5. controleert bronnen, originaliteit, retentie en redactionele kwaliteit;
6. maakt voice-over, shotlist, beelden, montage, ondertiteling en metadata;
7. houdt je titelopties tegen de referentietitels;
8. doet de technische controle op het echte bestand;
9. zet alles klaar en **stopt**.

**Jij doet:** het dossier lezen. Je krijgt de video, drie titels, drie
thumbnails, het script met bronnen, alle scores en de kosten. Vier knoppen:
goedkeuren, aanpassen, opnieuw genereren, afwijzen.

**Let op de volgorde:** eerst je reviewer, dan jij. De video staat op
`awaiting_reviewer` tot dat is gebeurd, en er is geen codepad dat die volgorde
omzeilt.

```bash
# 1. Het dossier lezen: script, en per claim de bron ernaast
npm run approve -- --production <id>

# 2. Je reviewer tekent
npm run approve -- --production <id> --reviewer "naam" --notes "..."

# 3. Jij keurt goed
npm run approve -- --production <id> --mine

# of afwijzen, met reden
npm run approve -- --production <id> --reject "de toon klopt niet"
```

Het dossier toont per bewering de vindplaats — soera en ayah, of collectie,
nummer en gradering. Dat is wat je reviewer nodig heeft, en het is de reden dat
het nakijken twintig minuten kost in plaats van een uur.

---

## Stap 10 — Uploaden (5 min)

```bash
npm run upload -- --production <id>
```

De video gaat **privé** naar je kanaal. Niet openbaar — `APPROVAL_MODE=true` is
de standaard en dat blijft zo tot jij dat expliciet verandert.

Daarna, in YouTube Studio:

1. kijk de video terug zoals een kijker hem ziet;
2. upload het SRT-bestand uit `out/` (twintig seconden);
3. zet de thumbnail als je een andere wilt dan de gekozen;
4. zet hem op openbaar of plan hem in.

Een tweede upload van dezelfde inhoud doet niets en geeft hetzelfde videoId
terug. Je kunt het commando dus veilig opnieuw draaien als je twijfelt of het
gelukt is.

---

## Stap 11 — Het werkboek: je eerste inkomsten

Dit is de enige inkomstenbron die vanaf video één werkt. Geen abonneedrempel,
geen wachttijd.

```bash
npm run workbook -- --title "Wat er als eerste stond" \
                    --subtitle "Een werkboek voor thuis" \
                    --price 7.50
```

Je krijgt een drukklare PDF met per hoofdstuk de illustratie, de kern van het
verhaal, drie open gespreksvragen en de bronnen met vindplaats. Extra kosten:
ongeveer **EUR 0,04 per hoofdstuk** — onderzoek, script en beeld waren al
betaald door de video.

Alleen goedgekeurde producties komen erin. Een werkboek wordt verkocht en blijft
staan; ongecontroleerde religieuze inhoud daarin is erger dan in een video.

Verkopen kan via Gumroad of Payhip: die nemen betaling, btw en levering over
voor een percentage. **Ik maak geen account voor je aan** — dat vraagt jouw
identiteit.

---

## Daarna: de eerste tien

Publiceer er tien voordat je iets aan het systeem verandert. Na elke tien draait
er een evaluatie die vergelijkt wat het systeem vooraf voorspelde met wat er
werkelijk gebeurde — en pas daarna gaat het volume omhoog, en alleen als
kwaliteit, retentie en originaliteit niet zijn gezakt.

**Het tempo is 1 long-form per week.** Niet omdat meer niet kan, maar omdat meer
niet in € 100 past zonder de kwaliteit te verlagen tot precies het profiel dat
kanalen kost. De rekensom staat in
[`docs/11`](11-nichedossier-islamitische-gezinscontent.md) §3.

---

## Als er iets misgaat

| | Doe |
|---|---|
| Iets werkt niet en je weet niet wat | `npm run doctor` |
| Alles stoppen, nu | zet `KILL_SWITCH=true` in `.env` |
| Koppeling met YouTube verlopen | `npm run youtube:connect` |
| Kosten lopen op | plafonds staan in `.env`; bij overschrijding pauzeert de wachtrij vanzelf |
| Een poort wijst steeds af op hetzelfde | dat is een fout in een prompt, geen reeks slechte video's — zeg het me |

---

## Wat nooit weggaat

Vier dingen blijven mensenwerk, hoe ver dit ook wordt uitgebouwd:

1. **De stemkeuze.** Alleen luisteren helpt.
2. **De religieuze review.** Een model dat zijn eigen herkomst nakijkt, checkt niets.
3. **Jouw eindgoedkeuring.** Per video.
4. **Onderwerpkeuze.** Jouw gevoel voor wat islamitische gezinnen aanspreekt is
   het enige deel van dit systeem dat een concurrent niet kan kopiëren.
