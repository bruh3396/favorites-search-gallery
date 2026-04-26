import { FAVORITES_PER_PAGE } from "../../../../lib/environment/constants";
import { FavoriteItem } from "../../types/favorite_item";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { buildFavoritesPageURL } from "../../../../lib/server/url/page_url_builder";

export class FavoritesPageRequest {

  public readonly pageNumber: number;
  public favorites: FavoriteItem[] = [];
  private retryCount = 0;

  constructor(pageNumber: number) {
    this.pageNumber = pageNumber;
  }

  public get url(): string {
    return buildFavoritesPageURL(this.realPageNumber);
  }

  public get fetchDelay(): number {
    return (FavoritesSettings.favoritesPageRetryBackoffBase ** (this.retryCount)) + FavoritesSettings.favoritesPageFetchDelay;
  }

  public get realPageNumber(): number {
    return this.pageNumber * FAVORITES_PER_PAGE;
  }

  public retry(): void {
    this.retryCount += 1;
  }
}
