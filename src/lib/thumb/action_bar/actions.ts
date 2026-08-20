import { ActionBarAction, ActionBarCallbacks } from "@/lib/thumb/action_bar/types";
import { ActionBarDataset, ActionBarSelectors } from "@/lib/thumb/action_bar/selectors";
import { addFavoriteFromThumb, removeFavoriteFromThumb } from "@/lib/remote/rule34/favorites/thumb_actions";
import { ClickCode } from "@/types/input";
import { ITEM_SELECTOR } from "@/lib/thumb/thumbs";
import { downloadFromThumb } from "@/lib/remote/rule34/media/download";

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

function targetOf(event: MouseEvent | TouchEvent): EventTarget | null {
  if (event instanceof TouchEvent) {
    const touch = event.changedTouches[0];
    return touch === undefined ? null : document.elementFromPoint(touch.clientX, touch.clientY);
  }
  return event.target;
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

function closestActionButton(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const button = target.closest(`.${ActionBarSelectors.button}`);
  return button instanceof HTMLElement ? button : null;
}
