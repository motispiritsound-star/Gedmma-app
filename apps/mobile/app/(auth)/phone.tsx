import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { isMoroccanMobile } from '@khidma/shared';
import { Button, Field, Txt } from '@/components/ui';
import { usePublicApi } from '@/hooks/use-api';
import { ApiError, NetworkError } from '@/api/client';
import type { OtpChallengeResponse } from '@/api/types';
import { colors, spacing } from '@/theme';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = usePublicApi();
  const { role } = useLocalSearchParams<{ role?: string }>();

  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const valid = isMoroccanMobile(phone);

  async function submit() {
    if (!valid) {
      setError(t('auth.phoneInvalid'));
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const challenge = await api<OtpChallengeResponse>('/v1/auth/otp/request', {
        method: 'POST',
        body: { phone },
      });

      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone,
          role: role ?? 'CUSTOMER',
          resendAt: challenge.resendAvailableAt,
          // Outside production the API returns the code so demos and QA do not
          // depend on a real SMS arriving.
          debugCode: challenge.debugCode ?? '',
        },
      });
    } catch (caught) {
      setError(
        caught instanceof NetworkError
          ? t('errors.network')
          : caught instanceof ApiError
            ? caught.message
            : t('errors.unknown'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Txt variant="title">{t('auth.phoneTitle')}</Txt>
          <Txt variant="body" color={colors.textMuted}>
            {t('auth.phoneSubtitle')}
          </Txt>
        </View>

        <Field
          label={t('auth.phoneLabel')}
          placeholder={t('auth.phonePlaceholder')}
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            if (error) setError(null);
          }}
          error={error}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoFocus
          maxLength={20}
          // Numbers stay left-to-right even when the interface is Arabic.
          style={{ textAlign: 'left', writingDirection: 'ltr' }}
        />

        <Button
          title={t('auth.sendCode')}
          onPress={() => void submit()}
          loading={submitting}
          disabled={!valid}
        />

        <Txt variant="caption" color={colors.textSubtle}>
          {t('auth.terms')}
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.xl, gap: spacing.xl },
  header: { gap: spacing.sm },
});
