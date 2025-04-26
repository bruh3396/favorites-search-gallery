import {FavoriteI} from "../types/favorite/interfaces";
import {extractFavorites} from "./extractor";

export class FavoritesPageRequest {
  public readonly pageNumber: number;
  public favorites: FavoriteI[] = [];
  private retryCount: number;

  get url(): string {
    return `${document.location.href}&pid=${this.pageNumber * 50}`;
  }

  get fetchDelay(): number {
    return (7 ** (this.retryCount)) + 200;
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
