import { addFavoriteFromThumb, removeFavoriteFromThumb } from "@/lib/remote/rule34/favorites/thumb_actions";
import { setDataset, toggleDataset } from "@/utils/browser/dataset";
import { ClickCode } from "@/types/input";
import { ITEM_SELECTOR } from "@/lib/thumb/thumbs";
import { Svg } from "@/assets/svg";
import { ThumbConfig } from "@/config/thumb_config";
import { camelToKebabCase } from "@/utils/pure/string";
import { downloadFromThumb } from "@/lib/remote/rule34/media/download";

export type ActionBarAction = "favorite" | "download";

export enum ActionBarButton {
  Favorite = 1,
  Download = 2
}

export type ActionBarMode = "off" | "hover" | "always";

export type ActionBarStyle = "corner" | "opaque" | "inset";

export interface ActionBarCallbacks {
  onFavoriteAdded: (id: string) => void;
  onFavoriteRemoved: (id: string) => void;
}

export const ActionBarSelectors = {
  bar: "post-action-bar",
  button: "post-action-button",
  id: "post-action-id",
  heartEmpty: "post-action-heart-empty",
  heartFilled: "post-action-heart-filled"
} as const;

export const ActionBarDataset = {
  mode: "postActionBarMode",
  style: "postActionBarStyle",
  favoriteVisible: "postActionBarFavoriteVisible",
  downloadVisible: "postActionBarDownloadVisible",
  isFavorite: "isFavorite"
} as const;

export function actionBarHtml(isFavorite: boolean): string {
  const favoriteState = isFavorite ? ` data-${camelToKebabCase(ActionBarDataset.isFavorite)}` : "";
  return `<div class="${ActionBarSelectors.bar}"${favoriteState}><span class="${ActionBarSelectors.id}"></span>${downloadButton()}${favoriteButton()}</div>`;
}

export function handleActionBarClick(event: MouseEvent | TouchEvent, callbacks: ActionBarCallbacks): void {
  if (event instanceof MouseEvent && event.button !== ClickCode.Left) {
    return;
  }
  const button = closestActionButton(targetOf(event));

  if (button === null) {
    return;
  }
  event.stopPropagation();
  event.preventDefault();
  dispatch(button, callbacks);
}

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

function favoriteButton(): string {
  return actionButton("favorite", `<span class="${ActionBarSelectors.heartEmpty}">${Svg.heart}</span><span class="${ActionBarSelectors.heartFilled}">${Svg.heartFilled}</span>`);
}

function downloadButton(): string {
  return actionButton("download", Svg.download);
}

function actionButton(action: ActionBarAction, innerHTML: string): string {
  return `<button type="button" class="${ActionBarSelectors.button}" data-action="${action}">${innerHTML}</button>`;
}

function targetOf(event: MouseEvent | TouchEvent): EventTarget | null {
  if (event instanceof TouchEvent) {
    const touch = event.changedTouches[0];
    return touch === undefined ? null : document.elementFromPoint(touch.clientX, touch.clientY);
  }
  return event.target;
}

function closestActionButton(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const button = target.closest(`.${ActionBarSelectors.button}`);
  return button instanceof HTMLElement ? button : null;
}

function dispatch(button: HTMLElement, callbacks: ActionBarCallbacks): void {
  const bar = button.closest(`.${ActionBarSelectors.bar}`);
  const thumb = button.closest(ITEM_SELECTOR);
  const action = button.dataset.action as ActionBarAction;

  if (!(bar instanceof HTMLElement) || !(thumb instanceof HTMLElement)) {
    return;
  }

  if (action === "download") {
    downloadFromThumb(thumb);
  } else if (action === "favorite") {
    toggleFavorite(bar, thumb, callbacks);
  }
}

function toggleFavorite(bar: HTMLElement, thumb: HTMLElement, callbacks: ActionBarCallbacks): void {
  const wasFavorite = bar.dataset[ActionBarDataset.isFavorite] !== undefined;

  if (wasFavorite) {
    removeFavoriteFromThumb(thumb);
    callbacks.onFavoriteRemoved(thumb.id);
  } else {
    addFavoriteFromThumb(thumb);
    callbacks.onFavoriteAdded(thumb.id);
  }
}

function syncActionBarFavorite(id: string, isFavorite: boolean): void {
  const bar = document.getElementById(id)?.querySelector(`.${ActionBarSelectors.bar}`);

  if (bar instanceof HTMLElement) {
    toggleDataset(bar, ActionBarDataset.isFavorite, isFavorite);
  }
}
