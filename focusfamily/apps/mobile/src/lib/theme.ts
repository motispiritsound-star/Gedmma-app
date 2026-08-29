import { StyleSheet } from 'react-native';

/** Warm, calm palette shared with the web app. */
export const colors = {
  ink: '#1b2430',
  inkSoft: '#46525f',
  inkFaint: '#66717d',
  paper: '#fbf9f5',
  surface: '#ffffff',
  surfaceWarm: '#f5efe6',
  line: '#ded7cc',
  accent: '#1f5f4f',
  accentSoft: '#e3efe9',
  accentInk: '#12362c',
  warm: '#a8571d',
  warmSoft: '#fbeee2',
  info: '#2b4d7a',
  infoSoft: '#e6edf7',
} as const;

export const spacing = (steps: number): number => steps * 8;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing(2), gap: spacing(2) },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink, marginBottom: spacing(1) },
  subtitle: { fontSize: 16, color: colors.inkSoft, lineHeight: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing(2),
    gap: spacing(1),
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.ink },
  body: { fontSize: 15, color: colors.inkSoft, lineHeight: 22 },
  // 44pt is the smallest comfortable target on both platforms.
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(3),
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  buttonSecondary: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(3),
  },
  buttonSecondaryText: { color: colors.accentInk, fontSize: 16, fontWeight: '600' },
  bigButton: { minHeight: 72 },
  bigButtonText: { fontSize: 20 },
  timer: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  notice: {
    backgroundColor: colors.infoSoft,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    borderRadius: 12,
    padding: spacing(2),
  },
  noticeWarm: { backgroundColor: colors.warmSoft, borderLeftColor: colors.warm },
  noticeGood: { backgroundColor: colors.accentSoft, borderLeftColor: colors.accent },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1), alignItems: 'center' },
});
