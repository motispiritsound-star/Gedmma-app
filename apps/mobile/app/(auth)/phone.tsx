import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LEGAL_DOCUMENTS, MINIMUM_AGE, isDutchMobile, legalPath } from '@buurklus/shared';
import { Button, Checkbox, Field, Txt } from '@/components/ui';
import { usePublicApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { ApiError, NetworkError } from '@/api/client';
import type { OtpChallengeResponse } from '@/api/types';
import { colors, spacing } from '@/theme';

export default function PhoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = usePublicApi();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const locale = useSession((state) => state.locale);

  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const valid = isDutchMobile(phone);

  async function submit() {
    if (!valid) {
      setError(t('auth.phoneInvalid'));
      return;
    }
    if (!agreed) {
      setError(t('auth.agreeRequired'));
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
          // Carried forward so the verify call can record what was agreed to,
          // at the moment the account is actually created.
          agreed: '1',
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

        {/* An explicit tick rather than "by continuing you agree": the record
            of an agreement is only worth something if somebody made one. It
            starts empty, because a pre-ticked box is not agreement either. */}
        <Checkbox
          checked={agreed}
          onChange={(next) => {
            setAgreed(next);
            if (error) setError(null);
          }}
          accessibilityLabel={t('auth.agreeLabel', { age: MINIMUM_AGE })}
        >
          <Txt variant="caption" color={colors.textMuted}>
            {t('auth.agreeLabel', { age: MINIMUM_AGE })}
          </Txt>
        </Checkbox>

        {/* The documents themselves, one tap away. Agreeing to something you
            were given no way to read is not agreement. */}
        <View style={styles.links}>
          {LEGAL_DOCUMENTS.map((document) => (
            <Pressable
              key={document.key}
              accessibilityRole="link"
              onPress={() => void Linking.openURL(`${SITE_URL}${legalPath(document.key, locale)}`)}
              style={styles.link}
            >
              <Txt variant="caption" color={colors.primary}>
                {t(document.key === 'TERMS' ? 'auth.readTerms' : 'auth.readPrivacy')}
              </Txt>
            </Pressable>
          ))}
        </View>

        <Button
          title={t('auth.sendCode')}
          onPress={() => void submit()}
          loading={submitting}
          disabled={!valid || !agreed}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Where the documents someone is agreeing to actually live. */
const SITE_URL = 'https://buurklus.nl';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: spacing.xl, gap: spacing.lg },
  header: { gap: spacing.sm },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  // A link is a tap target, not a line of text: 44 points high, always.
  link: { minHeight: 44, justifyContent: 'center' },
});
