import { render } from '@testing-library/react-native';
import type { FamilyAgreement } from '@focusfamily/domain';
import { AgreementList } from '@/components/AgreementList';

const createdAt = new Date('2026-02-01T00:00:00Z');

function agreement(audience: 'everyone' | 'children'): FamilyAgreement {
  return {
    id: 'a',
    familyId: 'fam',
    title: 'Onze afspraken',
    status: 'active',
    agreedByUserIds: [],
    createdByUserId: 'parent',
    createdAt,
    activatedAt: createdAt,
    reviewOnDayKey: null,
    rules: [
      {
        id: 'r1',
        agreementId: 'a',
        context: 'meals',
        kind: 'devices_away',
        audience,
        memberId: null,
        ageBands: [],
        startsAt: '18:00',
        endsAt: '19:00',
        weekdays: [],
        text: 'Telefoons in de mand tijdens het eten.',
        repairText: 'Vergeten? Dan leg je hem weg en eten we door.',
        createdAt,
      },
    ],
  };
}

describe('what applies to me', () => {
  it('shows a child the rule and the repair line, not a punishment', async () => {
    const view = await render(
      <AgreementList
        agreement={agreement('everyone')}
        memberId="child"
        ageBand="14-17"
        locale="nl"
      />,
    );
    expect(view.getByTestId('rule-r1')).toBeTruthy();
    expect(view.getByText('Telefoons in de mand tijdens het eten.')).toBeTruthy();
    expect(view.getByText('Vergeten? Dan leg je hem weg en eten we door.')).toBeTruthy();
  });

  it('shows the very same rule to a grown-up', async () => {
    const view = await render(
      <AgreementList
        agreement={agreement('everyone')}
        memberId="parent"
        ageBand="adult"
        locale="nl"
      />,
    );
    expect(view.getByTestId('rule-r1')).toBeTruthy();
    expect(view.getByTestId('adult-rule-count')).toHaveTextContent('1');
  });

  it('flags an agreement that asks nothing of the grown-ups', async () => {
    const view = await render(
      <AgreementList
        agreement={agreement('children')}
        memberId="child"
        ageBand="14-17"
        locale="nl"
      />,
    );
    expect(view.getByTestId('agreement-issues')).toBeTruthy();
    expect(
      view.getByText(/Minstens één regel moet ook voor de volwassenen gelden/),
    ).toBeTruthy();
  });
});
