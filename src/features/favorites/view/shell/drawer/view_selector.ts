import { FavoritesDrawerView, FavoritesDrawerViewNames } from "@/types/favorite";
import { favoritesDrawerSidebarIconId, favoritesDrawerViewId } from "@/features/favorites/types/scaffold";
import { removeDataset, setDataset } from "@/utils/dom/dataset";
import { Preferences } from "@/app/context/preferences";

let activeView: FavoritesDrawerView = Preferences.favorites.drawerActiveView.value;

export function showActiveView(): void {
  renderView(activeView);
}

export function selectView(view: FavoritesDrawerView): void {
  Preferences.favorites.drawerActiveView.set(view);
  renderView(view);
}

function renderView(view: FavoritesDrawerView): void {
  activeView = view;

  for (const candidate of FavoritesDrawerViewNames) {
    const isActive = candidate === view;
    const tabElement = document.getElementById(favoritesDrawerSidebarIconId(candidate));
    const viewElement = document.getElementById(favoritesDrawerViewId(candidate));

    if (isActive) {
      setDataset(tabElement, "selected", "");
      removeDataset(viewElement, "hidden");
    } else {
      removeDataset(tabElement, "selected");
      setDataset(viewElement, "hidden", "");
    }
  }
}
