import { CheckboxElement, SelectElement } from "@/types/element";
import { Layout, PerformanceProfile, Theme } from "@/types/ui";
import { applySurfaceGradient, applyTheme, toggleGalleryMenuEnabled } from "@/lib/ui/style";
import * as DrawerPanel from "@/lib/ui/drawer_panel";
import { Events } from "@/app/channels/events";
import { FavoritesClass } from "@/features/favorites/types/scaffold";
import { MetadataMetric } from "@/types/search";
import { Preferences } from "@/app/context/preferences";
import { buildCheckboxOption } from "@/app/dom/checkbox";
import { buildSelectElement } from "@/lib/ui/elements/select";
import { hideUnusedLayoutSizer } from "@/app/layout/content_tiler";
import { reloadWindow } from "@/utils/browser/window";
import { toggleHeader } from "@/lib/ui/toggles";
import { toggleOptionHotkeyHints } from "@/features/favorites/dom_tweaks/ui_toggles";

const PANEL_CLASSES = {
  section: FavoritesClass.drawerSection,
  sectionTitle: FavoritesClass.drawerSectionTitle
};

// WIP / debug: the real controls from control/menu/desktop.ts, hardcoded into the
// drawer so every setting is reachable. Ids are "debug-" prefixed so they don't
// collide with the live menu. Number inputs are omitted (no builder exists yet).
const CHECKBOX_PARENT = "debug-settings-checkboxes";
const SELECT_PARENT = "debug-settings-selects";

const checkboxes: Partial<CheckboxElement>[] = [
  {
    id: "debug-enhance-post-lists",
    parentId: CHECKBOX_PARENT,
    textContent: "Enhance Search Pages",
    preference: Preferences.postListEnabled,
    hotkey: "",
    savePreference: true
  },
  {
    id: "debug-infinite-scroll",
    parentId: CHECKBOX_PARENT,
    textContent: "Infinite Scroll",
    preference: Preferences.favoritesInfiniteScroll,
    hotkey: "",
    event: Events.favorites.infiniteScrollToggled
  },
  {
    id: "debug-exclude-blacklist",
    parentId: CHECKBOX_PARENT,
    textContent: "Exclude Blacklist",
    preference: Preferences.favoritesExcludeBlacklist,
    hotkey: "",
    event: Events.favorites.blacklistToggled
  },
  {
    id: "debug-show-hints",
    parentId: CHECKBOX_PARENT,
    textContent: "Hotkey Hints",
    preference: Preferences.favoritesHintsEnabled,
    hotkey: "",
    function: toggleOptionHotkeyHints
  },
  {
    id: "debug-enable-autoplay",
    parentId: CHECKBOX_PARENT,
    textContent: "Autoplay",
    preference: Preferences.galleryAutoplayActive,
    hotkey: "",
    event: Events.favorites.autoplayToggled
  },
  {
    id: "debug-show-on-hover",
    parentId: CHECKBOX_PARENT,
    textContent: "Fullscreen on Hover",
    preference: Preferences.galleryPreviewEnabled,
    hotkey: "",
    event: Events.favorites.galleryPreviewToggled
  },
  {
    id: "debug-show-tooltips",
    parentId: CHECKBOX_PARENT,
    textContent: "Tooltip",
    preference: Preferences.favoritesTooltipEnabled,
    hotkey: "",
    event: Events.favorites.tooltipToggled
  },
  {
    id: "debug-show-post-overlay",
    parentId: CHECKBOX_PARENT,
    textContent: "Overlay",
    preference: Preferences.postOverlayEnabled,
    hotkey: "",
    event: Events.favorites.postOverlayToggled
  },
  {
    id: "debug-toggle-header",
    parentId: CHECKBOX_PARENT,
    textContent: "Header",
    preference: Preferences.favoritesHeaderEnabled,
    hotkey: "",
    function: toggleHeader
  },
  {
    id: "debug-toggle-surface-gradient",
    parentId: CHECKBOX_PARENT,
    textContent: "Gradient",
    preference: Preferences.appSurfaceGradient,
    hotkey: "",
    function: applySurfaceGradient
  },
  {
    id: "debug-show-saved-search-suggestions",
    parentId: CHECKBOX_PARENT,
    textContent: "Saved Suggestions",
    preference: Preferences.savedSearchesSuggestions,
    hotkey: "",
    savePreference: true
  },
  {
    id: "debug-enable-gallery-menu",
    parentId: CHECKBOX_PARENT,
    textContent: "Gallery Menu",
    function: toggleGalleryMenuEnabled,
    preference: Preferences.galleryMenuEnabled,
    hotkey: "",
    event: Events.favorites.galleryMenuToggled
  },
  {
    id: "debug-sort-ascending",
    parentId: CHECKBOX_PARENT,
    textContent: "Sort Ascending",
    preference: Preferences.favoritesSortAscending,
    hotkey: "",
    event: Events.favorites.sortAscendingToggled
  }
];

