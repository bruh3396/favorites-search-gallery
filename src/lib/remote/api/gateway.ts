import { USER_ID, VERSION } from "@/lib/environment";
import { PING_URL } from "@/lib/remote/url/api_urls";

const API_REQUEST_INIT: RequestInit = {
  method: "POST",
  headers: {
    "X-User-Id": USER_ID,
    "X-Version": VERSION
  }
};

export function setupServer(): void {
  fetchApi(PING_URL, {});
}

export function fetchApiJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  return fetchApi(url, body).then(r => r.json() as Promise<T>);
}

function fetchApi(url: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(url, { ...API_REQUEST_INIT, body: JSON.stringify(body) });
}
