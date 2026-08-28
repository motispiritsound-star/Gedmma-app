import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, textStart, typography } from '../theme';

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

type TypographyVariant = keyof typeof typography;

interface TypographyProps {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  children: React.ReactNode;
}

/** Every piece of text goes through here, so nothing is left mis-aligned in RTL. */
export function Txt({
  variant = 'body',
  color = colors.text,
  align,
  style,
  numberOfLines,
  children,
}: TypographyProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[typography[variant] as TextStyle, { color, textAlign: align ?? textStart() }, style]}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  loading = false,
  icon,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const tone = BUTTON_TONES[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        size === 'md' && styles.buttonMd,
        { backgroundColor: tone.background, borderColor: tone.border },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={tone.text} />
      ) : (
        <View style={styles.buttonRow}>
          {icon ? <Ionicons name={icon} size={18} color={tone.text} /> : null}
          <Text style={[typography.bodyStrong as TextStyle, { color: tone.text }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const BUTTON_TONES = {
  primary: { background: colors.primary, border: colors.primary, text: colors.textInverse },
  secondary: { background: colors.surface, border: colors.borderStrong, text: colors.text },
  ghost: { background: 'transparent', border: 'transparent', text: colors.primary },
  danger: { background: colors.dangerSoft, border: colors.dangerSoft, text: colors.danger },
} as const;

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

interface FieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
  optional?: boolean;
  optionalLabel?: string;
}

export function Field({
  label,
  hint,
  error,
  optional,
  optionalLabel = 'optional',
  style,
  ...rest
}: FieldProps) {
  return (
    <View style={styles.field}>
      {label ? (
        <View style={styles.fieldLabelRow}>
          <Txt variant="bodyStrong">{label}</Txt>
          {optional ? (
            <Txt variant="caption" color={colors.textSubtle}>
              {optionalLabel}
            </Txt>
          ) : null}
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textSubtle}
        style={[
          styles.input,
          { textAlign: textStart() },
          rest.multiline && styles.inputMultiline,
          error ? styles.inputError : null,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Txt variant="caption" color={colors.danger}>
          {error}
        </Txt>
      ) : hint ? (
        <Txt variant="caption" color={colors.textMuted}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

/**
 * A tick box with its label as one tap target. Used where someone has to agree
 * to something rather than merely continue past it: an explicit act is what
 * makes the agreement record worth anything, and a pre-ticked box or an
 * "by continuing you agree" line is not one.
 */
export function Checkbox({
  checked,
  onChange,
  children,
  accessibilityLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: React.ReactNode;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onChange(!checked)}
      // 44 points of height comes from the padding plus the box, so the label
      // is part of the target rather than a decoration beside it.
      style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Ionicons name="checkmark" size={15} color={colors.textInverse} /> : null}
      </View>
      <View style={styles.checkboxLabel}>{children}</View>
    </Pressable>
  );
}

export function Card({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

export function Badge({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const palette = BADGE_TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      {icon ? <Ionicons name={icon} size={12} color={palette.text} /> : null}
      <Text style={[typography.caption as TextStyle, { color: palette.text, fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
}

const BADGE_TONES = {
  neutral: { background: colors.border, text: colors.textMuted },
  success: { background: colors.primarySoft, text: colors.primaryDark },
  warning: { background: colors.warningSoft, text: '#8A5B10' },
  danger: { background: colors.dangerSoft, text: colors.danger },
  accent: { background: colors.accentSoft, text: colors.accent },
} as const;

/** Row of stars used for ratings. Reads out its value for screen readers. */
export function Rating({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${value.toFixed(1)} / 5`}
      style={styles.ratingRow}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={rounded >= star ? 'star' : rounded >= star - 0.5 ? 'star-half' : 'star-outline'}
          size={size}
          color={colors.warning}
        />
      ))}
      {count != null ? (
        <Txt variant="caption" color={colors.textMuted}>
          {value.toFixed(1)} ({count})
        </Txt>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Txt variant="heading" align="center">
        {title}
      </Txt>
      {body ? (
        <Txt variant="body" color={colors.textMuted} align="center">
          {body}
        </Txt>
      ) : null}
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

export function Loader({ label }: { label?: string }) {
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={colors.primary} />
      {label ? (
        <Txt variant="caption" color={colors.textMuted}>
          {label}
        </Txt>
      ) : null}
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

/** Progress dots for the multi-step job wizard. */
export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[styles.stepDot, index < current && { backgroundColor: colors.primary }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonMd: { minHeight: 42, paddingHorizontal: spacing.md },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.45 },

  field: { gap: spacing.xs },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  inputMultiline: { minHeight: 132, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...(shadow.card as object),
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  empty: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAction: { alignSelf: 'stretch', marginTop: spacing.sm },

  loader: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border },

  stepRow: { flexDirection: 'row', gap: spacing.xs },
  stepDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
});
