import * as FavoritesView from "@/features/favorites/view/view";
import { openMedia, openPost } from "@/lib/remote/actions";
import { EnhancedMouseEvent } from "@/lib/input";
import { Events } from "@/app/channels/events";
import { GALLERY_DISABLED } from "@/app/context/flags";
import { didSwipe } from "@/app/dom/swipe_events";
import { handleActionBarClick } from "@/lib/thumb/action_bar";

export function triggerPostAction(event: EnhancedMouseEvent): void {
  if (didSwipe()) {
    return;
  }
  handleActionBarClick(event.originalEvent, {
    onFavoriteAdded: Events.app.favoriteAdded.emit,
    onFavoriteRemoved: Events.app.favoriteRemoved.emit
  });
}

export function handleClick(event: EnhancedMouseEvent): void {
  triggerPostAction(event);

  if (event.thumb === null) {
    return;
  }

  if (event.ctrlKey) {
    openMedia(event.thumb);
  }
  event.originalEvent.preventDefault();
}

export function handleMouseDown(event: EnhancedMouseEvent): void {
  closePopoversOutside(event);

  if (event.thumb === null || event.ctrlKey) {
    return;
  }
  const shouldOpen = event.middleClick ||
    (event.leftClick && (event.shiftKey || GALLERY_DISABLED));

  if (shouldOpen) {
    openPost(event.thumb.id);
  }
  event.originalEvent.preventDefault();
}

function closePopoversOutside(event: EnhancedMouseEvent): void {
  const target = event.originalEvent.target;

  if (target instanceof Node && !FavoritesView.isGotoPagePopoverTarget(target)) {
    FavoritesView.closeGotoPagePopover();
  }
}
