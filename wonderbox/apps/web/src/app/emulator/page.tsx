import Link from 'next/link';
import { Notice, PageHeading } from '../../components/ui.tsx';
import { DeviceEmulator } from '../../components/device-emulator.tsx';
import { requireFamilyPage } from '../../lib/auth/guard.ts';
import { requestTranslator } from '../../lib/ui/locale.ts';
import { familyBoxes } from '../../server/activation.ts';
import { text } from '../../lib/i18n/localised.ts';
import { PROTOCOL_VERSION } from '@wonderbox/hardware-protocol';

/**
 * Engineering surface for HardwareCompanionProtocol. Behind a normal parent
 * session, because it drives real activation and real progress against the
 * signed-in family's own boxes — there is no privileged back door here.
 */
export default async function EmulatorPage() {
  const actor = await requireFamilyPage('/emulator');
  const { locale } = await requestTranslator();
  const boxes = await familyBoxes(actor.familyId);

  const options = boxes.map((box) => ({
    id: box.id,
    title:
      box.boxProduct.translations.find((entry) => entry.locale === locale)?.name ??
      box.boxProduct.sku,
    chapters: (box.boxProduct.journey?.chapters ?? []).map((chapter) => ({
      id: chapter.id,
      title: text(chapter.title, locale, chapter.key),
    })),
  }));

  return (
    <>
      <PageHeading
        title={`Device emulator · HardwareCompanionProtocol ${PROTOCOL_VERSION}`}
        description={
          locale === 'nl'
            ? 'Stuur echte protocolcommando’s en zie elk frame dat over de lijn gaat. Zo ontwikkelt het hardwareteam firmware tegen een draaiende host.'
            : 'Send real protocol commands and watch every frame on the wire. This is how the hardware team develops firmware against a running host.'
        }
      />
      <Notice>
        {locale === 'nl' ? (
          <>
            Zie <code>HARDWARE_PROTOCOL.md</code> voor de volledige beschrijving. De kindversie van
            hetzelfde protocol staat op{' '}
            <Link href="/play" className="underline">
              /play
            </Link>
            .
          </>
        ) : (
          <>
            See <code>HARDWARE_PROTOCOL.md</code> for the full description. The child-facing side of
            the same protocol lives at{' '}
            <Link href="/play" className="underline">
              /play
            </Link>
            .
          </>
        )}
      </Notice>
      {options.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--color-line)] p-8 text-center">
          {locale === 'nl'
            ? 'Activeer eerst een doos, dan kun je hier commando’s sturen.'
            : 'Activate a box first, then you can send commands here.'}
        </p>
      ) : (
        <DeviceEmulator boxes={options} locale={locale} />
      )}
    </>
  );
}
