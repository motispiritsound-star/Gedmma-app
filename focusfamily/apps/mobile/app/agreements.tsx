import { ScrollView } from 'react-native';
import type { FamilyAgreement } from '@focusfamily/domain';
import { AgreementList } from '@/components/AgreementList';
import { styles } from '@/lib/theme';

const createdAt = new Date('2026-02-01T00:00:00Z');

const demoAgreement: FamilyAgreement = {
  id: 'demo-agreement',
  familyId: 'demo-family',
  title: 'Onze afspraken',
  status: 'active',
  agreedByUserIds: [],
  createdByUserId: 'demo-parent',
  createdAt,
  activatedAt: createdAt,
  reviewOnDayKey: null,
  rules: [
    {
      id: 'demo-meals',
      agreementId: 'demo-agreement',
      context: 'meals',
      kind: 'devices_away',
      audience: 'everyone',
      memberId: null,
      ageBands: [],
      startsAt: '18:00',
      endsAt: '19:00',
      weekdays: [],
      text: 'Tijdens het eten liggen alle telefoons in de mand in de gang.',
      repairText: 'Vergeet iemand het, dan legt die hem weg en eten we door.',
      createdAt,
    },
    {
      id: 'demo-bedtime',
      agreementId: 'demo-agreement',
      context: 'bedtime',
      kind: 'charge_outside_bedroom',
      audience: 'everyone',
      memberId: null,
      ageBands: [],
      startsAt: '21:00',
      endsAt: '07:00',
      weekdays: [],
      text: 'Vanaf negen uur laadt elke telefoon op in de keuken, die van ons ook.',
      repairText: 'Vergeten? Breng hem naar beneden zodra je het merkt.',
      createdAt,
    },
  ],
};

export default function AgreementsScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AgreementList
        agreement={demoAgreement}
        memberId="demo-child"
        ageBand="14-17"
        locale="nl"
      />
    </ScrollView>
  );
}
