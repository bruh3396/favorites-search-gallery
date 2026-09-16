import { collapseExpandButton, resetAllButton } from "@/features/favorites/control/settings/actions";
import { AppContext } from "@/app/context/context";
import { FavoritesDrawerViewContent } from "@/types/favorite";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { buildFilterInput } from "@/features/favorites/control/settings/filter";
import { buildSections } from "@/features/favorites/control/settings/section_builder";
import { buildSettingsCatalog } from "@/features/favorites/control/settings/catalog";
import { buildSettingsSections } from "@/features/favorites/control/settings/menu";
import { createElement } from "@/utils/browser/element";

export function mount(context: AppContext): FavoritesDrawerViewContent {
  const { environment, preferences } = context;
  const catalog = buildSettingsCatalog(context);
  const sections = buildSettingsSections(catalog, environment);
  const collapseExpand = collapseExpandButton(preferences, sections);
  return {
    mount: (panel): void => {
      build(context, panel, sections, [collapseExpand]);
    },
    actions: [collapseExpand, resetAllButton()]
  };
}

function build(context: AppContext, panel: HTMLElement, sections: ReturnType<typeof buildSettingsSections>, hideWhileFiltering: HTMLElement[]): void {
  panel.classList.add(SettingsClass.view);
  panel.append(buildFilterInput(panel, hideWhileFiltering), body(context, sections));
}

function body(context: AppContext, sections: ReturnType<typeof buildSettingsSections>): HTMLElement {
  return createElement("div", { className: SettingsClass.body, children: [...buildSections(context.preferences, sections), placeholder()] });
}

function placeholder(): HTMLElement {
  return createElement("div", { className: SettingsClass.filterEmpty, textContent: "No matching settings" });
}
