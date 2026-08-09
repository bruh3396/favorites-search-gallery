import { Preference } from "@/lib/storage/preference";
import { Preferences } from "@/app/context/preferences";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsSection } from "./types";
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
  addTooltip(button, "Reset all settings", "below");
  button.addEventListener("click", () => {
    if (window.confirm("Reset all settings?")) {
      Preference.resetAll();
      reloadWindow();
    }
  });
  return button;
}

export function collapseExpandButton(): HTMLElement {
  const button = createElement("button");

  button.type = "button";
  renderCollapseExpandButton(button);
  button.addEventListener("click", () => {
    toggleAllSections(SettingsSections);
  });
  Preferences.favorites.settingsCollapsedSections.on(() => {
    renderCollapseExpandButton(button);
  });
  return button;
}

function renderCollapseExpandButton(button: HTMLElement): void {
  const collapsed = allSectionsCollapsed(SettingsSections);

  button.replaceChildren(icon(collapsed ? "expandAll" : "collapseAll"));
  addTooltip(button, `${collapsed ? "Expand" : "Collapse"} all settings`, "below");
}

function toggleAllSections(sections: SettingsSection[]): void {
  const collapsed = !allSectionsCollapsed(sections);
  const state: Record<string, boolean> = {};

  for (const { title } of sections) {
    state[title] = collapsed;
  }
  Preferences.favorites.settingsCollapsedSections.set(state);

  for (const element of document.querySelectorAll<HTMLElement>(`.${SettingsClass.view} .${SettingsClass.section}`)) {
    toggleDataset(element, "collapsed", collapsed);
  }
}
