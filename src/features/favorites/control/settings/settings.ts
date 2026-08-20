import { collapseExpandButton, resetAllButton } from "@/features/favorites/control/settings/actions";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsSections } from "@/features/favorites/control/settings/sections";
import { buildFilterInput } from "@/features/favorites/control/settings/filter";
import { buildSections } from "@/features/favorites/control/settings/section_builder";
import { createElement } from "@/utils/browser/element";

export function mount(): FavoritesDrawerViewContent {
  const collapseExpand = collapseExpandButton();
  return {
    mount: (panel): void => {
      build(panel, [collapseExpand]);
    },
    actions: [collapseExpand, resetAllButton()]
  };
}

function build(panel: HTMLElement, hideWhileFiltering: HTMLElement[]): void {
  panel.classList.add(SettingsClass.view);
  panel.append(buildFilterInput(panel, hideWhileFiltering), body());
}

function body(): HTMLElement {
  return createElement("div", { className: SettingsClass.body, children: [...buildSections(SettingsSections), placeholder()] });

}

function placeholder(): HTMLElement {
  return createElement("div", { className: SettingsClass.filterEmpty, textContent: "No matching settings" });
}
