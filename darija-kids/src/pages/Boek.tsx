import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ebookFile, ebookPagina, ebookWachtTot } from '../engine/billing'
import { useStore } from '../engine/store'
import { localeOf, useT } from '../i18n'
import { Button, Card } from '../ui/kit'
import { Mascot } from '../ui/Mascot'

/**
 * Het e-boek, in de app zelf.
 *
 * De knop hiernaartoe gaf het bestand eerst aan het toestel, in een nieuw
 * venster. Op een iPhone deed dat iets wat niemand had kunnen raden: het
 * opende lichess.org.
 *
 * Wat er gebeurt: Capacitor serveert de app vanaf `capacitor://localhost`, en
 * een link naar een nieuw venster gaat naar het toestel in plaats van naar de
 * app zelf. Safari krijgt dus `capacitor://localhost/ebook/...` voorgeschoteld,
 * kan daar niets mee, en laat het tabblad zien dat er al open stond. Bij Adil
 * was dat een schaakbord.
 *
 * Een bestand uit de bundel kan het toestel nooit bereiken — het zit ín de
 * app. Dus hoort het ook in de app geopend te worden, en niet erbuiten.
 *
 * En het boek hoort daar sowieso te blijven: het is wat een koper betaalt.
 * Een link naar een openbaar adres zou het voor iedereen te halen maken.
 */
export function Boek() {
  const t = useT()
  const lang = useStore((s) => s.settings.lang)
  const mag = useStore((s) => s.ebook)
  /** Recht op het boek, maar de gratis dagen lopen nog. */
  const wachtTot = useStore((s) => ebookWachtTot(s))
  const [mislukt, setMislukt] = useState(false)

  /*
   * Twee verschillende manieren om het boek nog niet te hebben, en ze horen
   * niet hetzelfde te zeggen.
   *
   * Hier stond één tak met `t.unlock.slotTitel` erin: "Deze unit hoort bij de
   * volledige toegang". Dat is de tekst van een lés achter het slot, en voor
   * wie het jaarabonnement net heeft afgesloten is hij ronduit verkeerd — die
   * krijgt te lezen dat hij moet kopen wat hij een uur geleden gekocht heeft.
   * Op een scherm waar geld achter zit is dat het soort bericht waar iemand
   * over mailt.
   *
   * De tekst voor het wachten bestond al en stond op `/volledig`: hij zegt wát
   * er wacht en vanaf wanneer. Hier is nu dezelfde, met dezelfde datumopmaak.
   */
  if (!mag) {
    const wacht = wachtTot !== null
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Mascot mood="denk" />
        <h1 className="mt-4 font-display text-xl font-extrabold">📖 {t.unlock.boek.titel}</h1>
        <p className="mt-2 text-[var(--ink-soft)]">
          {wacht
            ? t.unlock.boek.wacht(new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long' }).format(wachtTot))
            : t.unlock.boek.bijJaar}
        </p>
        <Link to="/volledig" className="mt-5 inline-block">
          <Button variant={wacht ? 'secondary' : 'primary'}>
            {wacht ? t.common.terug : t.unlock.slotKnop}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    /*
     * De hoogte van het venster, maar nooit minder dan wat een lezer nodig
     * heeft.
     *
     * Hier stond alleen `100vh - 10rem`. Op een staande telefoon klopt dat,
     * maar leg hem plat en het venster is nog 390 pixels hoog: nagemeten hield
     * de pdf er dan 48 van over, en omdat de hoogte vastzat kon de bladzijde
     * ook niet scrollen. Een boek van € 14,99 als strook van achtenveertig
     * pixels, zonder weg eruit.
     *
     * `max()` lost allebei de gevallen op. Op een hoog scherm wint de
     * vensterhoogte en verandert er niets -- de bladzijde past nog precies.
     * Op een laag scherm wint de 37rem, groeit de kolom door en scrollt de
     * bladzijde gewoon.
     */
    <div className="mx-auto flex h-[max(37rem,calc(100vh-10rem))] max-w-3xl flex-col px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-extrabold">📖 {t.unlock.boek.titel}</h1>
        <Link to="/volledig"><Button variant="secondary">{t.common.terug}</Button></Link>
      </div>

      {/*
        `onError` komt niet bij elke WebView, dus hij is geen bewijs dat het
        goed ging — alleen een kans om iets te zeggen als het misging. De
        regel eronder staat er daarom altijd: een lezer die een leeg vlak ziet
        moet weten dat hij niet gek is en wat hij dan wél kan doen.
      */}
      {/*
        De leesversie, niet de pdf.

        Een pdf in een iframe toont op een iPhone alleen de omslag: WKWebView
        heeft daar geen pdf-lezer in zitten, dus je krijgt bladzijde één als
        plaatje — niet bladeren, niet scrollen. Op een laptop en op Android zit
        die lezer er wél in, en daarom is dit pas gevonden door het boek op een
        echte telefoon te openen na een echte aankoop.

        De html scrollt overal, de tekst is te selecteren en te doorzoeken, en
        hij is tien keer kleiner. De pdf blijft bestaan voor wie hem wil
        printen of bewaren; die staat onder het venster.
      */}
      <iframe
        src={ebookPagina(lang)}
        title={t.unlock.boek.titel}
        className="min-h-0 flex-1 rounded-2xl border border-[var(--line)] bg-white"
        onError={() => setMislukt(true)}
      />

      <Card className="mt-3 p-4">
        <p className="text-sm text-[var(--ink-soft)]">{t.unlock.boek.inApp}</p>
        {/*
          De pdf als tweede weg, en met zoveel woorden als "om te printen".
          Wie hem op een telefoon opent krijgt weer alleen de omslag, dus hij
          hoort niet de eerste knop te zijn — maar hij hoort er wel te zijn:
          het is het bestand dat je bewaart.
        */}
        <a href={ebookFile(lang)} download className="mt-2 inline-block text-sm font-bold underline">
          {t.unlock.boek.pdf}
        </a>
        {mislukt && <p className="mt-2 text-sm font-bold">{t.unlock.boek.nietGelukt}</p>}
      </Card>
    </div>
  )
}