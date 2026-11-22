export type FavoritesCommand =
  | "focusSearch" | "clearSearch" | "toggleSearchOptions" | "cycleSort" | "toggleSortAscending" | "shuffle"
  | "cycleRating" | "toggleBlacklist" | "toggleInvert" | "cycleStatus" | "resetSearchOptions" | "searchElsewhere"
  | "goToNextPage" | "goToPreviousPage" | "goToFirstPage" | "goToLastPage"
  | "openNewTab" | "closeTab" | "goToNextTab" | "goToPreviousTab" | "toggleTabs" | "moveTabLeft" | "moveTabRight" | "closeAllTabs"
  | "toggleInfiniteScroll" | "increasePageSize" | "decreasePageSize"
  | "increaseTileSize" | "decreaseTileSize" | "cycleLayout" | "toggleHd"
  | "toggleZen" | "exitZen" | "toggleSettings" | "cycleTheme" | "toggleColorScheme" | "toggleHeader" | "toggleEnhanceSearchPages" | "resetSettings"
  | "openGallery" | "cycleGalleryMode";

export const REPEATABLE_FAVORITES_COMMANDS: ReadonlySet<FavoritesCommand> = new Set<FavoritesCommand>([
  "goToNextPage",
  "goToPreviousPage",
  "goToNextTab",
  "goToPreviousTab",
  "moveTabLeft",
  "moveTabRight",
  "increasePageSize",
  "decreasePageSize",
  "increaseTileSize",
  "decreaseTileSize"
]);
