import { FavoritesDrawerContents, FavoritesDrawerSectionContent, FavoritesDrawerSectionName, FavoritesDrawerSectionNames } from "@/types/favorites_ui";
import { FavoritesClass } from "@/features/favorites/types/selectors";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesShell } from "@/features/favorites/shell/shell";
import { Preferences } from "@/app/context/preferences";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";

export function setup(preferences: Preferences, shell: FavoritesShell): void {
  const { drawerOpen, drawerActiveSection } = preferences.favorites;
  const open = (section: FavoritesDrawerSectionName): void => {
    drawerOpen.set(true);
    drawerActiveSection.set(section);
  };

  for (const name of FavoritesDrawerSectionNames) {
    const { tab, label } = shell.drawer[name];

    tab.addEventListener("click", () => drawerActiveSection.set(name));

    if (!FavoritesConfig.drawerSidebarLabelsEnabled) {
      addTooltip(tab, label, "right");
    }
  }
  shell.toolbar.aboutVersion.addEventListener("click", () => open("change"));
  shell.toolbar.aboutHelp.addEventListener("click", () => open("help"));
}

export function mount(shell: FavoritesShell, contents: FavoritesDrawerContents): void {
  for (const [name, content] of Object.entries(contents) as [FavoritesDrawerSectionName, FavoritesDrawerSectionContent][]) {
    const { title, body } = shell.drawer[name];
    const actions = content.actions ?? [];

    actions.forEach(action => action.classList.add(FavoritesClass.drawerTitleAction));
    title.append(...actions);
    content.mount?.(body);
  }
}
