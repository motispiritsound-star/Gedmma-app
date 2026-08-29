import Link from 'next/link';
import { Card, PageHeading } from '../../components/ui.tsx';
import { requestTranslator } from '../../lib/ui/locale.ts';
import { POLICY_VERSION } from '../../server/privacy.ts';

/** The public statement. The machinery behind it is in SECURITY_AND_PRIVACY.md. */
export default async function PublicPrivacyPage() {
  const { locale } = await requestTranslator();

  const sections =
    locale === 'nl'
      ? [
          [
            'Geen advertenties, geen profielen',
            'We verkopen geen gegevens, we tonen geen advertenties en we bouwen geen gedragsprofielen. Er is geen openbaar profiel van je kind, geen vriendenlijst en geen manier waarop iemand anders je kind kan bereiken.',
          ],
          [
            'Geen vrije AI-chat met kinderen',
            'Alles wat het maatje zegt is vooraf geschreven en door een mens goedgekeurd. Er is geen taalmodel dat live antwoorden verzint tegen een kind. Redacteuren mogen wel AI gebruiken om concepten te schrijven, maar zo’n concept kan niet gepubliceerd worden zonder dat een tweede mens het goedkeurt.',
          ],
          [
            'Geen opnames van de stem van je kind',
            'Standaard staat de microfoon uit. Als je spraakherkenning zelf aanzet, wordt de opname direct na het herkennen weggegooid en verlaat hij nooit onze server. Je kunt het altijd weer uitzetten.',
          ],
          [
            'Wat we wel bewaren',
            'Je account, je adres, je bestellingen en facturen, en welke hoofdstukken er geluisterd zijn. Die luistergeschiedenis is er zodat een doos verder kan waar je kind gebleven was en zodat jij kunt zien wat er gedaan is.',
          ],
          [
            'Hoe lang',
            'Luistergebeurtenissen ruim een jaar, facturen zeven jaar omdat de wet dat vraagt, en het audit-logboek twee jaar. Daarna wordt het automatisch opgeruimd.',
          ],
          [
            'Je gegevens ophalen of laten verwijderen',
            'Onder Privacy en gegevens in je account kun je alles downloaden of laten verwijderen. Facturen blijven staan, omdat de belastingdienst dat verplicht; ze worden dan losgekoppeld van je naam.',
          ],
        ]
      : [
          [
            'No advertising, no profiles',
            'We do not sell data, we show no advertising and we build no behavioural profiles. Your child has no public profile, no friends list, and there is no way for anyone else to reach them.',
          ],
          [
            'No open AI chat with children',
            'Everything the companion says is written in advance and approved by a person. There is no language model inventing replies to a child in real time. Editors may use AI to write drafts, but a draft cannot be published without a second human approving it.',
          ],
          [
            'No recordings of your child’s voice',
            'The microphone is off by default. If you turn speech recognition on yourself, the recording is discarded immediately after recognition and never leaves our server. You can turn it off again at any time.',
          ],
          [
            'What we do keep',
            'Your account, your address, your orders and invoices, and which chapters have been listened to. That listening history exists so a box can pick up where your child left off and so you can see what was done.',
          ],
          [
            'For how long',
            'Listening events for a bit over a year, invoices for seven years because the law requires it, and the audit log for two years. After that it is cleared automatically.',
          ],
          [
            'Getting your data, or having it deleted',
            'Under Privacy and data in your account you can download everything or have it deleted. Invoices stay, because tax law requires them; they are detached from your name.',
          ],
        ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        title={locale === 'nl' ? 'Privacy' : 'Privacy'}
        description={
          locale === 'nl'
            ? `Versie ${POLICY_VERSION}. In gewone taal, want je moet het kunnen lezen.`
            : `Version ${POLICY_VERSION}. In plain language, because you should be able to read it.`
        }
      />
      <div className="space-y-4">
        {sections.map(([title, body]) => (
          <Card key={title}>
            <h2 className="font-bold">{title}</h2>
            <p className="mt-2 text-[var(--color-ink-soft)]">{body}</p>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-sm">
        <Link href="/support" className="underline">
          {locale === 'nl'
            ? 'Vraag over je gegevens? Stuur ons een bericht.'
            : 'A question about your data? Send us a message.'}
        </Link>
      </p>
    </div>
  );
}
