import { PostPage, parsePostFromPostPage } from "@/adapters/rule34/client/post_page/parser";
import { BASE_INDEX_URL } from "@/adapters/rule34/client/site";
import { fetchHtml } from "@/utils/browser/http";
import { runPageRequest } from "@/adapters/rule34/client/http";
import { withExponentialBackoff } from "@/lib/async/scheduling";

let postPageFetchGate: Promise<void> = Promise.resolve();
let openPostPageFetchGate = (): void => { };

export function postPageUrl(id: string): string {
  return `${BASE_INDEX_URL}post&s=view&id=${id}`;
}

export async function fetchPostPageHtml(id: string): Promise<string> {
  await postPageFetchGate;
  return runPageRequest(() => withExponentialBackoff(() => fetchHtml(postPageUrl(id)), 3, 1000));
}

export function fetchPostPage(id: string): Promise<PostPage> {
  return fetchPostPageHtml(id).then(parsePostFromPostPage);
}

// Post pages share Rule34's rate limit with favorites pages; favorites go first.
export function holdPostPageFetches(): void {
  postPageFetchGate = new Promise(resolve => {
    openPostPageFetchGate = resolve;
  });
}

export function releasePostPageFetches(): void {
  openPostPageFetchGate();
}
