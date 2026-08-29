import { cookies } from 'next/headers';

/**
 * Server-side client for the FocusFamily API.
 *
 * The browser never talks to the API directly: the session cookie is httpOnly
 * and stays between the browser and this Next.js server, which forwards it.
 * That keeps exactly one place - the API - responsible for authorisation.
 */
export const API_BASE_URL =
  process.env.FOCUSFAMILY_API_URL ?? 'http://127.0.0.1:4000';

export const WEB_ORIGIN = process.env.FOCUSFAMILY_WEB_ORIGIN ?? 'http://localhost:3000';

const SESSION_COOKIE = 'ff_session';
const CSRF_COOKIE = 'ff_csrf';
const CSRF_HEADER = 'x-focusfamily-csrf';

export interface ApiResult<T> {
  readonly ok: boolean;
  readonly status: number;
  readonly data: T | null;
  readonly error: { code: string; messageKey: string; message?: string; details?: unknown } | null;
  /** Cookies the API asked us to pass on, e.g. after signing in. */
  readonly setCookies: readonly string[];
}

async function call<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  const csrf = jar.get(CSRF_COOKIE)?.value;

  const headers: Record<string, string> = { origin: WEB_ORIGIN };
  const cookieHeader = [
    session ? `${SESSION_COOKIE}=${session}` : null,
    csrf ? `${CSRF_COOKIE}=${csrf}` : null,
  ]
    .filter(Boolean)
    .join('; ');
  if (cookieHeader) headers.cookie = cookieHeader;
  if (init.body !== undefined) headers['content-type'] = 'application/json';
  if (csrf && init.method && init.method !== 'GET') headers[CSRF_HEADER] = csrf;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
    });
  } catch {
    return {
      ok: false,
      status: 503,
      data: null,
      error: { code: 'api_unreachable', messageKey: 'error.api_unreachable' },
      setCookies: [],
    };
  }

  const setCookies = response.headers.getSetCookie?.() ?? [];
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const body = (payload ?? {}) as {
      error?: string;
      messageKey?: string;
      message?: string;
      details?: unknown;
    };
    return {
      ok: false,
      status: response.status,
      data: null,
      error: {
        code: body.error ?? 'error',
        messageKey: body.messageKey ?? 'error.unexpected',
        message: body.message,
        details: body.details,
      },
      setCookies,
    };
  }

  return { ok: true, status: response.status, data: payload as T, error: null, setCookies };
}

export const api = {
  get: <T>(path: string) => call<T>(path),
  post: <T>(path: string, body?: unknown) => call<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => call<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => call<T>(path, { method: 'DELETE' }),
};

/** Copy the API's Set-Cookie headers onto this response. */
export async function adoptCookies(setCookies: readonly string[]): Promise<void> {
  const jar = await cookies();
  for (const raw of setCookies) {
    const [pair, ...attributes] = raw.split(';');
    const index = pair?.indexOf('=') ?? -1;
    if (!pair || index === -1) continue;
    const name = pair.slice(0, index).trim();
    const value = decodeURIComponent(pair.slice(index + 1).trim());
    const maxAgeAttribute = attributes.find((part) => part.trim().toLowerCase().startsWith('max-age='));
    const maxAge = maxAgeAttribute ? Number(maxAgeAttribute.split('=')[1]) : undefined;
    if (value === '' || maxAge === 0) {
      jar.delete(name);
      continue;
    }
    jar.set(name, value, {
      path: '/',
      httpOnly: name === SESSION_COOKIE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge,
    });
  }
}

export async function isSignedIn(): Promise<boolean> {
  const jar = await cookies();
  return Boolean(jar.get(SESSION_COOKIE)?.value);
}
