import { useMemo } from 'react';
import type { FocusSession } from '@focusfamily/domain';
import { FocusSessionScreen } from '@/components/FocusSessionScreen';

/**
 * In the shipped app this session comes from the API. The demo build starts a
 * local one so the screen can be used without an account.
 */
export default function FocusScreen() {
  const session = useMemo<FocusSession>(
    () => ({
      id: 'demo-session',
      familyId: 'demo-family',
      scheduleId: null,
      participantIds: ['demo-parent', 'demo-child'],
      startedByUserId: 'demo-parent',
      plannedMinutes: 45,
      status: 'running',
      events: [],
      source: 'app_observed',
      createdAt: new Date(),
    }),
    [],
  );

  return <FocusSessionScreen session={session} locale="nl" />;
}
