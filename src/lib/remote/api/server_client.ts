import { PING_URL } from "../url/api_urls";
import { REQUEST_METADATA } from "../../environment/favorites_metadata";

export function fetchFromServer<T>(url: string, body: object): Promise<T> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...REQUEST_METADATA, ...body })
  }).then(r => r.json() as Promise<T>);
}

export function setupServer(): void {
  fetchFromServer(PING_URL, {});
}
