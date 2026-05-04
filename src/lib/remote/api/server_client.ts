import { PING_URL } from "../url/api_url_builder";
import { REQUEST_METADATA } from "../../environment/favorites_metadata";

export function postToServer(url: string, body: object): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...REQUEST_METADATA, ...body })
  });
}

export function setupServer(): void {
  postToServer(PING_URL, {});
}
