import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  pauseReasons,
  reconcileSession,
  sessionProgress,
  translate,
  type FocusEvent,
  type FocusSession,
  type Locale,
  type PauseReason,
} from '@focusfamily/domain';
import { styles } from '@/lib/theme';
import { ui } from '@/lib/strings';

export interface FocusSessionScreenProps {
  readonly session: FocusSession;
  readonly locale: Locale;
  /** Injected so tests can drive time without waiting for it. */
  readonly now?: () => Date;
  /** Returns true when the queue reached the server. */
  readonly onSync?: (events: readonly FocusEvent[]) => Promise<boolean>;
  readonly isOnline?: boolean;
}

function formatDuration(minutesFloat: number): string {
  const totalSeconds = Math.max(0, Math.round(minutesFloat * 60));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * The large, deliberately calm focus screen.
 *
 * The timer is local: every tap appends an event to an in-memory queue, the
 * elapsed time is derived from that queue, and the queue is only then handed
 * to the server. Losing the connection changes nothing about what the family
 * sees, which is the whole point of a shared moment that does not depend on
 * anyone's signal.
 */
export function FocusSessionScreen({
  session,
  locale,
  now = () => new Date(),
  onSync,
  isOnline = true,
}: FocusSessionScreenProps) {
  const [events, setEvents] = useState<FocusEvent[]>(session.events);
  const [queued, setQueued] = useState<FocusEvent[]>([]);
  const [askingReason, setAskingReason] = useState(false);
  const [tick, setTick] = useState(0);
  const syncing = useRef(false);

  useEffect(() => {
    const handle = setInterval(() => setTick((value) => value + 1), 1000);
    return () => clearInterval(handle);
  }, []);

  const flush = useCallback(async () => {
    if (!onSync || syncing.current || queued.length === 0 || !isOnline) return;
    syncing.current = true;
    try {
      const accepted = await onSync(queued);
      if (accepted) setQueued([]);
    } finally {
      syncing.current = false;
    }
  }, [isOnline, onSync, queued]);

  useEffect(() => {
    void flush();
  }, [flush]);

  const append = useCallback(
    (type: FocusEvent['type'], reason: PauseReason | null = null) => {
      const event: FocusEvent = {
        id: `${session.id}-${type}-${Date.now()}`,
        type,
        at: now(),
        reason,
        recordedOffline: !isOnline,
      };
      setEvents((current) => [...current, event]);
      setQueued((current) => [...current, event]);
    },
    [isOnline, now, session.id, now],
  );

  const progress = useMemo(
    () => sessionProgress({ events, status: session.status }, now()),
    // `tick` keeps the derived value moving while the session runs.
    [events, session.status, tick],
  );

  const started = events.some((event) => event.type === 'start');
  const remaining = Math.max(0, session.plannedMinutes - progress.focusedMinutes);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        {translate(locale, 'focus.title.dinner')}
      </Text>

      <Text
        style={styles.timer}
        accessibilityRole="text"
        accessibilityLiveRegion="polite"
        testID="focus-timer"
        accessibilityLabel={`${progress.focusedMinutes} ${ui(locale, 'minutes')}`}
      >
        {formatDuration(started ? remaining : session.plannedMinutes)}
      </Text>

      <Text style={[styles.body, { textAlign: 'center' }]} testID="focus-progress">
        {progress.focusedMinutes} / {session.plannedMinutes}
      </Text>

      {!isOnline ? (
        <View style={[styles.notice, styles.noticeWarm]} testID="offline-notice">
          <Text style={styles.body}>{translate(locale, 'focus.offline_note')}</Text>
        </View>
      ) : null}

      {queued.length > 0 ? (
        <Text style={styles.body} testID="queued-count">
          {queued.length}
        </Text>
      ) : null}

      {askingReason ? (
        <View style={styles.card} testID="pause-reasons">
          <Text style={styles.cardTitle}>{translate(locale, 'focus.pause.prompt')}</Text>
          {pauseReasons.map((reason) => (
            <Pressable
              key={reason}
              accessibilityRole="button"
              style={styles.buttonSecondary}
              testID={`pause-reason-${reason}`}
              onPress={() => {
                append('pause', reason);
                setAskingReason(false);
              }}
            >
              <Text style={styles.buttonSecondaryText}>
                {translate(locale, `focus.pause.${reason}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {progress.status === 'running' && !started ? null : null}
          {!started ? (
            <Pressable
              accessibilityRole="button"
              style={[styles.button, styles.bigButton]}
              testID="focus-start"
              onPress={() => append('start')}
            >
              <Text style={[styles.buttonText, styles.bigButtonText]}>
                {translate(locale, 'focus.start')}
              </Text>
            </Pressable>
          ) : null}

          {started && progress.status === 'running' ? (
            <>
              <Pressable
                accessibilityRole="button"
                style={[styles.buttonSecondary, styles.bigButton]}
                testID="focus-pause"
                onPress={() => setAskingReason(true)}
              >
                <Text style={[styles.buttonSecondaryText, styles.bigButtonText]}>
                  {translate(locale, 'focus.pause')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[styles.button, styles.bigButton]}
                testID="focus-complete"
                onPress={() => append('complete')}
              >
                <Text style={[styles.buttonText, styles.bigButtonText]}>
                  {translate(locale, 'focus.complete')}
                </Text>
              </Pressable>
            </>
          ) : null}

          {progress.status === 'paused' ? (
            <>
              <Pressable
                accessibilityRole="button"
                style={[styles.button, styles.bigButton]}
                testID="focus-resume"
                onPress={() => append('resume')}
              >
                <Text style={[styles.buttonText, styles.bigButtonText]}>
                  {translate(locale, 'focus.resume')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.buttonSecondary}
                testID="focus-abandon"
                onPress={() => append('abandon')}
              >
                <Text style={styles.buttonSecondaryText}>
                  {translate(locale, 'focus.abandon')}
                </Text>
              </Pressable>
            </>
          ) : null}

          {progress.status === 'completed' ? (
            <View style={[styles.notice, styles.noticeGood]} testID="focus-done">
              <Text style={styles.body}>{translate(locale, 'focus.complete')}</Text>
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

/** Exposed for tests and for the sync layer. */
export function mergeIntoServer(
  server: FocusSession,
  queue: readonly FocusEvent[],
  serverNow: Date,
) {
  return reconcileSession({ server, incoming: queue, serverNow });
}
