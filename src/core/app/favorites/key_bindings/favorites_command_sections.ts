import { FavoritesCommand } from "@/core/app/favorites/commands/favorites_command";

export const FAVORITES_COMMAND_SECTIONS = [
  {
    title: "Search",
    favoritesCommands: [
      "focusSearch", "clearSearch", "toggleSearchOptions", "cycleSort", "toggleSortAscending", "shuffle",
      "cycleRating", "toggleBlacklist", "toggleInvert", "cycleStatus", "resetSearchOptions", "searchElsewhere"
    ]
  },
  {
    title: "Browse",
    favoritesCommands: [
      "goToNextPage", "goToPreviousPage", "goToFirstPage", "goToLastPage",
      "openNewTab", "closeTab", "goToNextTab", "goToPreviousTab", "toggleTabs", "moveTabLeft", "moveTabRight", "closeAllTabs",
      "toggleInfiniteScroll", "increasePageSize", "decreasePageSize"
    ]
  },
  { title: "Grid", favoritesCommands: ["increaseTileSize", "decreaseTileSize", "cycleLayout", "toggleHd"] },
  { title: "Gallery", favoritesCommands: ["openGallery", "cycleGalleryMode"] },
  {
    title: "Misc",
    favoritesCommands: [
      "toggleZen", "exitZen", "toggleSettings",
      "cycleTheme", "toggleColorScheme", "toggleHeader", "toggleEnhanceSearchPages", "resetSettings"
    ]
  }
] as const satisfies readonly { title: string; favoritesCommands: readonly FavoritesCommand[] }[];
