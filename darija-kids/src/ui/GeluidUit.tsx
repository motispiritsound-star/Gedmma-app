import { useEffect, useState } from 'react'
import { audioBlocked, keepAwake, sfx, unlockAudio } from '../engine/audio'
import { useStore } from '../engine/store'
import { useT } from '../i18n'
import { Button, Card } from './kit'

/**
 * Zegt het wanneer de app niets kan laten horen.
 *
 * Een browser die de mixer niet wil starten is het enige probleem dat een kind
 * niet kan zien: alles staat er goed op en er komt geen geluid uit. Op een
 * iPhone gebeurt dat vanzelf zodra de zijschakelaar op stil staat, en dan lijkt
 * het alsof de opnames ontbreken.
 *
 * Deze kaart stond eerst alleen op het pad. Maar wie in het woordenboek op een
 * woord tikt, of een letter aanraakt in het alfabet, komt daar niet langs — en
 * dat is precies waar iemand voor het eerst ontdekt dat hij niets hoort. Hij
 * hoort dus overal te staan, met de tik die het meestal verhelpt ernaast.
 */
export function GeluidUit() {
  const t = useT()
  const geluidAan = useStore((s) => s.settings.sound)
  const [stil, setStil] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setStil(audioBlocked()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!stil || !geluidAan) return null

  return (
    <div className="mx-auto max-w-3xl px-4 pt-4">
      <Card className="flex flex-wrap items-center gap-3 p-5">
        <span className="text-2xl" aria-hidden="true">🔇</span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-extrabold">{t.learn.geluidUit}</p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.learn.geluidUitUitleg}</p>
        </div>
        <Button onClick={() => { unlockAudio(); keepAwake(); sfx.confirm(); setStil(audioBlocked()) }}>
          {t.learn.geluidAan}
        </Button>
      </Card>
    </div>
  )
}
