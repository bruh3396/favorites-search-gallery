export class FavoritesPaginationParameters {
  public currentPageNumber: number;
  public finalPageNumber: number;
  public favoritesCount: number;
  public startIndex: number;
  public endIndex: number;

  constructor(currentPageNumber: number, finalPageNumber: number, favoritesCount: number, startIndex: number, endIndex: number) {
    this.currentPageNumber = currentPageNumber;
    this.finalPageNumber = finalPageNumber;
    this.favoritesCount = favoritesCount;
    this.startIndex = startIndex;
    this.endIndex = Math.min(this.favoritesCount, endIndex);
  }
}

export const EMPTY_FAVORITES_PAGINATION_PARAMETERS = new FavoritesPaginationParameters(1, 1, 0, 0, 0);
