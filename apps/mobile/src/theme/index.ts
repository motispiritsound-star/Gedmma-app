import { I18nManager, Platform, type TextStyle } from 'react-native';

/**
 * Buurklus's palette. The green is drawn from the zellige and tilework that reads
 * as craftsmanship in Morocco; the terracotta accent picks up the ochre of
 * Marrakech. Both were checked for 4.5:1 contrast on their paired surfaces.
 */
export const palette = {
  green900: '#06342B',
  green700: '#0B5546',
  green600: '#0F6F5C',
  green500: '#158A73',
  green100: '#DCEFEA',
  green50: '#F1F9F6',

  terracotta600: '#B4552F',
  terracotta500: '#D2673B',
  terracotta100: '#FBE7DE',

  saffron500: '#E2A33C',
  saffron100: '#FDF2DE',

  red600: '#C0392B',
  red100: '#FBE3E0',

  ink900: '#14201D',
  ink700: '#33433F',
  ink500: '#5C706B',
  ink300: '#93A5A0',
  ink200: '#C7D3CF',
  ink100: '#E4EBE9',
  ink50: '#F5F8F7',
  white: '#FFFFFF',
} as const;

export const colors = {
  primary: palette.green600,
  primaryDark: palette.green700,
  primarySoft: palette.green100,
  primarySurface: palette.green50,
  accent: palette.terracotta500,
  accentSoft: palette.terracotta100,
  warning: palette.saffron500,
  warningSoft: palette.saffron100,
  danger: palette.red600,
  dangerSoft: palette.red100,

  text: palette.ink900,
  textMuted: palette.ink500,
  textSubtle: palette.ink300,
  textInverse: palette.white,

  background: palette.ink50,
  surface: palette.white,
  border: palette.ink100,
  borderStrong: palette.ink200,
} as const;

/** A 4pt scale: every gap in the app is one of these. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '600' },
  subheading: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 23, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 23, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 19, fontWeight: '400' },
  overline: { fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing: 0.6 },
} satisfies Record<string, TextStyle>;

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: palette.ink900,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    android: { elevation: 2 },
    default: {},
  }),
  raised: Platform.select({
    ios: {
      shadowColor: palette.ink900,
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

/**
 * Text alignment that follows the interface direction. Arabic reads
 * right-to-left, and `textAlign: 'left'` would strand it against the wrong edge.
 */
export const textStart = (): TextStyle['textAlign'] => (I18nManager.isRTL ? 'right' : 'left');
export const textEnd = (): TextStyle['textAlign'] => (I18nManager.isRTL ? 'left' : 'right');

/** The icon that means "forward" flips with the reading direction. */
export const forwardIcon = () => (I18nManager.isRTL ? 'chevron-back' : 'chevron-forward');
export const backIcon = () => (I18nManager.isRTL ? 'chevron-forward' : 'chevron-back');
