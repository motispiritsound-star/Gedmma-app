/**
 * De voorleesknop onder een boek.
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
 * Dit bestand staat los van `make-site.mjs` en wordt als gewoon JavaScript
 * meegestuurd. Het hoorde eerst in een sjabloonstring thuis, en daar is een
 * regel met een accolade te veel genoeg om de hele website niet te laten
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

  const stemmenVoor = (code) => {
    const kort = code.slice(0, 2)
    const land = (v) => ((v.lang || '').replace('_', '-') === code ? 0 : 1)
    return stemmen
      .filter((v) => (v.lang || '').replace('_', '-').slice(0, 2) === kort)
      .sort((a, b) => (MANNEN.test(a.name) ? 0 : 1) - (MANNEN.test(b.name) ? 0 : 1) || land(a) - land(b))
  }

  /** Onthouden mag mislukken: in een privévenster gooit localStorage. */
  const bewaar = (sleutel, waarde) => { try { localStorage.setItem(sleutel, waarde) } catch { /* niets */ } }
  const herinner = (sleutel) => { try { return localStorage.getItem(sleutel) } catch { return null } }

  /** Sterretjes zijn opmaak, geen klank. */
  const uitspreekbaar = (zin) => zin.replace(/\*/g, '')

  /**
   * Zet een boek neer, met de knoppen erboven.
   *
   * `doel` wordt leeggemaakt. `boek` is wat de worker teruggeeft: een titel,
   * een jaar, een plaats en hoofdstukken met alinea's. `woorden` zijn de
   * opschriften, die uit de zes talen van de site komen.
   */
  const toon = (doel, boek, taal, woorden) => {
    doel.className = 'boek'
    doel.innerHTML = ''

    const code = TAALCODE[taal] || 'nl-NL'
    const onthoudplek = 'lees-' + taal + '-' + (boek.titel || '')

    /* ── de balk ───────────────────────────────────────────────────── */

    const balk = document.createElement('div')
    balk.className = 'leesbalk'

    const speelknop = document.createElement('button')
    speelknop.type = 'button'
    speelknop.className = 'speel'
    balk.append(speelknop)

    const stemkiezer = document.createElement('select')
    stemkiezer.className = 'stemkeuze'
    stemkiezer.setAttribute('aria-label', woorden.stem || 'Stem')
    balk.append(stemkiezer)

    const vulStemmen = () => {
      const lijst = stemmenVoor(code)
      if (!lijst.length) { stemkiezer.hidden = true; return }
      stemkiezer.hidden = false
      const gekozen = stemkiezer.value || herinner('stem-' + taal) || lijst[0].name
      stemkiezer.innerHTML = ''
      for (const stem of lijst) {
        const optie = document.createElement('option')
        optie.value = stem.name
        optie.textContent = stem.name
        stemkiezer.append(optie)
      }
      stemkiezer.value = lijst.some((v) => v.name === gekozen) ? gekozen : lijst[0].name
    }
    vulStemmen()
    if (spraak && spraak.addEventListener) {
      spraak.addEventListener('voiceschanged', () => { laadStemmen(); vulStemmen() })
    }
    stemkiezer.onchange = () => {
      bewaar('stem-' + taal, stemkiezer.value)
      if (speelt) { stop(); speel(wijzer) }
    }

    /* ── de tekst ──────────────────────────────────────────────────── */

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
      for (const alinea of hoofdstuk.tekst || []) {
        const p = document.createElement('p')
        // Eén span per zin: dat is wat oplicht, en waar het voorlezen op mikt.
        for (const zin of String(alinea).split(ZINSGRENS)) {
          if (!zin) continue
          const span = document.createElement('span')
          span.className = 'zin'
          span.textContent = zin + ' '
          p.append(span)
        }
        tekst.append(p)
      }
    }

    doel.append(balk, kop, onder, tekst)

    const zinnen = Array.prototype.slice.call(tekst.querySelectorAll('.zin'))

    /* ── het voorlezen ─────────────────────────────────────────────── */

    let speelt = false
    let wijzer = Number(herinner(onthoudplek) || 0)
    if (!(wijzer >= 0 && wijzer < zinnen.length)) wijzer = 0

    const merk = () => {
      for (const z of zinnen) z.classList.remove('aan')
      const hier = zinnen[wijzer]
      if (!hier) return
      hier.classList.add('aan')
      hier.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }

    const knopTekst = () => {
      speelknop.textContent = speelt ? (woorden.pauze || '❚❚') : (woorden.speel || '▶')
      speelknop.setAttribute('aria-pressed', speelt ? 'true' : 'false')
    }

    function stop() {
      speelt = false
      try { if (spraak) spraak.cancel() } catch { /* niets */ }
      knopTekst()
      bewaar(onthoudplek, String(wijzer))
    }

    function spreek() {
      if (!speelt || wijzer >= zinnen.length) return stop()
      merk()
      const zin = new SpeechSynthesisUtterance(uitspreekbaar(zinnen[wijzer].textContent))
      zin.lang = code
      const stem = stemmenVoor(code).find((v) => v.name === stemkiezer.value)
      if (stem) zin.voice = stem
      // Eén zin die struikelt mag het boek niet stilleggen.
      zin.onend = () => { if (speelt) { wijzer += 1; bewaar(onthoudplek, String(wijzer)); spreek() } }
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
    // Ergens in het midden verder: tik op de zin waar je wilt beginnen.
    for (let i = 0; i < zinnen.length; i++) {
      zinnen[i].onclick = () => { wijzer = i; if (speelt) { stop(); speel(i) } else merk() }
    }

    if (!spraak) speelknop.hidden = true
    knopTekst()
    if (wijzer > 0) merk()

    // Wie wegklikt terwijl het praat, hoort anders een boek in een gesloten
    // tabblad doorlezen: de spraakmotor van de browser stopt daar niet vanzelf.
    addEventListener('pagehide', stop, { once: true })

    return { stop }
  }

  window.Lezer = { toon }
})()
