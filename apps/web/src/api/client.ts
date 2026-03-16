const BASE_URL = import.meta.env.VITE_API_URL ?? "";

interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public details?: Record<string, string>,
  ) {
    super(`${code}: ${status}`);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const options: RequestInit = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    let errorBody: ApiErrorBody;
    try {
      const json = await res.json();
      errorBody = json.error;
    } catch {
      throw new ApiError(res.status, "NETWORK_ERROR");
    }
    throw new ApiError(res.status, errorBody.code, errorBody.details);
  }

  const json = await res.json();
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      let errorBody: ApiErrorBody;
      try {
        const json = await res.json();
        errorBody = json.error;
      } catch {
        throw new ApiError(res.status, "NETWORK_ERROR");
      }
      throw new ApiError(res.status, errorBody.code, errorBody.details);
    }
    const json = await res.json();
    return json.data as T;
  },
};
