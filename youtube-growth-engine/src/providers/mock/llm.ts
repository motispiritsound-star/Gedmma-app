import type { LlmProvider, ProviderResult } from '../contracts.js'
import type { Claim, LanguageCode, Script, Shot, Source, VideoMetadata } from '../../domain/types.js'

const ok = <T>(value: T, costCents: number, ref: string): ProviderResult<T> =>
  ({ value, costCents, latencyMs: 40, providerRef: ref })

/**
 * Mock-taalmodel. Levert twee vaste producties:
 *
 *  - `medina`  — volledig onderbouwd; doorloopt alle poorten.
 *  - `losse-hadith` — een hadith zonder gradering. Die hoort te blokkeren op de
 *    religieuze integriteitspoort, en dat is de belangrijkste eigenschap van
 *    het hele systeem: een poort die nooit afwijst, staat te laag afgesteld.
 */
export class MockLlmProvider implements LlmProvider {
  readonly name: string = 'mock-llm'
  readonly simulated = true as const

  async proposeThesis(input: { topic: string }) {
    if (input.topic === 'geen-stelling') {
      // Geen invulbare stelling betekent geen script. Kosten tot hier: ~EUR 0,20.
      return ok(null, 3, 'mock:thesis:none')
    }
    return ok(
      {
        thesis:
          'Deze video betoogt dat de eenvoud van de eerste moskee in Medina geen ' +
          'gebrek aan middelen was, maar een bewuste keuze die laat zien waar een ' +
          'gebedsruimte volgens de vroege praktijk werkelijk om draait.',
        originalityBrief:
          'De referenties tonen moskeeën als architectonisch spektakel. De publieksvraag ' +
          'die daaronder ligt — "waarom ziet een moskee eruit zoals hij eruitziet?" — ' +
          'blijft onbeantwoord. Wij nemen de omgekeerde positie in: we beginnen bij het ' +
          'gebouw zonder koepel en zonder minaret, en laten zien welke functies er later ' +
          'bij kwamen en waarom. Nieuw onderzoek: de beschrijvingen uit de vroege ' +
          'historische werken naast de huidige praktijk in Nederlandse moskeeën. Eigen ' +
          'voorbeelden: drie Nederlandse moskeeën die verschillende keuzes maakten. ' +
          'Structuur loopt chronologisch achterstevoren, van nu naar toen.',
      },
      18,
      'mock:thesis:medina',
    )
  }

  async research(input: { thesis: string; language: LanguageCode }) {
    const sources: Source[] = [
      {
        id: 'src-quran-2-144', kind: 'primary', work: 'Koran',
        locator: '2:144',
        translation: 'Nederlandse vertaling — te kiezen en te licentiëren vóór M2',
        retrievedAt: new Date().toISOString(),
      },
      {
        id: 'src-bukhari-446', kind: 'primary', work: 'Sahih al-Bukhari',
        locator: 'boek 8, hadith 446', grading: 'sahih', gradedBy: 'al-Bukhari',
        retrievedAt: new Date().toISOString(),
      },
      {
        id: 'src-sira', kind: 'primary', work: 'Sira Ibn Hisham',
        locator: 'deel 2, hoofdstuk over de aankomst in Medina',
        retrievedAt: new Date().toISOString(),
      },
      {
        id: 'src-fiqh-verschil', kind: 'primary', work: 'Naslagwerk over de vier scholen',
        locator: 'hoofdstuk over moskeeën en toevoegingen',
        retrievedAt: new Date().toISOString(),
      },
      {
        id: 'src-cbs-moskeeen', kind: 'secondary', work: 'CBS',
        locator: 'Religieuze gebouwen in Nederland, tabel 3',
        retrievedAt: new Date().toISOString(),
      },
    ]
    return ok(
      {
        brief:
          `Onderzoeksbrief bij: ${input.thesis.slice(0, 70)}… ` +
          'Vier bronnen, waarvan drie primair. De brief wordt hergebruikt in het ' +
          'script, de factcheck, de shotlist en de metadata (prompt caching).',
        sources,
      },
      72,
      'mock:research',
    )
  }

