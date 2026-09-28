export const API_ORIGIN = "https://frozencobalt.stream";

export type Route = "ping" | "post" | "tag";

export interface ApiIdentity {
  userId: string;
  version: string;
  platform: string;
}

export const ANONYMOUS: ApiIdentity = { userId: "", version: "", platform: "" };

export function sendRequest(origin: string, identity: ApiIdentity, route: Route, body: Record<string, unknown> = {}): Promise<Response> {
  return fetch(`${origin}/${route}`, {
    method: "POST",
    headers: { "X-User-Id": identity.userId, "X-Version": identity.version, "X-Platform": identity.platform },
    body: JSON.stringify(body)
  });
}
