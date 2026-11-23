export type FavoritesCommand =
  | "focusSearch" | "toggleSearchOptions" | "cycleSort" | "toggleSortAscending" | "shuffle"
  | "cycleRating" | "toggleBlacklist" | "toggleInvert" | "cycleStatus"
  | "goToNextPage" | "goToPreviousPage"
  | "openNewTab" | "closeTab" | "goToNextTab" | "goToPreviousTab" | "toggleTabs"
  | "toggleInfiniteScroll" | "increasePageSize" | "decreasePageSize"
  | "increaseTileSize" | "decreaseTileSize" | "cycleLayout" | "toggleHd"
  | "toggleZen" | "exitZen" | "toggleSettings" | "toggleKeyboardShortcuts" |"cycleTheme" | "toggleColorScheme" | "toggleHeader" | "toggleEnhancedPostsPage"
  | "openGallery" | "cycleGalleryMode";

export const REPEATABLE_FAVORITES_COMMANDS: ReadonlySet<FavoritesCommand> = new Set<FavoritesCommand>([
  "goToNextPage",
  "goToPreviousPage",
  "goToNextTab",
  "goToPreviousTab",
  "increasePageSize",
  "decreasePageSize",
  "increaseTileSize",
  "decreaseTileSize"
]);
