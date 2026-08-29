import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, forwardIcon, radius, spacing } from '../theme';
import { Txt } from './ui';

/** One row of a settings list: icon, label, optional value, chevron. */
export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | null;
  onPress?: () => void;
  tone?: 'default' | 'danger';
}) {
  const tint = tone === 'danger' ? colors.danger : colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.pressed : null]}
    >
      <View style={[styles.icon, tone === 'danger' && { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Txt variant="body" color={tone === 'danger' ? colors.danger : colors.text} style={styles.label}>
        {label}
      </Txt>
      {value ? (
        <Txt variant="caption" color={colors.textMuted}>
          {value}
        </Txt>
      ) : null}
      {onPress ? <Ionicons name={forwardIcon()} size={18} color={colors.textSubtle} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.background },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1 },
});
