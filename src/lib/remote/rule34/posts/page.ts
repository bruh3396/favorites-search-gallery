import { buildPostPageUrl } from "@/lib/remote/url/page_url_builder";
import { fetchHtml } from "@/lib/remote/http/client";
import { generalPageRequestQueue } from "@/lib/remote/http/rate_limiters";
import { withExponentialBackoff } from "@/lib/async/timing";

let postPageFetchGate: Promise<void> = Promise.resolve();

export async function fetchPostPageHtml(id: string): Promise<string> {
  await postPageFetchGate;
  await generalPageRequestQueue.wait();
  return withExponentialBackoff(() => fetchHtml(buildPostPageUrl(id)), 3, 1000);
}

export function deferPostPageFetchesUntil(gate: Promise<void>): void {
  postPageFetchGate = gate;
}
