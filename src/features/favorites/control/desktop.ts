import { FavoritesId, SettingsClass } from "@/features/favorites/types/scaffold";
import { Settings, SettingsControl } from "@/features/favorites/control/settings";
import { ButtonElement } from "@/types/element";
import { Events } from "@/app/channels/events";
import { Preferences } from "@/app/context/preferences";
import { buildButtonElement } from "@/lib/ui/elements/button";
import { icon } from "@/lib/ui/icon";
import { prepareDynamicElements } from "@/lib/ui/elements/dynamic_element_preparer";

interface SettingsSection {
  title: string;
  controls: SettingsControl[];
}

export function setup(): void {
  prepareDynamicElements(buttons).forEach(buildButtonElement);
}

export function buildSettingsPanel(panel: HTMLElement): void {
  for (const section of sections) {
    panel.appendChild(buildSection(section));
  }
}

const buttons: Partial<ButtonElement>[] = [
  {
    id: "search-button",
    parentId: FavoritesId.searchButton,
    title: "Search",
    icon: "search",
    rightClickEnabled: true,
    event: Events.favorites.searchButtonClicked
  },
  {
    id: "shuffle-button",
    parentId: FavoritesId.buttonsSlot,
    textContent: "SHUFFLE",
    title: "Shuffle results",
    event: Events.favorites.shuffleButtonClicked
  },
  {
    id: "invert-button",
    parentId: FavoritesId.buttonsSlot,
    textContent: "INVERT",
    title: "Invert results",
    event: Events.favorites.invertButtonClicked
  },
  {
    id: "clear-button",
    parentId: FavoritesId.actions,
    icon: "clear",
    title: "Clear search",
    event: Events.favorites.clearButtonClicked
  },
  {
    id: "set-active_favorites_button",
    parentId: FavoritesId.actions,
    textContent: "Set Subset",
    title: "Make the current search results the entire set of results to search from",
    enabled: false,
    event: Events.favorites.setActiveFavoritesClicked
  },
  {
    id: "reset-active_favorites_button",
    parentId: FavoritesId.actions,
    textContent: "Stop Subset",
    title: "Reset active favorites to all",
    enabled: false,
    event: Events.favorites.resetActiveFavoritesClicked
  },
  {
    id: FavoritesId.panelButton,
    parentId: FavoritesId.drawerToggleSlot,
    icon: "hamburger",
    title: "Menu",
    event: Events.favorites.panelButtonClicked
  },
  {
    id: "reset-button",
    title: "Reset",
    parentId: FavoritesId.buttonsSlot,
    textContent: "RESET",
    event: Events.favorites.resetButtonClicked
  }
];

const sections: SettingsSection[] = [
  {
    title: "General",
    controls: [
      Settings.performanceProfile,
      Settings.enhanceSearchPages,
      Settings.postOverlay,
      Settings.tooltip

    ]
  },
  {
    title: "Appearance",
    controls: [
      Settings.layout,
      Settings.theme,
      Settings.gradient,
      // Settings.fadeThumbs,
      Settings.header,
      Settings.infiniteScroll,
      Settings.columnCount,
      Settings.rowHeight,
      Settings.resultsPerPage
    ]
  },
  {
    title: "Search",
    controls: [
      Settings.sortKey,
      Settings.sortAscending,
      Settings.excludeBlacklist,
      Settings.ratings
    ]
  },
  {
    title: "Gallery",
    controls: [
      Settings.autoplay,
      Settings.fullscreenOnHover,
      Settings.galleryMenu
    ]
  }
];

function buildSection(section: SettingsSection): HTMLElement {
  const collapsed = Preferences.favorites.settingsCollapsedSections.value[section.title] === true;

  const element = document.createElement("section");

  element.className = SettingsClass.section;

  if (collapsed) {
    element.dataset.collapsed = "";
  }

  const header = document.createElement("button");

  header.type = "button";
  header.className = SettingsClass.sectionHeader;

  const title = document.createElement("span");

  title.className = SettingsClass.sectionTitle;
  title.textContent = section.title;
  header.append(title, icon("chevronDown"));

  const wrap = document.createElement("div");

  wrap.className = SettingsClass.groupWrap;

  const body = document.createElement("div");

  body.className = SettingsClass.group;

  for (const control of section.controls) {
    body.appendChild(control());
  }
  wrap.appendChild(body);

  header.addEventListener("click", () => {
    toggleSection(section.title, element);
  });

  element.append(header, wrap);
  return element;
}

function toggleSection(title: string, element: HTMLElement): void {
  const collapsed = element.dataset.collapsed === undefined;

  if (collapsed) {
    element.dataset.collapsed = "";
  } else {
    delete element.dataset.collapsed;
  }
  const state = { ...Preferences.favorites.settingsCollapsedSections.value, [title]: collapsed };

  Preferences.favorites.settingsCollapsedSections.set(state);
}
