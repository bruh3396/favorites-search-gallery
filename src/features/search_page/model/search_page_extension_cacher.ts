import * as ExtensionCache from "../../../lib/extension_cache";
import { correctMediaTags } from "./search_page_thumb_preparer";
import { fetchMultiplePostsFromAPI } from "../../../lib/server/fetch/api";

export async function cacheSearchPageExtensions(ids: Iterable<string>): Promise<void> {
  const posts = await fetchMultiplePostsFromAPI(Array.from(ids));

  for (const post of Object.values(posts)) {
    if (post.width > 0) {
      ExtensionCache.setExtensionFromPost(post);
      correctMediaTags(post);
    }
  }
}
