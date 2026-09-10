import { EnhancedMouseEvent } from "@/lib/event/input";
import { Events } from "@/app/channels/events";
import { didSwipe } from "@/app/dom/swipe_events";
import { handleActionBarClick } from "@/lib/ui/thumb/action_bar";

export function triggerPostAction(event: EnhancedMouseEvent): void {
  if (didSwipe()) {
    return;
  }
  handleActionBarClick(event.originalEvent, {
    onFavoriteAdded: Events.app.favoriteAdded.emit,
    onFavoriteRemoved: Events.app.favoriteRemoved.emit
  });
}
