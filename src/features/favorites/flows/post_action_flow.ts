import { EnhancedMouseEvent } from "@/lib/input";
import { Events } from "@/app/channels/events";
import { handleActionBarClick } from "@/lib/thumb/action_bar";

export function triggerPostAction(event: EnhancedMouseEvent): void {
  handleActionBarClick(event.originalEvent, {
    onFavoriteAdded: Events.app.favoriteAdded.emit,
    onFavoriteRemoved: Events.app.favoriteRemoved.emit
  });
}

export function triggerPostActionFromTouch(event: TouchEvent): void {
  handleActionBarClick(event, {
    onFavoriteAdded: Events.app.favoriteAdded.emit,
    onFavoriteRemoved: Events.app.favoriteRemoved.emit
  });
}
