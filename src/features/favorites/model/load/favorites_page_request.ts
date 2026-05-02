import { FAVORITES_PER_PAGE } from "../../../../lib/environment/constants";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { extractFavoriteElements } from "../../../../lib/server/parse/favorites_page_parser";

export class FavoritesPageRequest {
  public readonly pageNumber: number;
  public elements: HTMLElement[] = [];
  private retryCount = 0;

  constructor(pageNumber: number) {
    this.pageNumber = pageNumber;
  }

  public get fetchDelay(): number {
    return (FavoritesSettings.favoritesPageRetryBackoffBase ** (this.retryCount)) + FavoritesSettings.favoritesPageFetchDelay;
  }

  public get realPageNumber(): number {
    return this.pageNumber * FAVORITES_PER_PAGE;
  }

  public complete(html: string): void {
    this.elements = extractFavoriteElements(html);
  }

  public retry(): void {
    this.retryCount += 1;
  }
}
