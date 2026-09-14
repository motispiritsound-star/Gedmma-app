import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { EMPTY_PACK, KnowledgePackSchema, type KnowledgePack } from './types.js'

/** Vervangt `null` door `undefined`, ook een niveau dieper. */
function dropNulls(value: unknown): unknown {
  if (value === null) return undefined
  if (Array.isArray(value)) return value.map(dropNulls)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, dropNulls(v)]),
    )
  }
  return value
}

export interface LoadReport {
  pack: KnowledgePack
  /** Bestanden die zijn gelezen. */
  filesRead: string[]
  /** Problemen die het laden niet tegenhielden, maar die je wilt weten. */
  warnings: string[]
}

/**
 * Leest `knowledge/` in. Elk bestand is optioneel: ontbreekt er een, dan blijft
 * dat deel leeg en draait de pipeline gewoon door met minder invoer.
 *
 * Losse `.md`-bestanden gaan als vrije tekst naar `ownInput`. Dat is met opzet:
 * je moet iets kunnen neerplakken zonder eerst een structuur te bedenken.
 */
export async function loadKnowledge(dir = 'knowledge'): Promise<LoadReport> {
  const filesRead: string[] = []
  const warnings: string[] = []
  let raw: Record<string, unknown> = {}
  const freeText: string[] = []

  let entries: string[]
  try {
    entries = await readdir(dir)
  } catch {
    return { pack: EMPTY_PACK, filesRead: [], warnings: [`Map ${dir} bestaat niet.`] }
  }

  for (const name of entries.sort()) {
    const path = join(dir, name)
    if (name.endsWith('.yaml') || name.endsWith('.yml')) {
      try {
        const parsed = parseYaml(await readFile(path, 'utf8')) as Record<string, unknown> | null
        if (parsed && typeof parsed === 'object') {
          raw = { ...raw, ...parsed }
          filesRead.push(path)
        }
      } catch (error) {
        warnings.push(`${path} is geen geldige YAML: ${String(error)}`)
      }
    } else if (name.endsWith('.md')) {
      const text = (await readFile(path, 'utf8')).trim()
      // Regels die met > beginnen zijn uitleg in het sjabloon, geen inhoud.
      const content = text.split('\n').filter((l) => !l.startsWith('>')).join('\n').trim()
      if (content) {
        freeText.push(`### ${name}\n${content}`)
        filesRead.push(path)
      }
    }
  }

  if (freeText.length > 0) {
    const existing = typeof raw['ownInput'] === 'string' ? raw['ownInput'] : ''
    raw['ownInput'] = [existing, ...freeText].filter(Boolean).join('\n\n')
  }

  // Een YAML-sleutel met alleen commentaar eronder levert `null`, niet een lege
  // lijst. Dat is geen fout van de gebruiker, dus behandel het als 'niet
  // ingevuld' en laat de standaardwaarde zijn werk doen.
  const result = KnowledgePackSchema.safeParse(dropNulls(raw))
  if (!result.success) {
    for (const issue of result.error.issues) {
      warnings.push(`${issue.path.join('.') || '(wortel)'}: ${issue.message}`)
    }
    return { pack: EMPTY_PACK, filesRead, warnings }
  }

  const pack = result.data

  // Arabische assets zonder naam van een controleur tellen niet. Zie docs/12 §3.
  const unverified = pack.arabicAssets.filter((a) => !a.verifiedBy)
  if (unverified.length > 0) {
    warnings.push(
      `${unverified.length} Arabische asset(s) zonder \`verifiedBy\`. Die worden ` +
      'niet gebruikt: Arabische tekst telt alleen mee als een mens hem heeft ' +
      'gecontroleerd, en dan wil je weten wie.',
    )
  }

  return { pack, filesRead, warnings }
}

/** Id's van Arabische assets die een mens heeft gecontroleerd. */
export function verifiedArabicIds(pack: KnowledgePack): Set<string> {
  return new Set(pack.arabicAssets.filter((a) => a.verifiedBy).map((a) => a.id))
}

/** Titels van referenties, voor de quarantaine en de afstandsmeting. */
export function seedTitles(pack: KnowledgePack): string[] {
  return pack.references.map((r) => r.title).filter(Boolean)
}

/** Het eerstvolgende onderwerp uit de wachtrij, seizoen en prioriteit eerst. */
export function nextTopic(pack: KnowledgePack, season?: string) {
  const open = pack.topics.filter((t) => t.status === 'open')
  const rank = { hoog: 0, normaal: 1, laag: 2 } as const
  return [...open].sort((a, b) => {
    if (season) {
      const aSeason = a.season === season ? 0 : 1
      const bSeason = b.season === season ? 0 : 1
      if (aSeason !== bSeason) return aSeason - bSeason
    }
    return rank[a.priority] - rank[b.priority]
  })[0]
}
