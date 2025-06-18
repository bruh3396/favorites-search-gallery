export type FavoritesPaginationParameters = {
  currentPageNumber: number
  finalPageNumber: number
  favoritesCount: number
  startIndex: number
  endIndex: number
};

export const EMPTY_FAVORITES_PAGINATION_PARAMETERS = {
  currentPageNumber: 1,
  finalPageNumber: 1,
  favoritesCount: 0,
  startIndex: 0,
  endIndex: 0
};
