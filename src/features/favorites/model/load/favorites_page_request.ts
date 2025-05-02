import {FavoriteItem} from "../../types/favorite/favorite_item";
import {createFavoritesPageURL} from "../../../../lib/api/url";

const FAVORITES_PAGE_FETCH_DELAY = 200;

export class FavoritesPageRequest {
  public readonly pageNumber: number;
  public favorites: FavoriteItem[] = [];
  private retryCount: number;

  get url(): string {
    return createFavoritesPageURL(this.pageNumber * 50);
  }

  get fetchDelay(): number {
    return (7 ** (this.retryCount)) + FAVORITES_PAGE_FETCH_DELAY;
  }

  get realPageNumber(): number {
    return this.pageNumber * 50;
  }

  constructor(pageNumber: number) {
    this.pageNumber = pageNumber;
    this.retryCount = 0;
  }

  public retry(): void {
    this.retryCount += 1;
  }
}