  async writeScript(input: {
    thesis: string; sources: Source[]; language: LanguageCode; targetSeconds: number
  }) {
    const script: Script = {
      thesis: input.thesis,
      hook:
        'De bekendste moskee ter wereld had bij de bouw geen koepel, geen minaret ' +
        'en geen vloer. Dat was geen armoede.',
      promise:
        'In tien minuten weet je welk onderdeel van een moskee er als eerste was, ' +
        'welk onderdeel er pas eeuwen later bij kwam, en waarom dat verschil uitmaakt ' +
        'voor de moskee bij jou om de hoek.',
      segments: [
        {
          title: 'Wat er stond',
          body:
            'Palmstammen als pilaren, palmbladeren als dak, een vloer van zand. ' +
            'Historische beschrijvingen noemen de maten; die maten zijn kleiner dan ' +
            'de gemiddelde Nederlandse gymzaal.',
          opensLoop: 'Eén onderdeel ontbrak dat vandaag in elke moskee staat.',
        },
        {
          title: 'Waar de gebedsrichting vandaan komt',
          body:
            'De richting van het gebed veranderde, en dat moment staat in de Koran ' +
            'beschreven. Wat dat betekende voor een gebouw dat al gebouwd was, is ' +
            'concreter dan je zou denken.',
        },
        {
          title: 'Het onderdeel dat ontbrak',
          body:
            'De minaret. Die kwam later, om een praktische reden die niets met ' +
            'architectuur te maken had, en de vroege praktijk werkte zonder.',
          closesLoop: 'Het ontbrekende onderdeel was de minaret.',
        },
        {
          title: 'Nederland, nu',
          body:
            'Drie Nederlandse moskeeën maakten elk een andere keuze. Twee zonder ' +
            'minaret, één met. Alle drie functioneren.',
        },
      ],
      counterArgument:
        'Je zou kunnen zeggen: latere toevoegingen zijn juist verrijking, geen afwijking. ' +
        'Dat is een serieus punt, en een deel van de geleerden ziet het zo.',
      conclusion:
        'De eenvoud was functioneel, niet ascetisch. Wat erbij kwam, kwam erbij om ' +
        'een reden — en dat is iets anders dan dat het er altijd was.',
      callToAction:
        'Weet jij welke keuze de moskee bij jou in de buurt maakte? Schrijf het eronder.',
      wordCount: Math.round(input.targetSeconds * 2.2),
    }

    const claims: Claim[] = [
      {
        id: 'c1', claimClass: 'history',
        text: 'De eerste moskee in Medina had palmstammen als pilaren en een dak van palmbladeren.',
        sourceIds: ['src-sira'], atSecond: 35, notesScholarlyDifference: false,
      },
      {
        id: 'c2', claimClass: 'quran',
        text: 'De verandering van de gebedsrichting is in de Koran beschreven.',
        sourceIds: ['src-quran-2-144'], atSecond: 210, notesScholarlyDifference: false,
      },
      {
        id: 'c3', claimClass: 'hadith',
        text: 'Er is een overlevering over hoe het gebed in de vroege moskee werd aangekondigd.',
        sourceIds: ['src-bukhari-446'], atSecond: 380, notesScholarlyDifference: false,
      },
      {
        id: 'c4', claimClass: 'fiqh',
        text: 'Over de status van latere toevoegingen aan een moskee verschillen geleerden.',
        sourceIds: ['src-fiqh-verschil'], atSecond: 520,
        attributedTo: 'meerdere scholen', notesScholarlyDifference: true,
      },
      {
        id: 'c5', claimClass: 'general',
        text: 'Nederland telt honderden moskeeën, waarvan een minderheid een minaret heeft.',
        sourceIds: ['src-cbs-moskeeen'], atSecond: 560, notesScholarlyDifference: false,
      },
    ]
    return ok({ script, claims }, 41, 'mock:script')
  }

