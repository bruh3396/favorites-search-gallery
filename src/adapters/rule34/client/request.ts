import { Rule34Error } from "@/adapters/rule34/client/error";

export type Rule34Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export async function send(fetch: Rule34Fetch, url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (cause) {
    throw new Rule34Error("network", { subject: url, cause });
  }
}

export async function request(fetch: Rule34Fetch, url: string, init?: RequestInit): Promise<Response> {
  const response = await send(fetch, url, init);

  if (!response.ok) {
    throw new Rule34Error("http", { subject: url, status: response.status });
  }
  return response;
}
