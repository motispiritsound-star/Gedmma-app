import { fireEvent, render } from '@testing-library/react-native';
import { CheckInForm } from '@/components/CheckInForm';
import { SourceBadge } from '@/components/SourceBadge';

describe('source badges', () => {
  it('names the provenance in Dutch', async () => {
    const view = await render(<SourceBadge kind="simulated" locale="nl" />);
    expect(view.getByText(/Voorbeeldgegevens/)).toBeTruthy();
  });

  it('names the same provenance in English', async () => {
    const view = await render(<SourceBadge kind="simulated" locale="en" />);
    expect(view.getByText(/Example data/)).toBeTruthy();
  });

  it('explains what the provenance means when asked to', async () => {
    const view = await render(<SourceBadge kind="self_reported" locale="nl" explain />);
    expect(view.getByText(/Iemand in het gezin heeft dit ingetypt/)).toBeTruthy();
  });

  it('gives assistive technology the confidence as well as the label', async () => {
    const view = await render(<SourceBadge kind="os_verified" confidence="high" locale="nl" />);
    expect(view.getByLabelText('Door de telefoon gemeld, Gemeten')).toBeTruthy();
  });

  it('marks simulated data as simulated, never as a measurement', async () => {
    const view = await render(<SourceBadge kind="simulated" locale="nl" explain />);
    expect(view.getByTestId('source-badge-simulated')).toBeTruthy();
    expect(view.getByText(/verzonnen demogegevens/)).toBeTruthy();
  });
});

describe('the check-in form', () => {
  it('uses warm, non-clinical wording', async () => {
    const view = await render(<CheckInForm locale="nl" onSubmit={() => undefined} />);
    expect(view.getByText('Hoe was vandaag?')).toBeTruthy();
    expect(view.getByText('Een zware dag')).toBeTruthy();
    expect(view.getByText('Was er vandaag gedoe over schermen?')).toBeTruthy();
  });

  it('keeps a note private unless sharing is switched on', async () => {
    const onSubmit = jest.fn();
    const view = await render(<CheckInForm locale="nl" onSubmit={onSubmit} />);

    await fireEvent.press(view.getByTestId('mood-4'));
    await fireEvent.press(view.getByTestId('checkin-submit'));
    expect(onSubmit).toHaveBeenCalledWith({
      mood: 4,
      conflict: 'none',
      sharedWithFamily: false,
    });

    await fireEvent.press(view.getByTestId('share-toggle'));
    await fireEvent.press(view.getByTestId('checkin-submit'));
    expect(onSubmit).toHaveBeenLastCalledWith({
      mood: 4,
      conflict: 'none',
      sharedWithFamily: true,
    });
  });
});
