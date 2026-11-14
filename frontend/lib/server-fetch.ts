import { cookies } from "next/headers";

/**
 * fetch() untuk Server Action / Server Component.
 *
 * `credentials: "include"` TIDAK berlaku saat fetch dijalankan di server
 * (tidak ada cookie jar seperti di browser). Akibatnya endpoint backend yang
 * dilindungi requireApiAuth akan mengembalikan 401. Helper ini meneruskan
 * cookie browser yang sedang aktif ke backend.
 */
export async function serverFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const headers = new Headers(init.headers);

  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }

  return fetch(input, { ...init, headers });
}

export default serverFetch;
