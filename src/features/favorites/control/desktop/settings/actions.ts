import { Preference } from "@/lib/storage/preference";
import { Preferences } from "@/app/context/preferences";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsSection } from "@/features/favorites/control/desktop/settings/types";
import { SettingsSections } from "@/features/favorites/control/desktop/settings/sections";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { allSectionsCollapsed } from "@/features/favorites/control/desktop/settings/helpers";
import { createElement } from "@/utils/dom/element_factory";
import { icon } from "@/lib/ui/icon";
import { reloadWindow } from "@/utils/browser/window";
import { toggleDataset } from "@/utils/dom/dataset";

export function resetAllButton(): HTMLElement {
  const button = createElement("button", { children: [icon("reset")] });

  button.type = "button";
  addTooltip(button, "Reset settings", "below");
  button.addEventListener("click", () => {
    if (window.confirm("Reset settings?")) {
      Preference.resetAll();
      reloadWindow();
    }
  });
  return button;
}

export function collapseExpandButton(): HTMLElement {
  const button = createElement("button", { className: SettingsClass.collapseExpand, children: [icon("collapseAll"), icon("expandAll")] });

  button.type = "button";
  renderCollapseState(button, allSectionsCollapsed(SettingsSections));
  Preferences.favorites.settingsExpandedSections.on(() => {
    renderCollapseState(button, allSectionsCollapsed(SettingsSections));
  });
  button.addEventListener("click", () => {
    toggleAllSections(SettingsSections);
  });
  return button;
}

function toggleAllSections(sections: SettingsSection[]): void {
  const collapsed = !allSectionsCollapsed(sections);
  const state: Record<string, boolean> = {};

  for (const { title } of sections) {
    state[title] = !collapsed;
  }
  Preferences.favorites.settingsExpandedSections.set(state);

  for (const element of document.querySelectorAll<HTMLElement>(`.${SettingsClass.view} .${SettingsClass.section}`)) {
    toggleDataset(element, "collapsed", collapsed);
  }
}

function renderCollapseState(button: HTMLElement, collapsed: boolean): void {
  toggleDataset(button, "collapsed", collapsed);
  addTooltip(button, `${collapsed ? "Expand" : "Collapse"} settings`, "below");
}
