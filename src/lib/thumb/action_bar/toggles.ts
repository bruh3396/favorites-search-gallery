import { ActionBarButton, ActionBarMode } from "@/lib/thumb/action_bar/types";
import { ActionBarDataset, ActionBarSelectors } from "@/lib/thumb/action_bar/selectors";
import { setDataset, toggleDataset } from "@/utils/platform/dataset";
import { ThumbConfig } from "@/config/thumb_config";

export function setActionBarMode(mode: ActionBarMode): void {
  setDataset(document.documentElement, ActionBarDataset.mode, mode);
  setDataset(document.documentElement, ActionBarDataset.style, ThumbConfig.actionBarStyle);
}

export function setActionBarButtons(buttons: number): void {
  toggleDataset(document.documentElement, ActionBarDataset.favoriteVisible, (buttons & ActionBarButton.Favorite) === ActionBarButton.Favorite);
  toggleDataset(document.documentElement, ActionBarDataset.downloadVisible, (buttons & ActionBarButton.Download) === ActionBarButton.Download);
}

export function stampActionBarId(item: HTMLElement): void {
  const label = item.querySelector(`.${ActionBarSelectors.id}`);

  if (label !== null) {
    label.textContent = `#${item.id}`;
  }
}

export function markActionBarFavorited(id: string): void {
  syncActionBarFavorite(id, true);
}

export function markActionBarUnfavorited(id: string): void {
  syncActionBarFavorite(id, false);
}

function syncActionBarFavorite(id: string, isFavorite: boolean): void {
  const bar = document.getElementById(id)?.querySelector(`.${ActionBarSelectors.bar}`);

  if (bar instanceof HTMLElement) {
    toggleDataset(bar, ActionBarDataset.isFavorite, isFavorite);
  }
}
