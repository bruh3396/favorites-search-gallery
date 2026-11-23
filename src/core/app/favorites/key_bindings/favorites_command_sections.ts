import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";

export const FAVORITES_COMMAND_SECTIONS = [
  {
    title: "Search",
    favoritesCommands: [
      "focusSearch", "toggleSearchOptions", "cycleSort", "toggleSortAscending", "shuffle",
      "cycleRating", "toggleBlacklist", "toggleInvert", "cycleStatus"
    ]
  },
  {
    title: "Browse",
    favoritesCommands: [
      "goToNextPage", "goToPreviousPage",
      "openNewTab", "closeTab", "goToNextTab", "goToPreviousTab", "toggleTabs",
      "toggleInfiniteScroll", "increasePageSize", "decreasePageSize"
    ]
  },
  { title: "Grid", favoritesCommands: ["increaseTileSize", "decreaseTileSize", "cycleLayout", "toggleHd"] },
  {
    title: "Misc",
    favoritesCommands: [
      "openGallery", "cycleGalleryMode", "toggleZen", "exitZen", "toggleSettings",
      "cycleTheme", "toggleColorScheme", "toggleHeader", "toggleEnhancedPostsPage"
    ]
  }
] as const satisfies readonly { title: string; favoritesCommands: readonly FavoritesCommand[] }[];
