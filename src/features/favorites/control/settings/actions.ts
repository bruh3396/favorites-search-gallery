import { Preference } from "@/lib/storage/preference";
import { Preferences } from "@/app/context/preferences";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsSection } from "@/features/favorites/control/settings/types";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { allSectionsCollapsed } from "@/features/favorites/control/settings/helpers";
import { createElement } from "@/utils/browser/element";
import { icon } from "@/lib/ui/icon";
import { reloadWindow } from "@/utils/browser/window";
import { toggleDataset } from "@/utils/browser/dataset";

export function resetAllButton(): HTMLElement {
  const button = createElement("button", { children: [icon("reset")] });

  button.type = "button";
  addTooltip(button, "Reset", "below");
  button.addEventListener("click", () => {
    if (window.confirm("Reset all settings?")) {
      Preference.resetAll();
      reloadWindow();
    }
  });
  return button;
}

export function collapseExpandButton(preferences: Preferences, sections: SettingsSection[]): HTMLElement {
  const button = createElement("button", { className: SettingsClass.collapseExpand, children: [icon("collapseAll"), icon("expandAll")] });

  button.type = "button";
  renderCollapseState(button, allSectionsCollapsed(preferences, sections));
  preferences.favorites.settingsExpandedSections.on(() => {
    renderCollapseState(button, allSectionsCollapsed(preferences, sections));
  });
  button.addEventListener("click", () => {
    toggleAllSections(preferences, sections);
  });
  return button;
}

function toggleAllSections(preferences: Preferences, sections: SettingsSection[]): void {
  const isCollapsed = !allSectionsCollapsed(preferences, sections);
  const state: Record<string, boolean> = {};

  for (const { title } of sections) {
    state[title] = !isCollapsed;
  }
  preferences.favorites.settingsExpandedSections.set(state);

  for (const element of document.querySelectorAll<HTMLElement>(`.${SettingsClass.view} .${SettingsClass.section}`)) {
    toggleDataset(element, "collapsed", isCollapsed);
  }
}

function renderCollapseState(button: HTMLElement, collapsed: boolean): void {
  toggleDataset(button, "collapsed", collapsed);
  addTooltip(button, `${collapsed ? "Expand" : "Collapse"} all`, "below");
}