  async buildShotlist(input: { totalSeconds: number }) {
    // Elke verhalende scène is figureFree: geen menselijke figuren. Zie docs/12 §2.
    const plan: { d: string; free: boolean; arabic?: string }[] = [
      { d: 'Palmstammen tegen ochtendlicht, lage camera, langzame duw', free: true },
      { d: 'Zandvloer in close-up, korrels in tegenlicht', free: true },
      { d: 'Plattegrond die zich lijnvoor lijn opbouwt', free: true },
      { d: 'Kalligrafie van de ayah, opbouwend', free: true, arabic: 'ar-2-144' },
      { d: 'Kompasroos die van noord naar zuid draait', free: true },
      { d: 'Silhouet van een daklijn zonder minaret', free: true },
      { d: 'Dezelfde daklijn, eeuwen later, met minaret', free: true },
      { d: 'Drie Nederlandse gevels naast elkaar', free: true },
      { d: 'Kaart van Nederland met gemarkeerde punten', free: true },
      { d: 'Slotbeeld: lege gebedsruimte, zacht licht', free: true },
    ]
    const per = input.totalSeconds / plan.length
    const shots: Shot[] = plan.map((s, i) => ({
      index: i,
      fromSecond: Math.round(i * per),
      toSecond: Math.round((i + 1) * per),
      description: s.d,
      figureFree: s.free,
      ...(s.arabic ? { arabicAssetId: s.arabic } : {}),
    }))
    return ok(shots, 29, 'mock:shotlist')
  }

  async writeMetadata(input: { language: LanguageCode; hasPhotorealisticScenes: boolean }) {
    const meta: VideoMetadata = {
      titleOptions: [
        'De eerste moskee had geen minaret. Dat was geen toeval.',
        'Wat er als eerste stond, en wat er pas later bij kwam',
        'Waarom een moskee eruitziet zoals hij eruitziet',
      ],
      description:
        'Bronnen staan hieronder, met soera, ayah en hadithnummer. Deze video is ' +
        'gemaakt met AI-hulpmiddelen voor stem en beeld; de inhoud is gecontroleerd ' +
        'aan de hand van de genoemde bronnen.',
      chapters: [
        { atSecond: 0, label: 'Wat er stond' },
        { atSecond: 180, label: 'De gebedsrichting' },
        { atSecond: 360, label: 'Het onderdeel dat ontbrak' },
        { atSecond: 510, label: 'Nederland, nu' },
      ],
      tags: ['islam', 'geschiedenis', 'moskee', 'medina', 'gezin', 'uitleg'],
      pinnedComment:
        'De bronnen staan in de beschrijving. Zie je een fout? Zeg het — dan ' +
        'corrigeer ik het hier zichtbaar.',
      aiDisclosureRequired: input.hasPhotorealisticScenes,
    }
    return ok(meta, 6, `mock:metadata:${input.language}`)
  }

  async translateScript(input: { script: Script; to: LanguageCode }) {
    // Hervoicen hergebruikt onderzoek, bronnen, shotlist en beeld: ~26% van
    // de kosten van een nieuwe video. Zie docs/11 §4.
    return ok(
      { ...input.script, thesis: `[${input.to}] ${input.script.thesis}` },
      14,
      `mock:translate:${input.to}`,
    )
  }
}

/** Variant die een hadith zonder gradering levert; hoort te blokkeren. */
export class MockLlmProviderWithUngradedHadith extends MockLlmProvider {
  override readonly name = 'mock-llm-ongegradeerde-hadith'

  override async research(input: { thesis: string; language: LanguageCode }) {
    const base = await super.research(input)
    const sources: Source[] = base.value.sources.map((s) => {
      if (s.id !== 'src-bukhari-446') return s
      const { grading: _g, gradedBy: _b, ...zonderGradering } = s
      return zonderGradering
    })
    return { ...base, value: { ...base.value, sources } }
  }
}
