import { Rule34Error } from "@/adapters/rule34/client/rule34_error";
import { Rule34Fetch } from "@/adapters/rule34/client/rule34_fetch";

export async function sendRule34Request(
  fetch: Rule34Fetch,
  url: string,
  { throwsHttpErrors = true, ...init }: RequestInit & { throwsHttpErrors?: boolean } = {}
): Promise<Response> {
  const response = await fetch(url, init).catch((cause: unknown) => {
    throw new Rule34Error("network", { subject: url, cause });
  });

  if (throwsHttpErrors && !response.ok) {
    throw new Rule34Error("http", { subject: url, status: response.status });
  }
  return response;
}
