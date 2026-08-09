import { collapseExpandButton, resetAllButton } from "@/features/favorites/control/desktop/settings/actions";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { SettingsSections } from "@/features/favorites/control/desktop/settings/sections";
import { buildFilterInput } from "@/features/favorites/control/desktop/settings/filter";
import { buildSections } from "@/features/favorites/control/desktop/settings/section_builder";
import { createElement } from "@/utils/dom/element_factory";

export function mount(): FavoritesDrawerViewContent {
  const collapseExpand = collapseExpandButton();
  return {
    mount: (panel): void => {
      build(panel, [collapseExpand]);
    },
    actions: [resetAllButton(), collapseExpand]
  };
}

function build(panel: HTMLElement, hideWhileFiltering: HTMLElement[]): void {
  panel.classList.add(SettingsClass.view);
  panel.append(buildFilterInput(panel, hideWhileFiltering), ...buildSections(SettingsSections));
  panel.appendChild(createElement("div", { className: SettingsClass.filterEmpty, textContent: "No matching settings" }));
}
