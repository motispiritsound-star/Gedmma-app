import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState, Loader, Txt } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { useSession } from '@/store/session';
import { formatRelative } from '@/utils/format';
import type { ChatMessage, ConversationSummary } from '@/api/types';
import { colors, radius, spacing, textStart } from '@/theme';

interface ThreadResponse {
  conversation: ConversationSummary;
  items: ChatMessage[];
  nextCursor: string | null;
}

export default function Conversation() {
  const { t } = useTranslation();
  const api = useApi();
  const queryClient = useQueryClient();
  const locale = useSession((state) => state.locale);
  const currentUserId = useSession((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();
  const [draft, setDraft] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api<ThreadResponse>(`/v1/conversations/${id}/messages`, { query: { limit: 50 } }),
    // A thread is the one place a user expects near-live updates.
    refetchInterval: 15_000,
  });

  const send = useMutation({
    mutationFn: (body: string) =>
      api<{ message: ChatMessage }>(`/v1/conversations/${id}/messages`, {
        method: 'POST',
        body: { body },
      }),
    onSuccess: async () => {
      setDraft('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conversation', id] }),
        queryClient.invalidateQueries({ queryKey: ['conversations'] }),
      ]);
    },
  });

  if (isLoading) return <Loader label={t('common.loading')} />;

  const messages = data?.items ?? [];
  const jobTitle = data?.conversation.job.title;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={{ title: jobTitle ?? t('messages.title') }} />

      <FlatList
        data={messages}
        keyExtractor={(message) => message.id}
        // Newest first from the API, so the list renders bottom-up.
        inverted={messages.length > 0}
        contentContainerStyle={[styles.list, messages.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <EmptyState icon="chatbubble-outline" title={t('messages.empty')} body={t('messages.emptyBody')} />
        }
        renderItem={({ item }) => {
          const mine = item.senderId === currentUserId;
          return (
            <View style={[styles.bubbleRow, mine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Txt variant="body" color={mine ? colors.textInverse : colors.text}>
                  {item.body}
                </Txt>
                <Txt
                  variant="caption"
                  color={mine ? colors.primarySoft : colors.textSubtle}
                  align={mine ? 'right' : 'left'}
                >
                  {formatRelative(item.createdAt, locale)}
                </Txt>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('messages.placeholder')}
          placeholderTextColor={colors.textSubtle}
          style={[styles.input, { textAlign: textStart() }]}
          multiline
          maxLength={2000}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.send')}
          disabled={draft.trim().length === 0 || send.isPending}
          onPress={() => send.mutate(draft.trim())}
          style={[styles.sendButton, draft.trim().length === 0 && styles.sendButtonDisabled]}
        >
          <Ionicons name="send" size={18} color={colors.textInverse} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.sm },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, padding: spacing.md, gap: 2 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },
});
