import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_LOCALE, type Locale } from '@khidma/shared';
import { ApiError, request } from '../api/client';
import type { AuthTokens, SessionUser, SignInResponse } from '../api/types';

const ACCESS_KEY = 'khidma.accessToken';
const REFRESH_KEY = 'khidma.refreshToken';
const LOCALE_KEY = 'khidma.locale';

interface SessionState {
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: SessionUser | null;
  locale: Locale;

  hydrate: () => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
  signIn: (response: SignInResponse) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<string | null>;
  reloadUser: () => Promise<void>;
  patchUser: (patch: Partial<SessionUser>) => void;
}

/** Tokens live in the device keychain, never in plain AsyncStorage. */
async function persistTokens(tokens: AuthTokens | null) {
  if (!tokens) {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export const useSession = create<SessionState>((set, get) => ({
  hydrated: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  locale: DEFAULT_LOCALE,

  async hydrate() {
    const [accessToken, refreshToken, storedLocale] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
      SecureStore.getItemAsync(LOCALE_KEY),
    ]);

    set({
      accessToken,
      refreshToken,
      locale: (storedLocale as Locale | null) ?? DEFAULT_LOCALE,
      hydrated: true,
    });

    if (accessToken) {
      await get().reloadUser();
    }
  },

  async setLocale(locale) {
    await SecureStore.setItemAsync(LOCALE_KEY, locale);
    set({ locale });

    // Persist the choice on the account too, so notifications and API errors
    // arrive in the same language on every device.
    const { accessToken } = get();
    if (accessToken) {
      await request('/v1/auth/me', {
        method: 'PATCH',
        body: { locale },
        accessToken,
        locale,
      }).catch(() => undefined);
    }
  },

  async signIn(response) {
    await persistTokens(response);
    set({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    });
  },

  async signOut() {
    const { refreshToken, locale } = get();
    if (refreshToken) {
      await request('/v1/auth/logout', { method: 'POST', body: { refreshToken }, locale }).catch(
        () => undefined,
      );
    }
    await persistTokens(null);
    set({ accessToken: null, refreshToken: null, user: null });
  },

  /** Exchanges the refresh token for a new pair. Signs out if it is rejected. */
  async refresh() {
    const { refreshToken, locale } = get();
    if (!refreshToken) return null;

    try {
      const tokens = await request<AuthTokens>('/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        locale,
      });
      await persistTokens(tokens);
      set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
      return tokens.accessToken;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await persistTokens(null);
        set({ accessToken: null, refreshToken: null, user: null });
      }
      return null;
    }
  },

  async reloadUser() {
    const { accessToken, locale } = get();
    if (!accessToken) return;

    try {
      const me = await request<{
        id: string;
        phone: string;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        avatarUrl: string | null;
        locale: Locale;
        role: SessionUser['role'];
        city: { slug: string } | null;
        pro: { id: string; verificationStatus: SessionUser['proVerificationStatus'] } | null;
      }>('/v1/auth/me', { accessToken, locale });

      set({
        user: {
          id: me.id,
          phone: me.phone,
          firstName: me.firstName,
          lastName: me.lastName,
          email: me.email,
          avatarUrl: me.avatarUrl,
          locale: me.locale,
          role: me.role,
          cityId: me.city?.slug ?? null,
          hasProProfile: me.pro != null,
          proVerificationStatus: me.pro?.verificationStatus ?? null,
        },
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const renewed = await get().refresh();
        if (renewed) await get().reloadUser();
      }
    }
  },

  patchUser(patch) {
    const { user } = get();
    if (user) set({ user: { ...user, ...patch } });
  },
}));
