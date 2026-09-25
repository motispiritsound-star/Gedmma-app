/**
 * De voorleesknop.
 *
 * De website verkoopt luister/leesboeken, en dit is het luisteren: de stem van
 * het toestel zelf leest voor, zin voor zin, en de zin die klinkt licht op. Er
 * komt geen opname aan te pas en er wordt niets gedownload — dat is met opzet,
 * want ingesproken stemmen kosten geld en dit onderdeel mocht niets kosten tot
 * er iets verdiend wordt.
 *
 * Wat een telefoonstem niet kan, is vertellen. Een kind dat meeleest heeft daar
 * minder last van dan een volwassene die alleen luistert, en dat is precies wie
 * hier zit: een ouder die voorleest aan een kind dat meekijkt.
 *
 * Drie plekken gebruiken dit: het gratis begin op de boekenpagina, een leesboek
 * na het inloggen, en een bladzijde van een prentenboek. Vandaar dat de motor
 * (`voorlees`) losstaat van het zetwerk: hij zoekt `.zin`-elementen in een vak
 * en hangt er een balk boven, en wie dat vak vult mag zelf weten hoe.
 *
 * Dit bestand staat los van `make-site.mjs` en wordt als gewoon JavaScript
 * meegestuurd. Het hoorde eerst in een sjabloonstring thuis, en daar is één
 * accent grave in een commentaar genoeg om de hele website niet te laten
 * bouwen.
 */
