import { useCallback } from 'react';
import { useSession } from '../store/session';
import { ApiError, request, type RequestOptions } from '../api/client';

/**
 * An authenticated fetch that retries once through a token refresh. Every
 * screen calls the API through this, so an expired access token is invisible.
 */
export function useApi() {
  const accessToken = useSession((state) => state.accessToken);
  const locale = useSession((state) => state.locale);
  const refresh = useSession((state) => state.refresh);

  return useCallback(
    async <T>(path: string, options: Omit<RequestOptions, 'accessToken' | 'locale'> = {}) => {
      try {
        return await request<T>(path, { ...options, accessToken, locale });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && accessToken) {
          const renewed = await refresh();
          if (renewed) {
            return request<T>(path, { ...options, accessToken: renewed, locale });
          }
        }
        throw error;
      }
    },
    [accessToken, locale, refresh],
  );
}

/** Unauthenticated fetch for the public catalog, still language-aware. */
export function usePublicApi() {
  const locale = useSession((state) => state.locale);
  return useCallback(
    <T>(path: string, options: Omit<RequestOptions, 'accessToken' | 'locale'> = {}) =>
      request<T>(path, { ...options, locale }),
    [locale],
  );
}
