import { PING_URL } from "../url/api_url_builder";
import { REQUEST_METADATA } from "../../environment/favorites_metadata";

export function fetchFromServer(url: string, body: object): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...REQUEST_METADATA, ...body })
  });
}

export function setupServer(): void {
  fetchFromServer(PING_URL, {});
}