(() => {
  /**
   * Waar een zin ophoudt.
   *
   * Dezelfde grens als `ZINSGRENS` in `src/content/zinnen.ts`, en daar staat
   * een test op die de twee naast elkaar legt. Twee kopieën is één te veel,
   * maar de andere is TypeScript die nooit in een browser komt.
   */
  const ZINSGRENS = /(?<=[.!?…]["'»«”’]?)\s+/

  const TAALCODE = { nl: 'nl-NL', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT', en: 'en-GB' }

  /**
   * Welke stemmen mannelijk zijn.
   *
   * De Web Speech API zegt het niet: dat veld bestaat niet. Wat wel bestaat is
   * de naam, en die is per platform bekend — Xander op een iPhone, Maarten bij
   * Microsoft, Thomas in het Frans. Vandaar een lijst met namen.
   *
   * Omdat zo'n lijst nooit compleet is, staat de keuze ook op het scherm: wat
   * dit toestel heeft, met de mannelijke stem vooraan. Dan hoeft niemand het
   * met onze gok te doen.
   */
  const MANNEN = /xander|maarten|thomas|paul|henri|nicolas|markus|yannick|stefan|conrad|jorge|diego|carlos|pablo|alvaro|enrique|luca|cosimo|giuseppe|daniel|arthur|george|ryan|guy|male|man\b/i

  const spraak = window.speechSynthesis
  let stemmen = []
  const laadStemmen = () => { try { stemmen = spraak ? spraak.getVoices() : [] } catch { stemmen = [] } }
  if (spraak) {
    laadStemmen()
    if (spraak.addEventListener) spraak.addEventListener('voiceschanged', laadStemmen)
  }

  /**
   * Onze eigen namen voor de stemmen.
   *
   * Een toestel noemt zijn stemmen "Microsoft Maarten Online (Natural) -
   * Dutch (Netherlands)". Dat is een productnummer met een naam erin, en het
   * staat in een keuzelijst onder een verhaal dat een kind meeleest.
   *
   * Vijf vertellers dus, met een naam die in dit boek thuishoort. Welke stem
   * van het toestel eronder zit, verschilt per apparaat en doet er voor de
   * lezer niet toe — die kiest een verteller, geen spraakmotor.
   */
  const VERTELLERS = { man: ['Amir', 'Adam', 'Yassine'], vrouw: ['Sarah', 'Yousra'] }

  /**
   * De vijf, met hun naam erbij.
   *
   * De Web Speech API zegt niet of een stem mannelijk is; de namenlijst
   * hierboven doet die gok. Heeft een toestel maar twee stemmen, dan krijg je
   * er twee — de namen worden op volgorde uitgedeeld, dus dezelfde stem houdt
   * op hetzelfde toestel altijd dezelfde naam.
   */
  /**
   * De nieuwe stemmen eerst.
   *
   * Toestellen dragen twee soorten met zich mee. De oude, compacte stemmen
   * zitten in het apparaat en klinken naar 2010; de nieuwe halen hun klank van
   * een server en klinken bijna als iemand. Ze staan door elkaar in dezelfde
   * lijst, en welke je krijgt bepaalt of een hoofdstuk om aan te horen is.
   *
   * Ze zijn te herkennen aan twee dingen: het woord dat de maker erin zet —
   * Natural, Neural, Enhanced, Premium, Online — en `localService`, dat vals
   * is zodra de klank ergens anders vandaan komt. Geen van beide is een
   * belofte, en samen zijn ze een goede gok.
   */
  const NIEUWERE = /natural|neural|enhanced|premium|online|siri/i

  const stemmenVoor = (code) => {
    const kort = code.slice(0, 2)
    const land = (v) => ((v.lang || '').replace('_', '-') === code ? 0 : 1)
    const klank = (v) => (NIEUWERE.test(v.name) ? 0 : v.localService === false ? 1 : 2)
    const passend = stemmen
      .filter((v) => (v.lang || '').replace('_', '-').slice(0, 2) === kort)
      .sort((a, b) => klank(a) - klank(b) || land(a) - land(b))

    const mannen = passend.filter((v) => MANNEN.test(v.name))
    const vrouwen = passend.filter((v) => !MANNEN.test(v.name))

    const uit = []
    mannen.slice(0, VERTELLERS.man.length).forEach((stem, i) => uit.push({ stem, naam: VERTELLERS.man[i] }))
    vrouwen.slice(0, VERTELLERS.vrouw.length).forEach((stem, i) => uit.push({ stem, naam: VERTELLERS.vrouw[i] }))

    /**
     * Wat niet past, komt er niet bij.
     *
     * Heeft een toestel alleen mannenstemmen, dan blijven Sarah, Yousra en
     * Lina ongebruikt en zie je er twee. Dat is beter dan de lijst vol maken:
     * een mannenstem onder de naam Sarah valt meteen op, en in een boek dat
     * een kind meeleest is de verteller geen willekeurig etiket.
     */
    return uit
  }

  /** Onthouden mag mislukken: in een privévenster gooit localStorage. */
  const bewaar = (sleutel, waarde) => { try { localStorage.setItem(sleutel, waarde) } catch { /* niets */ } }
  const herinner = (sleutel) => { try { return localStorage.getItem(sleutel) } catch { return null } }

  /** Sterretjes zijn opmaak, geen klank. */
  const uitspreekbaar = (zin) => zin.replace(/\*/g, '')

  /**
   * Een alinea als losse zinnen.
   *
   * Eén span per zin: dat is wat oplicht, en waar het voorlezen op mikt.
   *
   * Sterretjes zijn cursief, net als in de gedrukte boeken — `make-sleutels`
   * doet daar hetzelfde mee. Zonder deze stap staan ze er gewoon: *zo*, en
   * dan leest een koper asterisken in een verhaal waar hij voor betaald heeft.
   */
  const alineaVan = (tekst) => {
    const p = document.createElement('p')
    for (const zin of String(tekst).split(ZINSGRENS)) {
      if (!zin) continue
      const span = document.createElement('span')
      span.className = 'zin'
      const stukken = zin.split('*')
      // Een oneven aantal sterretjes is een cursief die over de zinsgrens
      // heen loopt. Dan maar geen cursief; de tekst blijft in elk geval heel.
      if (stukken.length % 2 === 0) {
        span.textContent = zin.replace(/\*/g, '') + ' '
      } else {
        stukken.forEach((stuk, i) => {
          if (!stuk) return
          if (i % 2 === 0) return span.append(document.createTextNode(stuk))
          const em = document.createElement('em')
          em.textContent = stuk
          span.append(em)
        })
        span.append(document.createTextNode(' '))
      }
      p.append(span)
    }
    return p
  }

  /**
   * Hang een voorleesbalk boven een vak dat al gevuld is.
   *
   * `vak` bevat `.zin`-elementen; in welke volgorde ze in het document staan,
   * is de volgorde waarin ze voorgelezen worden. `sleutel` is waar de plek
   * onder bewaard wordt — laat hem weg en er wordt niets onthouden.
   */
  const voorlees = (vak, taal, woorden, sleutel) => {
    const code = TAALCODE[taal] || 'nl-NL'
    const zinnen = Array.prototype.slice.call(vak.querySelectorAll('.zin'))

    const balk = document.createElement('div')
    balk.className = 'leesbalk'
    const speelknop = document.createElement('button')
    speelknop.type = 'button'
    speelknop.className = 'mailbtn speel'
    const stemkiezer = document.createElement('select')
    stemkiezer.className = 'stemkeuze'
    stemkiezer.setAttribute('aria-label', woorden.stem || 'Stem')
    balk.append(speelknop, stemkiezer)
    vak.prepend(balk)
    balk.after(tip)

    const vulStemmen = () => {
      const lijst = stemmenVoor(code)
      if (!lijst.length) { stemkiezer.hidden = true; return }
      stemkiezer.hidden = false
      // Bewaard wordt de naam van het toestel, getoond wordt de onze. Een
      // toestel kan zijn stemmen hernoemen; onze namen mogen niet verspringen.
      const gekozen = stemkiezer.value || herinner('stem-' + taal) || lijst[0].stem.name
      stemkiezer.innerHTML = ''
      for (const { stem, naam } of lijst) {
        const optie = document.createElement('option')
        optie.value = stem.name
        optie.textContent = naam
        stemkiezer.append(optie)
      }
      stemkiezer.value = lijst.some((v) => v.stem.name === gekozen) ? gekozen : lijst[0].stem.name
    }
    /**
     * Zeggen dat het beter kan, als het beter kan.
     *
     * Een toestel met alleen de oude compacte stem klinkt blikkerig, en de
     * lezer denkt dan dat dit is wat wij hem bieden. Het staat één tik verderop
     * in zijn eigen instellingen. Alleen tonen als het speelt — wie al een
     * goede stem heeft, hoeft geen raad.
     */
    const tip = document.createElement('p')
    tip.className = 'stemtip'
    tip.textContent = woorden.stemTip || ''
    const magTip = () => {
      const lijst = stemmenVoor(code)
      tip.hidden = !woorden.stemTip || !lijst.length
        || lijst.some(({ stem }) => NIEUWERE.test(stem.name) || stem.localService === false)
    }

    vulStemmen()
    magTip()
    const opnieuwVullen = () => { laadStemmen(); vulStemmen(); magTip() }
    if (spraak && spraak.addEventListener) spraak.addEventListener('voiceschanged', opnieuwVullen)

    let speelt = false
    let wijzer = sleutel ? Number(herinner(sleutel) || 0) : 0
    if (!(wijzer >= 0 && wijzer < zinnen.length)) wijzer = 0

    const merk = (schuif) => {
      for (const z of zinnen) z.classList.remove('aan')
      const hier = zinnen[wijzer]
      if (!hier) return
      hier.classList.add('aan')
      if (schuif) hier.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }

    const knopTekst = () => {
      speelknop.textContent = speelt ? (woorden.pauze || 'Pauze') : (woorden.speel || 'Voorlezen')
      speelknop.setAttribute('aria-pressed', speelt ? 'true' : 'false')
    }

    function stop() {
      speelt = false
      try { if (spraak) spraak.cancel() } catch { /* niets */ }
      knopTekst()
      if (sleutel) bewaar(sleutel, String(wijzer))
    }

    function spreek() {
      if (!speelt || wijzer >= zinnen.length) return stop()
      merk(true)
      const zin = new SpeechSynthesisUtterance(uitspreekbaar(zinnen[wijzer].textContent))
      zin.lang = code
      const keuze = stemmenVoor(code).find((v) => v.stem.name === stemkiezer.value)
      if (keuze) zin.voice = keuze.stem
      // Eén zin die struikelt mag het boek niet stilleggen.
      zin.onend = () => { if (speelt) { wijzer += 1; if (sleutel) bewaar(sleutel, String(wijzer)); spreek() } }
      zin.onerror = () => { if (speelt) { wijzer += 1; spreek() } }
      try { spraak.speak(zin) } catch { stop() }
    }

    function speel(vanaf) {
      if (!spraak) return
      try { spraak.cancel() } catch { /* niets */ }
      if (typeof vanaf === 'number') wijzer = vanaf
      if (wijzer >= zinnen.length) wijzer = 0
      speelt = true
      knopTekst()
      spreek()
    }

    speelknop.onclick = () => { if (speelt) stop(); else speel() }
    stemkiezer.onchange = () => {
      bewaar('stem-' + taal, stemkiezer.value)
      if (speelt) { stop(); speel(wijzer) }
    }
    // Ergens in het midden verder: tik op de zin waar je wilt beginnen.
    for (let i = 0; i < zinnen.length; i++) {
      zinnen[i].onclick = () => { wijzer = i; if (speelt) { stop(); speel(i) } else merk(false) }
    }

    if (!spraak) speelknop.hidden = true
    knopTekst()
    if (wijzer > 0) merk(false)

    // Wie wegklikt terwijl het praat, hoort anders een boek in een gesloten
    // tabblad doorlezen: de spraakmotor van de browser stopt daar niet vanzelf.
    addEventListener('pagehide', stop)

    /**
     * Alles weer losmaken.
     *
     * Een prentenboek zet bij elke bladzijde een nieuwe balk neer. Zonder dit
     * blijven de luisteraars van de vorige bladzijde hangen, en na dertig keer
     * bladeren bouwt elke verandering van stemmen dertig keuzelijsten opnieuw
     * op — in een boek dat juist op een tablet gelezen wordt.
     */
    const los = () => {
      stop()
      if (spraak && spraak.removeEventListener) spraak.removeEventListener('voiceschanged', opnieuwVullen)
      removeEventListener('pagehide', stop)
    }

    return { stop, speel, los }
  }

  /**
   * Zet een heel boek neer, met de balk erboven.
   *
   * `doel` wordt leeggemaakt. `boek` is wat de worker teruggeeft: een titel,
   * een jaar, een plaats en hoofdstukken met alinea's.
   */
  const toon = (doel, boek, taal, woorden, sleutel, plaat) => {
    /**
     * Erbij, niet in plaats van.
     *
     * Hier stond `doel.className = 'boek'`, en dat gooide de klasse `lezer`
     * weg die het vak op de boekenpagina al had. Daarmee verdween ook de
     * opmaak die aan `.lezer` hangt — de zin die oplicht bijvoorbeeld. Dat is
     * de vervelende soort fout: alles werkt, het ziet er alleen anders uit dan
     * op de andere bladzijde, en niemand kan zeggen waarom.
     */
    doel.classList.add('lezer', 'boek')
    doel.classList.remove('laden', 'soon')
    doel.innerHTML = ''

    const kop = document.createElement('h2')
    kop.textContent = boek.titel
    const onder = document.createElement('p')
    onder.className = 'jaar'
    onder.textContent = [boek.jaar, boek.waar].filter(Boolean).join(' · ')

    const tekst = document.createElement('div')
    tekst.className = 'leestekst'
    for (const hoofdstuk of boek.hoofdstukken || []) {
      const h = document.createElement('h3')
      h.textContent = (hoofdstuk.nummer ? hoofdstuk.nummer + '. ' : '') + hoofdstuk.titel
      tekst.append(h)
      for (const alinea of hoofdstuk.tekst || []) tekst.append(alineaVan(alinea))
    }

    /**
     * Het geschilderde tafereel bij dit deel, als er een is.
     *
     * Hij draagt de titel al, en die staat er daarom onder nog eens: een
     * voorlezer hoort geen plaat. Valt hij om — een taal zonder plaat, een
     * bestand dat er niet is — dan haalt hij zichzelf weg en begint het boek
     * gewoon bij de titel.
     */
    if (plaat) {
      const beeld = document.createElement('img')
      beeld.className = 'boekplaat'
      beeld.src = plaat
      beeld.alt = ''
      beeld.loading = 'lazy'
      beeld.decoding = 'async'
      beeld.onerror = () => beeld.remove()
      doel.append(beeld)
    }

    doel.append(kop, onder, tekst)
    /**
     * Waaronder de plek bewaard wordt.
     *
     * De aanroeper mag hem meegeven, en dat moet ook: het gratis begin en het
     * gekochte boek heten allebei De olijvenbrand. Op één sleutel zouden ze
     * elkaars bladwijzer overschrijven, en dan begint het boek dat je net
     * gekocht hebt halverwege de teaser.
     */
    return voorlees(doel, taal, woorden, sleutel || 'lees-' + taal + '-' + (boek.titel || ''))
  }

  window.Lezer = { toon, voorlees, alineaVan }
})()
