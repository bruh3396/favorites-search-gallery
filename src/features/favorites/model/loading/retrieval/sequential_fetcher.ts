import { sleep, withExponentialBackoff } from "@/lib/async/scheduling";
import { FAVORITES_PER_PAGE } from "@/lib/constants";
import { FavoritesPageRequest } from "@/features/favorites/types/favorites_page_request";
import { extractFavoriteElements } from "@/lib/remote/parsers/favorites_page_parser";
import { fetchFavoritesPage } from "@/lib/remote/fetchers/html";
import { parseIdFromThumb } from "@/lib/ui/thumb/post_id";

export class FavoritesSequentialFetcher {
  constructor(
    private readonly fetchDelay: number,
    private readonly fetchRetries: number,
    private readonly favoritesPageId: string
  ) { }

  public async fetchNewFavorites(storedIds: Set<string>, firstPageFavorites?: HTMLElement[]): Promise<HTMLElement[]> {
    const allNewFavorites: HTMLElement[] = [];
    let pageNumber = 0;

    if (firstPageFavorites !== undefined) {
      const newFavorites = firstPageFavorites.filter(element => !storedIds.has(parseIdFromThumb(element)));

      allNewFavorites.push(...newFavorites);

      if (newFavorites.length < FAVORITES_PER_PAGE) {
        return allNewFavorites;
      }
      pageNumber = 1;
    }

    while (await this.fetchNewFavoritesFromPage(storedIds, pageNumber, allNewFavorites)) {
      pageNumber += 1;
      await sleep(this.fetchDelay);
    }
    return allNewFavorites;
  }

  private async fetchNewFavoritesFromPage(storedIds: Set<string>, pageNumber: number, allNewFavorites: HTMLElement[]): Promise<boolean> {
    const html = await withExponentialBackoff(() => this.fetchFavoritesPageHtml(pageNumber), this.fetchRetries);
    const newFavorites = extractFavoriteElements(html).filter(element => !storedIds.has(parseIdFromThumb(element)));

    allNewFavorites.push(...newFavorites);
    return newFavorites.length === FAVORITES_PER_PAGE;
  }

  private fetchFavoritesPageHtml(pageNumber: number): Promise<string> {
    return fetchFavoritesPage(this.favoritesPageId, new FavoritesPageRequest(pageNumber).realPageNumber);
  }
}
