import { addFavoriteFromThumb, removeFavoriteFromThumb } from "@/lib/thumb/favorite_actions";
import { camelToKebabCase, capitalize } from "@/utils/pure/string";
import { setDataset, toggleDataset } from "@/utils/browser/dataset";
import { ClickCode } from "@/types/input";
import { ITEM_SELECTOR } from "@/lib/thumb/selectors";
import { Svg } from "@/assets/svg";
import { ThumbConfig } from "@/config/thumb_config";
import { downloadFromThumb } from "@/lib/remote/rule34/media/download";
import { openPost } from "@/lib/remote/rule34/posts/navigation";

export type ActionBarAction = "favorite" | "download" | "open";

export enum ActionBarButton {
  Favorite = 1,
  Download = 2,
  Open = 4
}

interface ActionBarButtonSpec {
  bit: ActionBarButton;
  action: ActionBarAction;
  icon: string;
  run: (context: ActionContext) => void;
}

interface ActionContext {
  bar: HTMLElement;
  thumb: HTMLElement;
  callbacks: ActionBarCallbacks;
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
  isFavorite: "isFavorite"
} as const;

const ACTION_BAR_BUTTONS: ActionBarButtonSpec[] = [
  { bit: ActionBarButton.Open, action: "open", icon: Svg.externalLink, run: ({ thumb }) => openPost(thumb.id) },
  { bit: ActionBarButton.Download, action: "download", icon: Svg.download, run: ({ thumb }) => downloadFromThumb(thumb) },
  { bit: ActionBarButton.Favorite, action: "favorite", icon: `<span class="${ActionBarSelectors.heartEmpty}">${Svg.heart}</span><span class="${ActionBarSelectors.heartFilled}">${Svg.heartFilled}</span>`, run: toggleFavorite }
];

function visibleDataset(action: ActionBarAction): string {
  return `postActionBar${capitalize(action)}Visible`;
}

export function actionBarHtml(isFavorite: boolean): string {
  const favoriteState = isFavorite ? ` data-${camelToKebabCase(ActionBarDataset.isFavorite)}` : "";
  const buttons = ACTION_BAR_BUTTONS.map((spec) => actionButton(spec.action, spec.icon)).join("");
  return `<div class="${ActionBarSelectors.bar}"${favoriteState}><span class="${ActionBarSelectors.id}"></span>${buttons}</div>`;
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
  for (const spec of ACTION_BAR_BUTTONS) {
    toggleDataset(document.documentElement, visibleDataset(spec.action), (buttons & spec.bit) === spec.bit);
  }
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
  const spec = ACTION_BAR_BUTTONS.find((candidate) => candidate.action === button.dataset.action);

  if (spec === undefined || !(bar instanceof HTMLElement) || !(thumb instanceof HTMLElement)) {
    return;
  }
  spec.run({ bar, thumb, callbacks });
}

function toggleFavorite({ bar, thumb, callbacks }: ActionContext): void {
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
