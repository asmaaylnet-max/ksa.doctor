export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      credentials: 'include',
      headers
    });
  } catch {
    throw new ApiError(0, 'network', 'Network request failed');
  }
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    /* empty body */
  }
  if (!response.ok) {
    const body = payload as { error?: { code?: string; message?: string; fields?: Record<string, string> } } | null;
    throw new ApiError(
      response.status,
      body?.error?.code || 'generic',
      body?.error?.message || 'Request failed',
      body?.error?.fields
    );
  }
  return payload as T;
}

export function getErrorMessage(
  error: unknown,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  if (error instanceof ApiError) {
    if (error.code === 'network') return t('err.network');
    const translated = t(`err.${error.code}`);
    return translated !== `err.${error.code}` ? translated : error.message || t('err.generic');
  }
  if (error instanceof Error) return error.message;
  return t('err.generic');
}

export function fieldError(
  fields: Record<string, string> | undefined,
  name: string,
  t: (key: string) => string
): string | undefined {
  const code = fields?.[name];
  if (!code) return undefined;
  const translated = t(`err.${code}`);
  return translated !== `err.${code}` ? translated : code;
}
