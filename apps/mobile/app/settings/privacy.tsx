import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LEGAL_PAGES, legalPath } from '@buurklus/shared';
import { Button, Card, Divider, Loader, Txt } from '@/components/ui';
import { SettingsRow } from '@/components/settings-row';
import { useApi, usePublicApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { ApiError } from '@/api/client';
import { colors, spacing } from '@/theme';

const SITE_URL = 'https://buurklus.nl';

const LEGAL_PAGE_ICONS = {
  TERMS: 'document-text-outline',
  PRIVACY: 'lock-closed-outline',
  DISCLAIMER: 'alert-circle-outline',
  COOKIES: 'browsers-outline',
} as const;

interface PolicyResponse {
  retention: { key: string; days: number; reason: string }[];
}

/**
 * Where someone exercises their rights over their own data, in the app rather
 * than by writing an email nobody reads for a fortnight. Everything here acts
 * on the signed-in account: download it, stop the optional messages, or have
 * it erased.
 */
export default function PrivacySettings() {
  const { t } = useTranslation();
  const router = useRouter();
  const api = useApi();
  const publicApi = usePublicApi();
  const queryClient = useQueryClient();
  const locale = useSession((state) => state.locale);
  const signOut = useSession((state) => state.signOut);

  const policy = useQuery({
    queryKey: ['policy', locale],
    queryFn: () => publicApi<PolicyResponse>('/v1/privacy/policy'),
  });

  const consent = useQuery({
    queryKey: ['marketing-consent'],
    queryFn: () => api<{ optIn: boolean }>('/v1/privacy/me/marketing-consent'),
  });

  const exportData = useMutation({
    mutationFn: () =>
      api<{ url: string }>('/v1/privacy/me/export-link', { method: 'POST' }),
    // Handed to the browser rather than rendered here: the file belongs in
    // Files or Drive, where the person can keep it, not in a modal.
    onSuccess: (result) => void Linking.openURL(result.url),
    onError: () => Alert.alert(t('privacy.title'), t('privacy.exportFailed')),
  });

  const marketing = useMutation({
    mutationFn: (optIn: boolean) =>
      api<{ optIn: boolean }>('/v1/privacy/me/marketing-consent', {
        method: 'PUT',
        body: { optIn },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketing-consent'] }),
  });

  const erase = useMutation({
    mutationFn: () => api('/v1/privacy/me/delete', { method: 'POST' }),
    onSuccess: async () => {
      // There is no account left to be signed into.
      await signOut();
      router.replace('/(auth)/welcome');
    },
    onError: (caught) =>
      Alert.alert(
        t('privacy.deleteTitle'),
        caught instanceof ApiError ? caught.message : t('privacy.deleteFailed'),
      ),
  });

  // Read from the server rather than from anything cached at sign-in: this is
  // the screen where someone comes to check that it really is off.
  const optedIn = consent.data?.optIn ?? false;

  function confirmErase() {
    Alert.alert(t('privacy.deleteConfirmTitle'), t('privacy.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('privacy.deleteConfirmAction'),
        style: 'destructive',
        onPress: () => erase.mutate(),
      },
    ]);
  }

  if (policy.isLoading) return <Loader label={t('common.loading')} />;

  return (
    <>
      <Stack.Screen options={{ title: t('privacy.title') }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Txt variant="body" color={colors.textMuted}>
          {t('privacy.subtitle')}
        </Txt>

        <Card>
          <Txt variant="heading">{t('privacy.exportTitle')}</Txt>
          <Txt variant="body" color={colors.textMuted}>
            {t('privacy.exportBody')}
          </Txt>
          <Button
            title={t('privacy.exportTitle')}
            variant="secondary"
            icon="download-outline"
            loading={exportData.isPending}
            onPress={() => exportData.mutate()}
          />
        </Card>

        <Card>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Txt variant="heading">{t('privacy.marketingTitle')}</Txt>
              <Txt variant="caption" color={colors.textMuted}>
                {t('privacy.marketingBody')}
              </Txt>
            </View>
            <Switch
              value={optedIn}
              onValueChange={(next) => marketing.mutate(next)}
              disabled={marketing.isPending || consent.isLoading}
              accessibilityLabel={t('privacy.marketingTitle')}
            />
          </View>
        </Card>

        <View style={styles.group}>
          <Txt variant="overline" color={colors.textMuted} style={styles.groupTitle}>
            {t('privacy.documentsTitle')}
          </Txt>
          <View style={styles.groupBody}>
            {LEGAL_PAGES.map((document, index) => (
              <React.Fragment key={document.key}>
                {index > 0 ? <Divider /> : null}
                <SettingsRow
                  icon={LEGAL_PAGE_ICONS[document.key]}
                  label={t(`privacy.pages.${document.key}`)}
                  value={document.version}
                  onPress={() => void Linking.openURL(`${SITE_URL}${legalPath(document.key, locale)}`)}
                />
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Read from the API rather than written out here, so this list and
            the sweep that enforces it cannot say different things. */}
        <View style={styles.group}>
          <Txt variant="overline" color={colors.textMuted} style={styles.groupTitle}>
            {t('privacy.retentionTitle')}
          </Txt>
          <Card>
            {(policy.data?.retention ?? []).map((rule) => (
              <Txt key={rule.key} variant="caption" color={colors.textMuted}>
                {rule.reason}
              </Txt>
            ))}
          </Card>
        </View>

        <Card>
          <Txt variant="heading" color={colors.danger}>
            {t('privacy.deleteTitle')}
          </Txt>
          <Txt variant="body" color={colors.textMuted}>
            {t('privacy.deleteBody')}
          </Txt>
          <Button
            title={t('privacy.deleteTitle')}
            variant="danger"
            loading={erase.isPending}
            onPress={confirmErase}
          />
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchText: { flex: 1, gap: 2 },
  group: { gap: spacing.sm },
  groupTitle: { paddingHorizontal: spacing.xs },
  groupBody: { borderRadius: spacing.md, overflow: 'hidden' },
});
