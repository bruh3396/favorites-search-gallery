import { FavoritesId } from "@/features/favorites/types/scaffold";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsControl } from "@/lib/ui/settings/controls";
import { Settings } from "@/features/favorites/control/settings";
import { removeDataset, setDataset } from "@/utils/dom/attribute";
import { ButtonElement } from "@/types/element";
import { Events } from "@/app/channels/events";
import { FavoritesConfig } from "@/config/favorites_config";
import { Preferences } from "@/app/context/preferences";
import { buildButtonElement } from "@/lib/ui/elements/button";
import { createElement } from "@/utils/dom/element_factory";
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
  panel.classList.add(SettingsClass.panel);

  if (FavoritesConfig.settingsTooltipHintEnabled) {
    setDataset(panel, "tooltips");
  }

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
      Settings.theme,
      Settings.layout,
      Settings.resultsPerPage,
      Settings.columnCount,
      Settings.rowHeight,
      Settings.infiniteScroll,
      // Settings.gradient,
      // Settings.fadeThumbs,
      Settings.header
    ]
  },
  {
    title: "Search",
    controls: [
      Settings.sortKey,
      Settings.sortAscending,
      Settings.excludeBlacklist,
      Settings.rating
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

function buildSection(settingsSection: SettingsSection): HTMLElement {
  const collapsed = Preferences.favorites.settingsCollapsedSections.value[settingsSection.title] === true;
  const section = createElement("section", { className: SettingsClass.section, dataset: collapsed ? { collapsed: "" } : undefined });
  const title = createElement("span", { className: SettingsClass.sectionTitle, textContent: settingsSection.title });
  const header = createElement("button", { className: SettingsClass.sectionHeader, children: [title, icon("chevronDown")] });

  header.type = "button";
  const body = createElement("div", { className: SettingsClass.group, children: settingsSection.controls.map((control) => control()) });
  const wrap = createElement("div", { className: SettingsClass.groupWrap, children: [body] });

  header.addEventListener("click", () => {
    toggleSection(settingsSection.title, section);
  });

  section.append(header, wrap);
  return section;
}

function toggleSection(title: string, element: HTMLElement): void {
  const collapsed = element.dataset.collapsed === undefined;

  if (collapsed) {
    element.dataset.collapsed = "";
    setDataset(element, "collapsed");
  } else {
    removeDataset(element, "collapsed");
  }
  const state = { ...Preferences.favorites.settingsCollapsedSections.value, [title]: collapsed };

  Preferences.favorites.settingsCollapsedSections.set(state);
}
