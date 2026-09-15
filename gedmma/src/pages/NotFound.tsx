import { Link } from 'react-router-dom'
import { Button } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { useT } from '../i18n'

export function NotFound() {
  const t = useT()
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Mascot mood="denk" size={130} className="mx-auto" />
      <h1 className="mt-4 font-display text-3xl font-extrabold">{t.notFound.titel}</h1>
      <p className="mt-2 text-[var(--ink-soft)]">{t.notFound.body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/leren"><Button>{t.notFound.pad}</Button></Link>
        <Link to="/woorden"><Button variant="secondary">{t.nav.woorden}</Button></Link>
      </div>
    </div>
  )
}
