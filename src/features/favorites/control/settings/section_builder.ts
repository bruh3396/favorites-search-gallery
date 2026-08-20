import { Preferences } from "@/app/context/preferences";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsSection } from "@/features/favorites/control/settings/types";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";
import { isExpanded } from "@/features/favorites/control/settings/helpers";
import { toggleDataset } from "@/utils/browser/dataset";

export function buildSections(sections: SettingsSection[]): HTMLElement[] {
  return sections.map(buildSection);
}

function buildSection(settingsSection: SettingsSection): HTMLElement {
  const isCollapsed = !isExpanded(settingsSection);
  const section = createElement("section", { className: SettingsClass.section, dataset: isCollapsed ? { collapsed: "" } : undefined });
  const title = createElement("span", { className: SettingsClass.sectionTitle, textContent: settingsSection.title });
  const header = createElement("button", { className: SettingsClass.sectionHeader, children: [title, icon("chevronDown")] });
  const body = createElement("div", { className: SettingsClass.group, children: settingsSection.controls.map((control) => control()) });
  const wrap = createElement("div", { className: SettingsClass.groupWrap, children: [body] });

  header.type = "button";
  header.addEventListener("click", () => {
    toggleSection(settingsSection.title, section);
  });

  section.append(header, wrap);
  return section;
}

function toggleSection(title: string, element: HTMLElement): void {
  const isCollapsed = element.dataset.collapsed === undefined;

  toggleDataset(element, "collapsed", isCollapsed);
  const state = { ...Preferences.favorites.settingsExpandedSections.value, [title]: !isCollapsed };

  Preferences.favorites.settingsExpandedSections.set(state);
}
