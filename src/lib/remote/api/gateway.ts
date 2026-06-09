import { USER_ID, VERSION } from "@/lib/environment";
import { LocalOverrides } from "@/config/local_overrides";
import { Route } from "@/types/api";

const PRODUCTION_SERVER_ORIGIN = "https://frozencobalt.stream";
const SERVER_ORIGIN = LocalOverrides.serverOrigin ?? PRODUCTION_SERVER_ORIGIN;
const REQUEST_INIT: RequestInit = {
  method: "POST",
  headers: {
    "X-User-Id": USER_ID,
    "X-Version": VERSION
  }
};

export function fetchApi(route: Route, body: Record<string, unknown> = {}): Promise<Response> {
  return fetch(`${SERVER_ORIGIN}/${route}`, { ...REQUEST_INIT, body: JSON.stringify(body) });
}
