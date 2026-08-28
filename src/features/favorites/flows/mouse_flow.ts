import * as FavoritesPostActionFlow from "@/features/favorites/flows/post_action_flow";
import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { openMedia, openPost } from "@/lib/remote/actions";
import { EnhancedMouseEvent } from "@/lib/input";
import { GALLERY_DISABLED } from "@/app/context/flags";
import { postPageUrl } from "@/lib/remote/url";

let previousThumb: HTMLElement | null = null;

export function handleClick(event: EnhancedMouseEvent): void {
  FavoritesPostActionFlow.triggerPostAction(event);

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

export function suppressLinkOnHoveredThumb(event: EnhancedMouseEvent): void {
  if (event.thumb === previousThumb || event.thumb === null) {
    return;
  }

  if (previousThumb !== null) {
    previousThumb.querySelector("a")?.setAttribute("href", postPageUrl(previousThumb.id));
  }
  event.thumb.querySelector("a")?.removeAttribute("href");
  previousThumb = event.thumb;
}

function closePopoversOutside(event: EnhancedMouseEvent): void {
  const target = event.originalEvent.target;

  if (target instanceof Node && !FavoritesView.isGotoPagePopoverTarget(target)) {
    FavoritesView.closeGotoPagePopover();
  }
}
