import * as FavoritesView from "@/features/favorites/view/favorites_view";
import { openMedia, openPost } from "@/lib/remote/rule34/posts/navigation";
import { EnhancedMouseEvent } from "@/types/input";
import { GALLERY_DISABLED } from "@/app/context/flags";
import { buildPostPageUrl } from "@/lib/remote/url/page_url_builder";

let previousThumb: HTMLElement | null = null;

export function onClick(event: EnhancedMouseEvent): void {
  if (event.thumb === null) {
    return;
  }

  if (event.ctrlKey) {
    openMedia(event.thumb);
  }
  event.originalEvent.preventDefault();
}

export function onMouseDown(event: EnhancedMouseEvent): void {
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

export function onMouseOver(event: EnhancedMouseEvent): void {
  if (event.thumb === previousThumb || event.thumb === null) {
    return;
  }

  if (previousThumb !== null) {
    previousThumb.querySelector("a")?.setAttribute("href", buildPostPageUrl(previousThumb.id));
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