const selects: (Partial<SelectElement<Layout>> | Partial<SelectElement<MetadataMetric>> | Partial<SelectElement<PerformanceProfile>> | Partial<SelectElement<Theme>>)[] = [
  {
    id: "debug-theme",
    parentId: SELECT_PARENT,
    title: "Change theme",
    preference: Preferences.appTheme,
    function: applyTheme,
    options: new Map<Theme, string>([
      ["native-light", "Native Light"],
      ["native-dark", "Native Dark"],
      ["midnight", "Midnight"],
      ["ember", "Ember"],
      ["frozen-cobalt", "Cobalt"],
      ["venom", "Venom"],
      ["zeal", "Zeal"]
    ])
  },
  {
    id: "debug-sort-method",
    parentId: SELECT_PARENT,
    title: "Change sort order of search results",
    preference: Preferences.favoritesSortKey,
    event: Events.favorites.sortMethodChanged,
    options: new Map<MetadataMetric, string>([
      ["default", "Default"],
      ["score", "Score"],
      ["width", "Width"],
      ["height", "Height"],
      ["id", "Date Uploaded"],
      ["lastChangedTimestamp", "Date Changed"],
      ["duration", "Duration"],
      ["random", "Random"]
    ])
  },
  {
    id: "debug-layout-select",
    parentId: SELECT_PARENT,
    title: "Change layout",
    preference: Preferences.favoritesLayout,
    event: Events.favorites.layoutChanged,
    function: hideUnusedLayoutSizer,
    options: new Map<Layout, string>([
      ["column", "Waterfall"],
      ["row", "River"],
      ["square", "Square"],
      ["grid", "Legacy"],
      ["native", "Native"]
    ])
  },
  {
    id: "debug-performance-profile",
    parentId: SELECT_PARENT,
    title: "Improve performance by disabling features",
    preference: Preferences.appPerformanceProfile,
    event: Events.favorites.performanceProfileChanged,
    function: reloadWindow,
    options: new Map<PerformanceProfile, string>([
      ["normal", "Normal"],
      ["medium", "Medium (no upscaling)"],
      ["low", "Low (no gallery)"],
      ["potato", "Potato (only search)"]
    ])
  }
];

export function buildSettingsPanel(panel: HTMLElement): void {
  const checkboxContainer = document.createElement("div");
  const selectContainer = document.createElement("div");

  checkboxContainer.id = CHECKBOX_PARENT;
  selectContainer.id = SELECT_PARENT;
  panel.appendChild(DrawerPanel.section(PANEL_CLASSES, "Settings (debug)", checkboxContainer, selectContainer));
}

// The element builders resolve their parent via document.getElementById, so the
// controls can only be built after the drawer has been attached to the document.
export function wireSettingsPanel(): void {
  checkboxes.forEach(buildCheckboxOption);
  // @ts-expect-error mixed select value types, don't care for a debug menu
  selects.forEach(buildSelectElement);
}
