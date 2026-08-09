import * as FavoritesDrawerBuilder from "@/features/favorites/view/shell/drawer/builder";
import * as FavoritesDrawerViewSelector from "@/features/favorites/view/shell/drawer/view_selector";
import * as FavoritesShell from "@/features/favorites/view/shell/shell";
import { removeDataset, setDataset } from "@/utils/dom/dataset";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesDrawerViewMap } from "@/types/favorite";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { Preferences } from "@/app/context/preferences";
import { queueMacroTask } from "@/lib/async/async";

export function setup(renderers: FavoritesDrawerViewMap): void {
  if (!FavoritesConfig.drawerSidebarLabelsEnabled) {
    setDataset(FavoritesShell.FavoritesRoot, "drawerIconOnly", "");
  }
  FavoritesShell.FavoritesDrawerTrack.appendChild(FavoritesDrawerBuilder.buildDrawer(renderers, FavoritesDrawerViewSelector.selectView));
  FavoritesDrawerViewSelector.showActiveView();
  setupVersionLabel();
  openInstantlyOnStart();
}

export function toggleDrawer(): void {
  const button = document.getElementById(FavoritesId.drawerToggleButton);

  if (isOpen()) {
    removeDataset(FavoritesShell.FavoritesRoot, "drawerOpen");
    removeDataset(button, "active");
  } else {
    setDataset(FavoritesShell.FavoritesRoot, "drawerOpen", "");
    setDataset(button, "active", "");
  }
  Preferences.favorites.drawerOpen.set(isOpen());
}

function isOpen(): boolean {
  return FavoritesShell.FavoritesRoot.dataset.drawerOpen !== undefined;
}

function setupVersionLabel(): void {
  const version = document.getElementById(FavoritesId.brandVersion);

  if (version === null) {
    return;
  }
  version.onclick = (): void => {
    if (!isOpen()) {
      toggleDrawer();
    }
    FavoritesDrawerViewSelector.selectView("change");
  };
}

function openInstantlyOnStart(): void {
  if (!Preferences.favorites.drawerOpen.value) {
    return;
  }
  queueMacroTask(() => {
    const drawerElement = document.getElementById(FavoritesId.drawer);

    if (drawerElement === null) {
      return;
    }
    drawerElement.style.transition = "none";
    toggleDrawer();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    drawerElement.offsetHeight;
    drawerElement.style.transition = "";
  });
}
