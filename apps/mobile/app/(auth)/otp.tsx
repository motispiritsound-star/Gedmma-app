import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatDutchPhone, normalizeDutchPhone, type UserRole } from '@buurklus/shared';
import { Button, Txt } from '@/components/ui';
import { usePublicApi } from '@/hooks/use-api';
import { ApiError, NetworkError } from '@/api/client';
import type { OtpChallengeResponse, SignInResponse } from '@/api/types';
import { useSession } from '@/store/session';
import { colors, radius, spacing } from '@/theme';

const CODE_LENGTH = 6;

export default function OtpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = usePublicApi();
  const signIn = useSession((state) => state.signIn);
  const params = useLocalSearchParams<{
    phone: string;
    role?: string;
    resendAt?: string;
    debugCode?: string;
  }>();

  const [code, setCode] = useState(params.debugCode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inputRef = useRef<TextInput>(null);

  const displayPhone = useMemo(() => {
    try {
      return formatDutchPhone(normalizeDutchPhone(params.phone));
    } catch {
      return params.phone;
    }
  }, [params.phone]);

  useEffect(() => {
    const target = params.resendAt ? new Date(params.resendAt).getTime() : 0;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((target - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [params.resendAt]);

  // Verify as soon as the sixth digit lands, rather than making the user
  // reach for a button they can no longer see above the keyboard.
  useEffect(() => {
    if (code.length === CODE_LENGTH && !submitting) void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function verify() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await api<SignInResponse>('/v1/auth/otp/verify', {
        method: 'POST',
        body: { phone: params.phone, code, role: (params.role as UserRole) ?? 'CUSTOMER' },
      });

      await signIn(response);

      if (response.user.role === 'PRO' && !response.user.hasProProfile) {
        router.replace('/pro-onboarding');
      } else if (response.user.role === 'PRO') {
        router.replace('/(pro)/leads');
      } else {
        router.replace('/(customer)');
      }
    } catch (caught) {
      setCode('');
      setError(
        caught instanceof NetworkError
          ? t('errors.network')
          : caught instanceof ApiError
            ? caught.message
            : t('errors.unknown'),
      );
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(null);
    try {
      const challenge = await api<OtpChallengeResponse>('/v1/auth/otp/request', {
        method: 'POST',
        body: { phone: params.phone },
      });
      router.setParams({
        resendAt: challenge.resendAvailableAt,
        debugCode: challenge.debugCode ?? '',
      });
      if (challenge.debugCode) setCode(challenge.debugCode);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('errors.unknown'));
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Txt variant="title">{t('auth.otpTitle')}</Txt>
        <Txt variant="body" color={colors.textMuted}>
          {t('auth.otpSubtitle', { phone: displayPhone })}
        </Txt>
      </View>

      {/* One hidden input behind six boxes: the OS can autofill the SMS code,
          which a six-input layout tends to break. */}
      <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length: CODE_LENGTH }, (_, index) => (
          <View
            key={index}
            style={[
              styles.box,
              index === code.length && styles.boxActive,
              error ? styles.boxError : null,
            ]}
          >
            <Txt variant="title" align="center">
              {code[index] ?? ''}
            </Txt>
          </View>
        ))}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(value) => {
          setCode(value.replace(/\D/g, '').slice(0, CODE_LENGTH));
          if (error) setError(null);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={CODE_LENGTH}
        autoFocus
        style={styles.hiddenInput}
      />

      {error ? (
        <Txt variant="caption" color={colors.danger} align="center">
          {error}
        </Txt>
      ) : null}

      <Button
        title={t('auth.verify')}
        onPress={() => void verify()}
        loading={submitting}
        disabled={code.length !== CODE_LENGTH}
      />

      <View style={styles.actions}>
        <Button
          title={secondsLeft > 0 ? t('auth.resendIn', { seconds: secondsLeft }) : t('auth.resend')}
          variant="ghost"
          size="md"
          disabled={secondsLeft > 0}
          onPress={() => void resend()}
        />
        <Button
          title={t('auth.changeNumber')}
          variant="ghost"
          size="md"
          onPress={() => router.back()}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.xl },
  header: { gap: spacing.sm },
  boxes: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', direction: 'ltr' },
  box: {
    flex: 1,
    maxWidth: 52,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  actions: { gap: spacing.xs },
});
