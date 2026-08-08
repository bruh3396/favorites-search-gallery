import { removeDataset, setDataset } from "@/utils/dom/dataset";
import { FavoritesDrawerViewContent } from "@/types/app";
import { FavoritesSettings } from "@/features/favorites/control/settings";
import { Preferences } from "@/app/context/preferences";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsControl } from "@/lib/ui/settings/controls";
import { createElement } from "@/utils/dom/element_factory";
import { icon } from "@/lib/ui/icon";

interface SettingsSection {
  title: string;
  controls: SettingsControl[];
}

const sections: SettingsSection[] = [
  {
    title: "General",
    controls: [
      FavoritesSettings.performanceProfile,
      FavoritesSettings.enhanceSearchPages,
      FavoritesSettings.hints
    ]
  },
  {
    title: "Appearance",
    controls: [
      FavoritesSettings.theme,
      FavoritesSettings.darkMode,
      FavoritesSettings.header
    ]
  },
  {
    title: "Layout",
    controls: [
      FavoritesSettings.layout,
      FavoritesSettings.columnCount,
      FavoritesSettings.rowHeight
    ]
  },
  {
    title: "Results",
    controls: [
      FavoritesSettings.sortKey,
      FavoritesSettings.sortAscending,
      FavoritesSettings.resultsPerPage,
      FavoritesSettings.infiniteScroll
    ]
  },
  {
    title: "Search",
    controls: [
      FavoritesSettings.rating,
      FavoritesSettings.excludeBlacklist
    ]
  },
  {
    title: "Hover",
    controls: [
      FavoritesSettings.postOverlay,
      FavoritesSettings.tooltip,
      FavoritesSettings.fullscreenOnHover
    ]
  },
  {
    title: "Gallery",
    controls: [
      FavoritesSettings.autoplay,
      FavoritesSettings.galleryMenu
    ]
  }
];

export function buildDrawerView(): FavoritesDrawerViewContent {
  return { build: buildSettingsPanel, actions: [buildCollapseAllButton()] };
}

function buildSettingsPanel(panel: HTMLElement): void {
  panel.classList.add(SettingsClass.view);

  for (const section of sections) {
    panel.appendChild(buildSection(section));
  }
}

function buildCollapseAllButton(): HTMLElement {
  const button = createElement("button");

  button.type = "button";
  renderCollapseAllButton(button);
  button.addEventListener("click", toggleAllSections);
  Preferences.favorites.settingsCollapsedSections.on(() => {
    renderCollapseAllButton(button);
  });
  return button;
}

function renderCollapseAllButton(button: HTMLElement): void {
  button.replaceChildren(icon(allSectionsCollapsed() ? "expandAll" : "collapseAll"));
}

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

function allSectionsCollapsed(): boolean {
  return sections.every(({ title }) => Preferences.favorites.settingsCollapsedSections.value[title] === true);
}

function toggleAllSections(): void {
  const collapsed = !allSectionsCollapsed();
  const state: Record<string, boolean> = {};

  for (const { title } of sections) {
    state[title] = collapsed;
  }
  Preferences.favorites.settingsCollapsedSections.set(state);

  for (const element of document.querySelectorAll<HTMLElement>(`.${SettingsClass.view} .${SettingsClass.section}`)) {
    if (collapsed) {
      setDataset(element, "collapsed", "");
    } else {
      removeDataset(element, "collapsed");
    }
  }
}

function toggleSection(title: string, element: HTMLElement): void {
  const collapsed = element.dataset.collapsed === undefined;

  if (collapsed) {
    setDataset(element, "collapsed", "");
  } else {
    removeDataset(element, "collapsed");
  }
  const state = { ...Preferences.favorites.settingsCollapsedSections.value, [title]: collapsed };

  Preferences.favorites.settingsCollapsedSections.set(state);
}
