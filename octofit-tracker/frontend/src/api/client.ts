// Relative /api paths go through the Vite dev proxy, so port 8000 never needs to be public.
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

function toUrl(path: string): string {
  if (!path.startsWith('/')) {
    return `${apiBaseUrl}/${path}`;
  }
  return `${apiBaseUrl}${path}`;
}

async function parseResponseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const requestInit = { ...init };
  const hasBody = typeof requestInit.body !== 'undefined';
  const headers = requestInit.headers ? { ...(requestInit.headers as Record<string, string>) } : {};
  const shouldSendOptions = requestInit.method !== 'GET' || hasBody || Object.keys(headers).length > 0;

  const response = shouldSendOptions
    ? await fetch(toUrl(path), {
        ...requestInit,
        headers: {
          ...(requestInit.method === 'GET' ? { Accept: 'application/json' } : {}),
          ...headers,
        },
      })
    : await fetch(toUrl(path));

  const payload = await parseResponseJson<T>(response);
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
      ? payload.message
      : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  if (payload === null) {
    return undefined as T;
  }

  return payload;
}

export async function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path, { method: 'GET' });
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
