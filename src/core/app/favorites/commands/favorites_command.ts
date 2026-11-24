import { CommandDefinition } from "@/core/ui/key_bindings/command_definition";

export const FAVORITES_COMMAND_DEFINITIONS = {
  focusSearch: { label: "Focus Search Bar" },
  toggleSearchOptions: { label: "Toggle Search Options" },
  cycleSort: { label: "Cycle Sort" },
  toggleSortAscending: { label: "Toggle Ascending" },
  shuffle: { label: "Shuffle" },
  cycleRating: { label: "Cycle Rating" },
  toggleBlacklist: { label: "Toggle Blacklist" },
  toggleInvert: { label: "Toggle Invert" },
  cycleStatus: { label: "Cycle Status" },
  goToNextPage: { label: "Go to Next Page", repeatable: true },
  goToPreviousPage: { label: "Go to Previous Page", repeatable: true },
  openNewTab: { label: "Open New Tab" },
  closeTab: { label: "Close Tab" },
  goToNextTab: { label: "Go to Next Tab", repeatable: true },
  goToPreviousTab: { label: "Go to Previous Tab", repeatable: true },
  toggleTabs: { label: "Toggle Tabs" },
  toggleInfiniteScroll: { label: "Toggle Infinite Scroll" },
  increasePageSize: { label: "Increase Page Size", repeatable: true },
  decreasePageSize: { label: "Decrease Page Size", repeatable: true },
  increaseTileSize: { label: "Increase Tile Size", repeatable: true },
  decreaseTileSize: { label: "Decrease Tile Size", repeatable: true },
  cycleLayout: { label: "Cycle Layout" },
  toggleHd: { label: "Toggle HD" },
  toggleZen: { label: "Toggle Zen" },
  exitZen: { label: "Exit Zen" },
  toggleSettings: { label: "Toggle Settings" },
  toggleKeyboardShortcuts: { label: "Toggle Keyboard Shortcuts" },
  cycleTheme: { label: "Cycle Theme" },
  toggleColorScheme: { label: "Toggle Color Scheme" },
  toggleHeader: { label: "Toggle Header" },
  toggleEnhancedPostsPage: { label: "Toggle Enhanced Posts Page" },
  openGallery: { label: "Open Gallery" },
  cycleGalleryMode: { label: "Cycle Gallery Mode" }
} as const satisfies Readonly<Record<string, CommandDefinition>>;

export type FavoritesCommand = keyof typeof FAVORITES_COMMAND_DEFINITIONS;
