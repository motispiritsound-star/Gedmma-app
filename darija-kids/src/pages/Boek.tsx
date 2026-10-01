import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ebookFile } from '../engine/billing'
import { useStore } from '../engine/store'
import { useT } from '../i18n'
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
  const [mislukt, setMislukt] = useState(false)

  if (!mag) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Mascot mood="denk" />
        <p className="mt-4 font-display text-xl font-extrabold">{t.unlock.slotTitel}</p>
        <Link to="/volledig" className="mt-4 inline-block"><Button>{t.unlock.slotKnop}</Button></Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-3xl flex-col px-4 py-4">
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
      <iframe
        src={ebookFile(lang)}
        title={t.unlock.boek.titel}
        className="min-h-0 flex-1 rounded-2xl border border-[var(--line)] bg-white"
        onError={() => setMislukt(true)}
      />

      <Card className="mt-3 p-4">
        <p className="text-sm text-[var(--ink-soft)]">{t.unlock.boek.inApp}</p>
        {mislukt && <p className="mt-2 text-sm font-bold">{t.unlock.boek.nietGelukt}</p>}
      </Card>
    </div>
  )
}