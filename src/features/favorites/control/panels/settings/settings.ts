import * as FavoritesSettingsActions from "@/features/favorites/control/panels/settings/actions";
import * as FavoritesSettingsCatalog from "@/features/favorites/control/panels/settings/catalog";
import * as FavoritesSettingsFilter from "@/features/favorites/control/panels/settings/filter";
import * as FavoritesSettingsMenu from "@/features/favorites/control/panels/settings/menu";
import { AppContext } from "@/app/context/context";
import { CollapseAllButton } from "@/lib/ui/settings/components/collapse_all_button";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { Preferences } from "@/app/context/preferences";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsSection } from "@/features/favorites/control/panels/settings/types";
import { buildCollapsibleSection } from "@/lib/ui/settings/components/section";
import { createElement } from "@/utils/browser/element";

export function mount(context: AppContext): FavoritesDrawerViewContent {
  const { environment, preferences } = context;
  const settingsSections = FavoritesSettingsMenu.buildSettingsSections(FavoritesSettingsCatalog.buildSettingsCatalog(context), environment);
  const sections = settingsSections.map(section => buildSection(preferences, section, () => collapseAll.refresh()));
  const collapseAll = new CollapseAllButton(sections, (collapsed) => expandAll(preferences, settingsSections, !collapsed));
  return {
    mount: (panel): void => {
      panel.classList.add(SettingsClass.view);
      panel.append(FavoritesSettingsFilter.inputFilter(panel, [collapseAll.element]), body(sections));
    },
    actions: [collapseAll.element, FavoritesSettingsActions.resetAllButton()]
  };
}

function body(sections: HTMLElement[]): HTMLElement {
  return createElement("div", { className: SettingsClass.body, children: [...sections, placeholder()] });
}

function placeholder(): HTMLElement {
  return createElement("div", { className: SettingsClass.filterEmpty, textContent: "No matching settings" });
}

function buildSection(preferences: Preferences, section: SettingsSection, onToggle: () => void): HTMLElement {
  return buildCollapsibleSection({
    title: section.title,
    collapsed: !isExpanded(preferences, section),
    children: section.controls.map((control) => control()),
    onToggle: (collapsed) => {
      expand(preferences, section.title, !collapsed);
      onToggle();
    }
  });
}

function expand(preferences: Preferences, title: string, expanded: boolean): void {
  preferences.favorites.settingsExpandedSections.set({ ...preferences.favorites.settingsExpandedSections.value, [title]: expanded });
}

function expandAll(preferences: Preferences, sections: SettingsSection[], expanded: boolean): void {
  preferences.favorites.settingsExpandedSections.set(Object.fromEntries(sections.map(({ title }) => [title, expanded])));
}

function isExpanded(preferences: Preferences, section: SettingsSection): boolean {
  return preferences.favorites.settingsExpandedSections.value[section.title] ?? section.expanded === true;
}
