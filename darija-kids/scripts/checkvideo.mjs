/**
 * Checks a recorded film actually plays: right size, right length, frames that
 * are not blank, and sound that is not silence.
 *
 * There is no ffprobe here, so the browser that wrote the file is also the one
 * that reads it back.
 *
 * Run with: node scripts/checkvideo.mjs store/video/nl/intro-verhaal.mp4
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const files = process.argv.slice(2)
if (!files.length) throw new Error('geef minstens één bestand mee')

const browser = await chromium.launch({
  executablePath: CHROME,
  args: ['--autoplay-policy=no-user-gesture-required'],
})
const page = await browser.newPage()
await page.goto('about:blank')

let bad = 0
for (const file of files) {
  const bytes = await readFile(file)
  const report = await page.evaluate(async ([data, type]) => {
    const bin = Uint8Array.from(atob(data), (c) => c.charCodeAt(0))
    const blob = new Blob([bin], { type })
    const url = URL.createObjectURL(blob)

    const video = document.createElement('video')
    video.src = url
    video.muted = true
    await new Promise((resolve, reject) => {
      video.onloadeddata = resolve
      video.onerror = () => reject(new Error('kan de film niet openen'))
    })
    // A stream recording reports Infinity until it has been played to the end.
    if (!Number.isFinite(video.duration)) {
      video.currentTime = 1e6
      await new Promise((r) => { video.onseeked = r })
    }

    // A handful of frames, spread over the film: how much of each is not the
    // background, so a blank one stands out.
    const canvas = document.createElement('canvas')
    canvas.width = 120
    canvas.height = Math.round((120 * video.videoHeight) / video.videoWidth)
    const ctx = canvas.getContext('2d')
    const frames = []
    for (const at of [0.5, 5, 10, 15, 20, 25, 28]) {
      if (at > video.duration) break
      video.currentTime = at
      await new Promise((r) => { video.onseeked = r })
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let sum = 0
      let sq = 0
      for (let i = 0; i < px.length; i += 4) {
        const v = (px[i] + px[i + 1] + px[i + 2]) / 3
        sum += v
        sq += v * v
      }
      const n = px.length / 4
      const mean = sum / n
      frames.push({ at, spread: Math.round(Math.sqrt(sq / n - mean * mean)) })
    }

    // The sound, decoded straight out of the same file.
    let audio = null
    try {
      const ac = new OfflineAudioContext(1, 48000, 48000)
      const buffer = await ac.decodeAudioData(bin.buffer.slice(0))
      const ch = buffer.getChannelData(0)
      let peak = 0
      let energy = 0
      let loud = 0
      for (let i = 0; i < ch.length; i++) {
        const v = Math.abs(ch[i])
        if (v > peak) peak = v
        energy += v * v
        if (v > 0.02) loud++
      }
      audio = {
        seconds: Number(buffer.duration.toFixed(2)),
        channels: buffer.numberOfChannels,
        peak: Number(peak.toFixed(3)),
        rms: Number(Math.sqrt(energy / ch.length).toFixed(4)),
        loudPart: Number((loud / ch.length).toFixed(3)),
      }
    } catch (e) {
      audio = { error: String(e) }
    }

    URL.revokeObjectURL(url)
    return { width: video.videoWidth, height: video.videoHeight, seconds: Number(video.duration.toFixed(2)), frames, audio }
  }, [bytes.toString('base64'), file.endsWith('.mp4') ? 'video/mp4' : 'video/webm'])

  const blank = report.frames.filter((f) => f.spread < 6).map((f) => `${f.at}s`)
  const silent = !report.audio || report.audio.error || report.audio.peak < 0.05
  console.log(
    `${path.basename(file)} — ${report.width}×${report.height}, ${report.seconds}s beeld, ` +
      `${report.audio?.seconds ?? '?'}s geluid (piek ${report.audio?.peak ?? '?'}, ` +
      `rms ${report.audio?.rms ?? '?'}, ${Math.round((report.audio?.loudPart ?? 0) * 100)}% hoorbaar)`,
  )
  console.log(`  beeld: ${report.frames.map((f) => `${f.at}s=${f.spread}`).join('  ')}`)
  if (blank.length) { console.log(`  LEEG BEELD op ${blank.join(', ')}`); bad++ }
  if (silent) { console.log(`  GEEN GELUID${report.audio?.error ? `: ${report.audio.error}` : ''}`); bad++ }
}

await browser.close()
if (bad) process.exit(1)
console.log('\nalles in orde')
