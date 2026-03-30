export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiResponse<T> = {
  data: T;
};

function buildUrl(path: string, params?: Record<string, string | number | null | undefined>) {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  const url = new URL(`${base}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

export const api = {
  async get<T>(path: string, params?: Record<string, string | number | null | undefined>): Promise<ApiResponse<T>> {
    if (!import.meta.env.VITE_API_BASE_URL) {
      throw new ApiError('API base URL not configured in workbench.', 0);
    }
    const response = await fetch(buildUrl(path, params), { credentials: 'include' });
    if (!response.ok) {
      throw new ApiError(`Request failed (${response.status})`, response.status);
    }
    return { data: (await response.json()) as T };
  },
  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    if (!import.meta.env.VITE_API_BASE_URL) {
      throw new ApiError('API base URL not configured in workbench.', 0);
    }
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new ApiError(`Request failed (${response.status})`, response.status);
    }
    return { data: (await response.json()) as T };
  },
  getAccessToken() {
    return null;
  },
};
