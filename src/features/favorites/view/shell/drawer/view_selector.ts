import { FavoritesDrawerViews, favoritesDrawerSidebarIconId, favoritesDrawerViewId } from "@/features/favorites/types/scaffold";
import { removeDataset, setDataset } from "@/utils/dom/dataset";
import { FavoritesDrawerView } from "@/types/app";
import { Preferences } from "@/app/context/preferences";

let activeView: FavoritesDrawerView = Preferences.favorites.drawerActiveView.value;

export function showActiveView(): void {
  selectView(activeView);
}

export function selectView(view: FavoritesDrawerView): void {
  activeView = view;
  Preferences.favorites.drawerActiveView.set(view);

  for (const { name: candidate } of FavoritesDrawerViews) {
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
