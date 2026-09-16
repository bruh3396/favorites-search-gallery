import { openMedia, openPost } from "@/lib/remote/fetchers/action";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { handleActionBarClick } from "@/lib/ui/thumb/action_bar";

export class FavoritesInputFlow extends FavoritesFlow {

  public triggerPostAction(event: EnhancedMouseEvent): void {
    if (this.context.domEvents.didSwipe()) {
      return;
    }
    handleActionBarClick(event.originalEvent, {
      onFavoriteAdded: this.context.events.app.favoriteAdded.emit,
      onFavoriteRemoved: this.context.events.app.favoriteRemoved.emit
    });
  }

  public handleClick(event: EnhancedMouseEvent): void {
    this.triggerPostAction(event);

    if (event.thumb === null) {
      return;
    }

    if (event.ctrlKey) {
      openMedia(event.thumb);
    }
    event.originalEvent.preventDefault();
  }

  public handleMouseDown(event: EnhancedMouseEvent): void {
    this.closePopoversOutside(event);

    if (event.thumb === null || event.ctrlKey) {
      return;
    }
    const shouldOpen = event.middleClick ||
      (event.leftClick && (event.shiftKey || this.context.flags.galleryDisabled));

    if (shouldOpen) {
      openPost(event.thumb.id);
    }
    event.originalEvent.preventDefault();
  }

  private closePopoversOutside(event: EnhancedMouseEvent): void {
    const target = event.originalEvent.target;

    if (target instanceof Node && !this.view.isGotoPagePopoverTarget(target)) {
      this.view.closeGotoPagePopover();
    }
  }
}
