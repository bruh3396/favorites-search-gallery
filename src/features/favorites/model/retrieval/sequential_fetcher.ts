import { sleep, withExponentialBackoff } from "@/lib/async/scheduling";
import { FAVORITES_PER_PAGE } from "@/lib/constants";
import { FavoritesPageRequest } from "@/features/favorites/types/favorites_page_request";
import { Post } from "@/types/api";
import { extractFavoriteElements } from "@/lib/remote/parsers/favorites_page_parser";
import { fetchFavoritesPage } from "@/lib/remote/fetchers/html";
import { parseIdFromThumb } from "@/lib/ui/thumb/post_id";
import { thumbToPost } from "@/features/favorites/types/thumb_to_post";

export class FavoritesSequentialFetcher {
  constructor(
    private readonly fetchDelay: number,
    private readonly fetchRetries: number,
    private readonly pageId: string
  ) { }

  public async fetchNew(storedIds: Set<string>, firstPageFavorites?: Post[]): Promise<Post[]> {
    const result: Post[] = [];
    let pageNumber = 0;

    if (firstPageFavorites !== undefined) {
      const unseen = firstPageFavorites.filter(post => !storedIds.has(post.id));

      result.push(...unseen);

      if (unseen.length < FAVORITES_PER_PAGE) {
        return result;
      }
      pageNumber = 1;
    }

    while (await this.fetchNewFromPage(storedIds, pageNumber, result)) {
      pageNumber += 1;
      await sleep(this.fetchDelay);
    }
    return result;
  }

  private async fetchNewFromPage(storedIds: Set<string>, pageNumber: number, result: Post[]): Promise<boolean> {
    const html = await withExponentialBackoff(() => fetchFavoritesPage(this.pageId, new FavoritesPageRequest(pageNumber).realPageNumber), this.fetchRetries);
    const unseen = extractFavoriteElements(html).filter(element => !storedIds.has(parseIdFromThumb(element)));

    result.push(...unseen.map(thumbToPost));
    return unseen.length === FAVORITES_PER_PAGE;
  }
}
