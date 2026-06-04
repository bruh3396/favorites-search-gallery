import { USER_ID, VERSION } from "@/lib/environment";
import { PING_URL } from "@/lib/remote/url/api_urls";

export function setupServer(): void {
  fetchFromApi(PING_URL, {});
}

export function fetchJsonFromApi<T>(url: string, body: Record<string, unknown>): Promise<T> {
  return fetchFromApi(url, body).then(r => r.json() as Promise<T>);
}

function fetchFromApi(url: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(url, buildApiRequestInit(body));
}

function buildApiRequestInit(body: Record<string, unknown>): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, version: VERSION, ...body })
  };
}
