import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatDutchPhone } from '@buurklus/shared';
import { Button, Field, Txt } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { ApiError } from '@/api/client';
import { colors, spacing } from '@/theme';

export default function AccountSettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const user = useSession((state) => state.user);
  const patchUser = useSession((state) => state.patchUser);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api('/v1/auth/me', {
        method: 'PATCH',
        body: {
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          email: email.trim(),
        },
      });
      patchUser({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() });
      router.back();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('errors.unknown'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t('profile.personalInfo') }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Field
          label={t('profile.firstName')}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          textContentType="givenName"
        />
        <Field
          label={t('profile.lastName')}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          textContentType="familyName"
        />
        <Field
          label={t('profile.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          optional
          optionalLabel={t('common.optional')}
          style={{ textAlign: 'left', writingDirection: 'ltr' }}
        />

        <Txt variant="caption" color={colors.textMuted}>
          {user ? formatDutchPhone(user.phone) : ''}
        </Txt>

        {error ? (
          <Txt variant="caption" color={colors.danger}>
            {error}
          </Txt>
        ) : null}

        <Button title={t('common.save')} onPress={() => void save()} loading={saving} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg },
});
