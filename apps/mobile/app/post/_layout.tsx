import React from 'react';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme';

export default function PostLayout() {
  const { t } = useTranslation();

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontSize: 17, fontWeight: '600' },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
        title: t('job.newTitle'),
      }}
    />
  );
}
