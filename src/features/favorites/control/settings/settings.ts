import { collapseExpandButton, resetAllButton } from "@/features/favorites/control/settings/actions";
import { AppContext } from "@/app/context/context";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsSection } from "@/features/favorites/control/settings/types";
import { buildSettingsCatalog } from "@/features/favorites/control/settings/catalog";
import { buildSettingsSections } from "@/features/favorites/control/settings/menu";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";
import { inputFilter } from "@/features/favorites/control/settings/filter";
import { toggleDataset } from "@/utils/browser/dataset";

export function mount(context: AppContext): FavoritesDrawerViewContent {
  const { environment, preferences, shell } = context;
  const catalog = buildSettingsCatalog(context);
  const sections = buildSettingsSections(catalog, environment);
  const collapseExpand = collapseExpandButton(preferences, sections, shell.root);
  return {
    mount: (panel): void => {
      build(context, panel, sections, [collapseExpand]);
    },
    actions: [collapseExpand, resetAllButton()]
  };
}

function build(context: AppContext, panel: HTMLElement, sections: ReturnType<typeof buildSettingsSections>, hideWhileFiltering: HTMLElement[]): void {
  panel.classList.add(SettingsClass.view);
  panel.append(inputFilter(panel, hideWhileFiltering), body(context, sections));
}

function body(context: AppContext, sections: ReturnType<typeof buildSettingsSections>): HTMLElement {
  return createElement("div", { className: SettingsClass.body, children: [...buildSections(context.preferences, sections), placeholder()] });
}

function placeholder(): HTMLElement {
  return createElement("div", { className: SettingsClass.filterEmpty, textContent: "No matching settings" });
}

function buildSections(preferences: Preferences, sections: SettingsSection[]): HTMLElement[] {
  return sections.map((section) => buildSection(preferences, section));
}

function buildSection(preferences: Preferences, settingsSection: SettingsSection): HTMLElement {
  const isCollapsed = !isExpanded(preferences, settingsSection);
  const section = createElement("section", { className: SettingsClass.section, dataset: isCollapsed ? { collapsed: "" } : undefined });
  const title = createElement("span", { className: SettingsClass.sectionTitle, textContent: settingsSection.title });
  const header = createElement("button", { className: SettingsClass.sectionHeader, children: [title, icon("chevronDown")] });
  const body2 = createElement("div", { className: SettingsClass.group, children: settingsSection.controls.map((control) => control()) });
  const wrap = createElement("div", { className: SettingsClass.groupWrap, children: [body2] });

  header.type = "button";
  header.addEventListener("click", () => {
    toggleSection(preferences, settingsSection.title, section);
  });

  section.append(header, wrap);
  return section;
}

function toggleSection(preferences: Preferences, title: string, element: HTMLElement): void {
  const isCollapsed = element.dataset.collapsed === undefined;

  toggleDataset(element, "collapsed", isCollapsed);
  const state = { ...preferences.favorites.settingsExpandedSections.value, [title]: !isCollapsed };

  preferences.favorites.settingsExpandedSections.set(state);
}

function isExpanded(preferences: Preferences, section: SettingsSection): boolean {
  return preferences.favorites.settingsExpandedSections.value[section.title] ?? section.expanded === true;
}
