import {FavoriteItem} from "../../types/favorite/favorite";
import {createFavoritesPageURL} from "../../../../lib/api/url";
import {extractFavorites} from "./extractor";

export class FavoritesPageRequest {
  public readonly pageNumber: number;
  public favorites: FavoriteItem[] = [];
  private retryCount: number;

  get url(): string {
    return createFavoritesPageURL(this.pageNumber * 50);
  }

  get fetchDelay(): number {
    return (7 ** (this.retryCount)) + 200;
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

  public complete(html: string): void {
    this.favorites = extractFavorites(html);
  }
}
