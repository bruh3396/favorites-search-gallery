import { buildPostPageUrl } from "@/lib/remote/url";
import { fetchHtml } from "@/lib/remote/http/client";
import { generalPageRequestLimiter } from "@/lib/remote/http/rate_limiters";
import { withExponentialBackoff } from "@/lib/async/scheduling";

let postPageFetchGate: Promise<void> = Promise.resolve();

export async function fetchPostPageHtml(id: string): Promise<string> {
  await postPageFetchGate;
  return generalPageRequestLimiter.run(() => withExponentialBackoff(() => fetchHtml(buildPostPageUrl(id)), 3, 1000));
}

export function deferPostPageFetchesUntil(gate: Promise<void>): void {
  postPageFetchGate = gate;
}
