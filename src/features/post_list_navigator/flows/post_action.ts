import { EnhancedMouseEvent } from "@/lib/event/input";
import { PostListNavigatorFlow } from "@/features/post_list_navigator/flows/flow";
import { doNothing } from "@/utils/pure/function";
import { handleActionBarClick } from "@/lib/ui/thumb/action_bar";

export class PostListNavigatorPostActionFlow extends PostListNavigatorFlow {

  public triggerPostAction(event: EnhancedMouseEvent): void {
    if (this.context.domEvents.didSwipe()) {
      return;
    }
    handleActionBarClick(event.originalEvent, {
      onFavoriteAdded: (id) => {
        this.context.ports.favoritesEditor.add(id);
        this.context.events.app.favoriteAdded.emit(id);
      },
      onFavoriteRemoved: doNothing,
      onPostOpened: (id) => this.context.ports.navigation.openPost(id)
    });
  }
}
