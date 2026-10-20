/**
 * Start `vite preview`, draait de rooktest, en ruimt de server weer op.
 *
 * Eén opdracht in plaats van twee vensters: een rooktest die vergeet zijn
 * server te stoppen, laat een poort bezet achter en de vólgende ronde valt
 * dan om met een melding over iets anders.
 */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wortel = join(hier, '..')
const POORT = 4173

const server = spawn(process.execPath, [
  join(wortel, 'node_modules', 'vite', 'bin', 'vite.js'),
  'preview', '--port', String(POORT), '--strictPort',
], { cwd: wortel, stdio: ['ignore', 'pipe', 'inherit'] })

const klaar = new Promise((los) => {
  server.stdout.on('data', (blok) => {
    if (String(blok).includes(String(POORT))) los()
  })
})
await Promise.race([klaar, new Promise((l) => setTimeout(l, 8000))])

const rook = spawn(process.execPath, [join(hier, 'rook.mjs'), `http://localhost:${POORT}`], {
  cwd: wortel, stdio: 'inherit',
})
const [code] = await once(rook, 'exit')

server.kill('SIGTERM')
process.exit(code ?? 1)
