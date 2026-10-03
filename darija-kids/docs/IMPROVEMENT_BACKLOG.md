# Wat er nog te doen is

Op volgorde van wat het een gebruiker oplevert, niet van wat makkelijk is.
Afgeronde dingen gaan eruit; `docs/STAND.md` houdt bij wat er gebeurd is.

## Nu

- [ ] **De winkelknoppen op de site aanzetten.** `npm run live -- --apple <id>`.
      Wacht op één getal uit App Store Connect. Zie `docs/UX_AUDIT.md`, P0.
      Google erbij zodra versiecode 7 is goedgekeurd: `--google`.
- [ ] **Versiecode 7 en 1.1 door de beoordeling krijgen.** Niets aanraken
      zolang ze lopen; elke wijziging zet de klok terug.

## Zodra beide winkels groen zijn

- [ ] De aankondiging. Eén bericht voor beide platforms — dat was de hele reden
      om stil te lanceren.
- [ ] Build 10 / versiecode 8 bouwen met wat er klaarligt: het startscherm in
      vier stappen, het profiel na de aankoop, de Franse abonnementsteksten.

## Daarna, op waarde gesorteerd

- [ ] **"Er wacht een diploma op uw handtekening" in de voortgangsmail.** De
      bouwer van de diplomaplank schreef dat er geen manier is om een ouder op
      de hoogte te brengen; de jury vond er wel een, en die is al toegestaan.
      `meldVoortgang()` in `src/engine/post.ts` stuurt vijf tellers naar onze
      eigen server — maar alleen naar een ouder die het formulier achter de
      ouderpoort invulde, zijn adres bevestigde en er zelf om vroeg, en
      hoogstens een keer per dag. Een zesde teller valt binnen diezelfde regels.

      **Niet gedaan, en met reden.** De server schrijft in een vaste tabel
      (`server/src/index.ts`, de kolommen units, lessen, woorden, reeks, xp).
      Een zesde teller is een kolom erbij in een draaiende Cloudflare-worker met
      zijn D1-database, plus servercode en een mailsjabloon. Dat is een
      schemawijziging op een live dienst, en die hoort niet in de nacht voor een
      bouw, en niet zonder dat iemand erom vraagt.

      Het is wel het juiste antwoord op "ouders op de hoogte houden", en het is
      de enige weg die dat mag.

- [ ] **Eén hoogtestelsel voor de hele app.** Kwam uit het tabbalk-ontwerp van
      3 oktober en is toen bewust niet meegenomen: vijf treden (`--hoogte-1`
      tot `--hoogte-5`) waar Tailwinds hele schaduwtrap naar wijst, zodat
      `shadow-sm` tot `shadow-2xl` op eenentwintig plekken in één keer warm
      worden in plaats van vijf zwarttinten uit Tailwinds eigen tabel.

      Het zou ook iets oplossen dat nu op drie plekken met de hand wordt
      omzeild: `Card` draagt `shadow-sm`, en Tailwind zet die trede ná een
      `shadow-[...]`-klasse in het blad — dus een kaart die moet zweven heeft
      nu een omhulsel eromheen nodig. Met `--shadow-sm: var(--hoogte-1)` is dat
      omhulsel overbodig.

      **Niet gedaan**, want het verandert elke kaart in de app in één keer en
      het stond de dag voor een winkelbouw op tafel. De waarden staan in de
      patch van dat ontwerp; het bruin moet dat van `--schaduw-hoog` worden
      (`rgba(84, 56, 24)`), niet het vijfde dat erin stond.

- [ ] **Het e-boek in de Android-WebView** op een toestel bekijken. Op iOS is
      de PDF in een `iframe` nagekeken; op Android nooit.
- [ ] **Een proeflesje op de website.** De site vertelt wat de app doet; hij
      laat het niet zien. Het leenwerk is er al — de les-engine draait in de
      browser. Dit is het grootste onbenutte stuk van de voordeur.
- [ ] **Een ouderoverzicht in de app**: wat heeft het kind geleerd, wat zou het
      kunnen oefenen. De gegevens liggen er (`cards`, `lessons`, `daily`);
      er is geen scherm dat ze voor een ouder samenvat.
- [ ] **Leeftijd op het profiel** — geparkeerd op 2 oktober. Niet omdat het
      niet kan, maar omdat er nog geen antwoord is op wat de app ermee doet.
      Een veld waar niets mee gebeurt is een vraag die een beoordelaar stelt.

## Niet doen, en waarom

- **Analytics toevoegen.** Nul trackers is wat deze app in de kindercategorie
  laat staan zonder voorbehoud. Wat je eraan zou winnen (weten hoe ver iemand
  op de landingsbladzijde komt) weegt niet op tegen wat je opgeeft.
- **Spraakherkenning via een dienst van buiten.** De opname blijft nu op het
  toestel. Een kinderstem naar een derde sturen vraagt een reden die er niet is.
