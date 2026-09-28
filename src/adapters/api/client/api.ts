import { ApiConfig } from "@/adapters/api/client/api_config";

export type Route = "ping" | "post" | "tag";

export interface ApiIdentity {
  userId: string;
  version: string;
  platform: string;
}

const REQUEST_INIT: RequestInit = { method: "POST", headers: { "X-User-Id": "", "X-Version": "", "X-Platform": "" } };

export function identifyAs({ userId, version, platform }: ApiIdentity): void {
  REQUEST_INIT.headers = { "X-User-Id": userId, "X-Version": version, "X-Platform": platform };
}

export function fetchApi(route: Route, body: Record<string, unknown> = {}): Promise<Response> {
  return fetch(`${ApiConfig.serverOrigin}/${route}`, { ...REQUEST_INIT, body: JSON.stringify(body) });
}
