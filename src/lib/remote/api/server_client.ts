import { PING_URL } from "../url/api_urls";
import { USER_ID } from "../../environment/favorites_metadata";
import { VERSION } from "../../environment/environment";

export function fetchFromServer<T>(url: string, body: object): Promise<T> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: USER_ID, version: VERSION, ...body })
  }).then(r => r.json() as Promise<T>);
}

export function setupServer(): void {
  fetchFromServer(PING_URL, {});
}
