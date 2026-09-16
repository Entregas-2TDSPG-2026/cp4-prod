// ============================================================
// Mockmerce HTTP Client
// ============================================================

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://ecommerce-turma.onrender.com/v1';

const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';
const STUDENT_RM = process.env.EXPO_PUBLIC_STUDENT_RM ?? '';

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  token?: string;
}

export class ApiException extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

async function request<T>(
  path: string,
  { method = 'GET', body, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Key': API_KEY,
  };

  if (STUDENT_RM) {
    headers['X-Student-RM'] = STUDENT_RM;
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const err = (await response.json()) as {
        message?: string;
        error?: { message?: string };
      };
      if (err.error?.message) message = err.error.message;
      else if (err.message) message = err.message;
    } catch {
      // ignore parse error
    }
    throw new ApiException(response.status, message);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'GET', token }),
  post: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body, token }),
  patch: <T>(path: string, body?: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body, token }),
  del: <T>(path: string, token?: string) =>
    request<T>(path, { method: 'DELETE', token }),
};
