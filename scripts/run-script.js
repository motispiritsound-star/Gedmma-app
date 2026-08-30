/** Draait een npm-script in alle workspaces die het kennen. */
import { spawnSync } from 'node:child_process';
import { metScript, repoRoot } from './_workspaces.js';

export function draaiOveralen(script, { doorgaanBijFout = false } = {}) {
  const pakketten = metScript(script);
  if (pakketten.length === 0) {
    console.log(`Geen enkel pakket heeft een "${script}"-script - overgeslagen.`);
    return 0;
  }
  let fouten = 0;
  for (const pakket of pakketten) {
    console.log(`\n>> ${pakket.naam} - npm run ${script}`);
    const uitkomst = spawnSync('npm', ['run', '--silent', '-w', pakket.naam, script], {
      cwd: repoRoot,
      stdio: 'inherit',
      env: process.env,
    });
    if (uitkomst.status !== 0) {
      fouten++;
      console.error(`FOUT: ${pakket.naam} - "${script}" is mislukt`);
      if (!doorgaanBijFout) return 1;
    }
  }
  return fouten === 0 ? 0 : 1;
}
