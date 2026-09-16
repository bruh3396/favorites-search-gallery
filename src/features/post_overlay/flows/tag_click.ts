import { EnhancedMouseEvent } from "@/lib/event/input";
import { PostOverlayClass } from "@/features/post_overlay/types/scaffold";
import { PostOverlayFlow } from "@/features/post_overlay/flows/flow";

export class PostOverlayTagClickFlow extends PostOverlayFlow {

  public handleMouseDown(mouseEvent: EnhancedMouseEvent): void {
    const event = mouseEvent.originalEvent;
    const tag = tagUnderEvent(event);

    if (tag === null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    if (mouseEvent.leftClick) {
      this.context.events.postOverlay.addTagToSearch.emit(tag);
      return;
    }

    if (mouseEvent.rightClick) {
      this.context.events.postOverlay.excludeTagFromSearch.emit(tag);
      return;
    }

    if (mouseEvent.middleClick) {
      this.context.events.postOverlay.searchForTag.emit(tag);
    }
  }

  public handleContextMenu(event: MouseEvent): void {
    if (tagUnderEvent(event) !== null) {
      event.preventDefault();
    }
  }
}

function tagUnderEvent(event: MouseEvent): string | null {
  if (!(event.target instanceof HTMLElement)) {
    return null;
  }
  const tag = event.target.closest<HTMLElement>(`.${PostOverlayClass.tag}`);
  return tag?.dataset.tag ?? null;
}
