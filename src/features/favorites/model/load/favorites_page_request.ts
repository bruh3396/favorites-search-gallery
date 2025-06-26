import { FavoriteItem } from "../../types/favorite/favorite_item";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { createFavoritesPageURL } from "../../../../lib/api/api_url";

export class FavoritesPageRequest {
  public readonly pageNumber: number;
  public favorites: FavoriteItem[] = [];
  private retryCount: number;

  constructor(pageNumber: number) {
    this.pageNumber = pageNumber;
    this.retryCount = 0;
  }

  public get url(): string {
    return createFavoritesPageURL(this.pageNumber * 50);
  }

  public get fetchDelay(): number {
    return (7 ** (this.retryCount)) + FavoritesSettings.favoritesPageFetchDelay;
  }

  public get realPageNumber(): number {
    return this.pageNumber * 50;
  }

  public retry(): void {
    this.retryCount += 1;
  }
}
