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
    title: "Navigation",
    favoritesCommands: [
      "goToNextPage", "goToPreviousPage",
      "openNewTab", "closeTab", "goToNextTab", "goToPreviousTab", "toggleTabs",
      "toggleInfiniteScroll", "increasePageSize", "decreasePageSize"
    ]
  },
  {
    title: "View",
    favoritesCommands: [
      "increaseTileSize", "decreaseTileSize", "cycleLayout", "toggleHd", "openGallery", "cycleGalleryMode",
      "toggleZen", "exitZen", "toggleSettings", "toggleKeyboardShortcuts",
      "cycleTheme", "toggleColorScheme", "toggleHeader", "toggleEnhancedPostsPage"
    ]
  }
] as const satisfies readonly { title: string; favoritesCommands: readonly FavoritesCommand[] }[];
