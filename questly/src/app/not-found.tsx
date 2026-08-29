import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { getTranslations } from '@/modules/localisation/server'

export default async function NotFound() {
  const { d } = await getTranslations()
  return (
    <main
      id="main"
      className="q-topo flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <Logo size={44} />
      <h1 className="text-3xl font-semibold">{d.errors.notFoundTitle}</h1>
      <p className="q-prose text-ink-soft">{d.errors.notFoundBody}</p>
      <Link
        href="/"
        className="rounded-full bg-moss-600 px-6 py-3 font-semibold text-white no-underline"
      >
        {d.errors.backHome}
      </Link>
    </main>
  )
}
