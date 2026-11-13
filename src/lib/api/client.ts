import { ApiError } from './errors';

export type Json = Record<string, unknown> | unknown[];

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: Json | FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ClientDeps {
  fetch: typeof fetch;
  getToken: () => string | null;
  refresh: () => Promise<string | null>;
  onSessionLost: () => void;
}

const RETRYABLE_AUTH_CODES = new Set(['INVALID_TOKEN', 'UNAUTHENTICATED']);

export function buildUrl(path: string, query?: RequestOptions['query']): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export function createClient(deps: ClientDeps) {
  const send = async (path: string, options: RequestOptions, token: string | null) => {
    const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
    let body: BodyInit | undefined;
    if (options.body instanceof FormData) {
      body = options.body;
    } else if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    try {
      return await deps.fetch(buildUrl(path, options.query), {
        method: options.method ?? 'GET',
        headers,
        body,
        credentials: 'same-origin',
        cache: 'no-store',
        signal: options.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }
      throw new ApiError(0, 'NETWORK_ERROR', 'Network error');
    }
  };

  return async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    let response = await send(path, options, deps.getToken());

    if (response.status === 401) {
      const error = await ApiError.from(response.clone());
      if (RETRYABLE_AUTH_CODES.has(error.code)) {
        const token = await deps.refresh();
        if (!token) {
          deps.onSessionLost();
          throw error;
        }
        response = await send(path, options, token);
      }
    }

    if (!response.ok) {
      throw await ApiError.from(response);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  };
}
