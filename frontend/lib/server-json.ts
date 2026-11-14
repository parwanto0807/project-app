import { serverFetch } from "./server-fetch";

/**
 * Seperti `serverFetch`, tetapi langsung mengembalikan body JSON dan
 * melempar error (dengan `response.data`) bila status bukan 2xx.
 *
 * Dipakai oleh Server Action yang sebelumnya memakai `apiFetch`/axios:
 * keduanya browser-only dan tidak meneruskan cookie saat berjalan di server.
 */
export async function serverJson<T = any>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const res = await serverFetch(input, init);
  const text = await res.text();

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === "object"
        ? (data as { message?: string; error?: string }).message ||
          (data as { message?: string; error?: string }).error
        : null;

    const error = new Error(message || `HTTP ${res.status}`) as Error & {
      response?: { data: unknown; status: number };
    };
    error.response = { data, status: res.status };
    throw error;
  }

  return data as T;
}

export default serverJson;
