import { FavoritesDrawerView, FavoritesDrawerViewMap, FavoritesDrawerViewNames } from "@/types/favorite";
import { FavoritesClass } from "@/features/favorites/types/selectors";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { Preferences } from "@/app/context/preferences";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";

export function setup(preferences: Preferences, shell: FavoritesShell): void {
  const { drawerOpen, drawerActiveView } = preferences.favorites;
  const open = (view: FavoritesDrawerView): void => {
    drawerOpen.set(true);
    drawerActiveView.set(view);
  };

  for (const name of FavoritesDrawerViewNames) {
    const { tab } = shell.drawer[name];

    tab.addEventListener("click", () => drawerActiveView.set(name));

    if (!FavoritesConfig.drawerSidebarLabelsEnabled) {
      addTooltip(tab, tab.getAttribute("aria-label") ?? name, "right");
    }
  }
  shell.slots.aboutVersion.addEventListener("click", () => open("change"));
  shell.slots.aboutHelp.addEventListener("click", () => open("help"));
}

export function mount(shell: FavoritesShell, views: FavoritesDrawerViewMap): void {
  for (const [name, content] of Object.entries(views) as [FavoritesDrawerView, NonNullable<FavoritesDrawerViewMap[FavoritesDrawerView]>][]) {
    const { title, panel } = shell.drawer[name];
    const actions = content.actions ?? [];

    actions.forEach(action => action.classList.add(FavoritesClass.drawerTitleAction));
    title.append(...actions);
    content.mount?.(panel);
  }
}
