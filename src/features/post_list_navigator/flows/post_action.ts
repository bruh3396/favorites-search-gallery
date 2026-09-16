import { EnhancedMouseEvent } from "@/lib/event/input";
import { PostListNavigatorFlow } from "@/features/post_list_navigator/flows/flow";
import { handleActionBarClick } from "@/lib/ui/thumb/action_bar";

export class PostListNavigatorPostActionFlow extends PostListNavigatorFlow {

  public triggerPostAction(event: EnhancedMouseEvent): void {
    if (this.context.domEvents.didSwipe()) {
      return;
    }
    handleActionBarClick(event.originalEvent, {
      onFavoriteAdded: this.context.events.app.favoriteAdded.emit,
      onFavoriteRemoved: this.context.events.app.favoriteRemoved.emit
    });
  }
}
