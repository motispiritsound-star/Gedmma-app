import { Link } from 'react-router-dom'
import { Button } from '../ui/kit'
import { Mascot } from '../ui/Mascot'

export function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Mascot mood="denk" size={130} className="mx-auto" />
      <h1 className="mt-4 font-display text-3xl font-extrabold">Fin hadi? Waar is dit?</h1>
      <p className="mt-2 text-[var(--ink-soft)]">Deze pagina bestaat niet. Terug naar iets nuttigs:</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/leren"><Button>Leerpad</Button></Link>
        <Link to="/woorden"><Button variant="secondary">Woordenboek</Button></Link>
      </div>
    </div>
  )
}
