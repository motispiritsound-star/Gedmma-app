/**
 * Bouwt met `--mode test` en draait de koop-rooktest ertegen.
 *
 * Een eigen bouwmap en een eigen poort, zodat dit niet in de weg zit van de
 * gewone rooktest -- en zodat een testbouw nooit per ongeluk de map is die je
 * uploadt.
 */
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wortel = join(hier, '..')
const POORT = 4174
const vite = join(wortel, 'node_modules', 'vite', 'bin', 'vite.js')

const draai = (argumenten) => spawn(process.execPath, [vite, ...argumenten], {
  cwd: wortel, stdio: ['ignore', 'pipe', 'inherit'],
})

const bouw = draai(['build', '--mode', 'test', '--outDir', 'dist-test'])
const [bouwCode] = await once(bouw, 'exit')
if (bouwCode !== 0) process.exit(bouwCode ?? 1)

const server = draai(['preview', '--port', String(POORT), '--strictPort', '--outDir', 'dist-test'])
const klaar = new Promise((los) => {
  server.stdout.on('data', (blok) => { if (String(blok).includes(String(POORT))) los() })
})
await Promise.race([klaar, new Promise((l) => setTimeout(l, 8000))])

const rook = spawn(process.execPath, [join(hier, 'rook-koop.mjs'), `http://localhost:${POORT}`], {
  cwd: wortel, stdio: 'inherit',
})
const [code] = await once(rook, 'exit')
server.kill('SIGTERM')
process.exit(code ?? 1)
