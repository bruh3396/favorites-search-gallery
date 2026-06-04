import { EnhancedMouseEvent } from "@/types/input";
import { Events } from "@/app/channels/events";
import { PostOverlayClass } from "@/features/post_overlay/types/css_names";

export function onMouseDown(event: MouseEvent): void {
  const mouseEvent = new EnhancedMouseEvent(event);
  const tag = tagUnderEvent(event);

  if (tag === null) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();

  if (mouseEvent.leftClick) {
    Events.postOverlay.addTagToSearch.emit(tag);
    return;
  }

  if (mouseEvent.rightClick) {
    Events.postOverlay.excludeTagFromSearch.emit(tag);
    return;
  }

  if (mouseEvent.middleClick) {
    Events.postOverlay.searchForTag.emit(tag);
  }
}

export function onContextMenu(event: MouseEvent): void {
  if (tagUnderEvent(event) !== null) {
    event.preventDefault();
  }
}

function tagUnderEvent(event: MouseEvent): string | null {
  if (!(event.target instanceof HTMLElement)) {
    return null;
  }
  const tag = event.target.closest<HTMLElement>(`.${PostOverlayClass.tag}`);
  return tag?.dataset.tag ?? null;
}
