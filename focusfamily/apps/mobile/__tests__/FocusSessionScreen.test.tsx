import { fireEvent, render } from '@testing-library/react-native';
import type { FocusEvent, FocusSession } from '@focusfamily/domain';
import { FocusSessionScreen, mergeIntoServer } from '@/components/FocusSessionScreen';

function makeSession(overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: 'fs-test',
    familyId: 'fam',
    scheduleId: null,
    participantIds: ['parent', 'child'],
    startedByUserId: 'parent',
    plannedMinutes: 30,
    status: 'running',
    events: [],
    source: 'app_observed',
    createdAt: new Date('2026-03-03T18:00:00Z'),
    ...overrides,
  };
}

describe('the focus screen', () => {
  it('starts with the full planned time and a large start button', async () => {
    const view = await render(<FocusSessionScreen session={makeSession()} locale="nl" />);
    expect(view.getByTestId('focus-timer')).toHaveTextContent('30:00');
    expect(view.getByTestId('focus-start')).toBeTruthy();
  });

  it('asks why, rather than assuming, when someone pauses', async () => {
    const view = await render(<FocusSessionScreen session={makeSession()} locale="nl" />);
    await fireEvent.press(view.getByTestId('focus-start'));
    await fireEvent.press(view.getByTestId('focus-pause'));
    expect(view.getByTestId('pause-reasons')).toBeTruthy();
    expect(view.getByTestId('pause-reason-someone_needed_me')).toBeTruthy();
    expect(view.getByTestId('pause-reason-changed_my_mind')).toBeTruthy();
  });

  it('resumes after a pause and can be completed', async () => {
    const view = await render(<FocusSessionScreen session={makeSession()} locale="nl" />);
    await fireEvent.press(view.getByTestId('focus-start'));
    await fireEvent.press(view.getByTestId('focus-pause'));
    await fireEvent.press(view.getByTestId('pause-reason-urgent_call'));
    expect(view.getByTestId('focus-resume')).toBeTruthy();
    await fireEvent.press(view.getByTestId('focus-resume'));
    await fireEvent.press(view.getByTestId('focus-complete'));
    expect(view.getByTestId('focus-done')).toBeTruthy();
  });

  it('keeps working offline and says so', async () => {
    const view = await render(
      <FocusSessionScreen session={makeSession()} locale="nl" isOnline={false} />,
    );
    expect(view.getByTestId('offline-notice')).toBeTruthy();
    await fireEvent.press(view.getByTestId('focus-start'));
    expect(view.getByTestId('queued-count')).toHaveTextContent('1');
  });

  it('holds the queue until a sync succeeds, then clears it', async () => {
    let accept = false;
    const seen: FocusEvent[][] = [];
    const onSync = jest.fn(async (events: readonly FocusEvent[]) => {
      seen.push([...events]);
      return accept;
    });

    const view = await render(
      <FocusSessionScreen session={makeSession()} locale="nl" onSync={onSync} />,
    );
    await fireEvent.press(view.getByTestId('focus-start'));
    expect(view.getByTestId('queued-count')).toHaveTextContent('1');

    accept = true;
    await fireEvent.press(view.getByTestId('focus-complete'));
    await view.findByTestId('focus-done');

    expect(onSync).toHaveBeenCalled();
    expect(seen.length).toBeGreaterThan(0);
    expect(view.queryByTestId('queued-count')).toBeNull();
  });

  it('reconciles an offline queue into the server copy without double counting', () => {
    const start = new Date('2026-03-03T18:00:00Z');
    const server = makeSession({
      events: [{ id: 'e1', type: 'start', at: start, reason: null, recordedOffline: false }],
    });
    const queue: FocusEvent[] = [
      {
        id: 'e2',
        type: 'complete',
        at: new Date('2026-03-03T18:28:00Z'),
        reason: null,
        recordedOffline: true,
      },
    ];
    const serverNow = new Date('2026-03-03T18:40:00Z');

    const first = mergeIntoServer(server, queue, serverNow);
    expect(first.appliedEventIds).toEqual(['e2']);
    expect(first.session.status).toBe('completed');

    const retry = mergeIntoServer(first.session, queue, serverNow);
    expect(retry.duplicateEventIds).toEqual(['e2']);
    expect(retry.session.events).toHaveLength(2);
  });
});
