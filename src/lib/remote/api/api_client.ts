import { PING_URL } from "../url/api_urls";
import { USER_ID } from "../../environment/favorites_metadata";
import { VERSION } from "../../environment/environment";

function buildApiRequestInit(body: Record<string, unknown>): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, version: VERSION, ...body })
  };
}

function fetchFromApi(url: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(url, buildApiRequestInit(body));
}

export function fetchJsonFromApi<T>(url: string, body: Record<string, unknown>): Promise<T> {
  return fetchFromApi(url, body).then(r => r.json() as Promise<T>);
}

export function setupServer(): void {
  fetchFromApi(PING_URL, {});
}
