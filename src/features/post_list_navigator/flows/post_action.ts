import { EnhancedMouseEvent } from "@/lib/event/input";
import { PostListNavigatorFlow } from "@/features/post_list_navigator/flows/flow";
import { doNothing } from "@/utils/pure/function";
import { downloadMedia } from "@/lib/media/download";
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
      onPostOpened: (id) => this.context.ports.links.openInNewTab(this.context.ports.links.postUrl(id)),
      onMediaDownloaded: (id) => this.download(id)
    });
  }

  private download(id: string): void {
    const post = this.model.getPost(id);

    if (post !== undefined) {
      downloadMedia(this.context.ports.mediaSource, post);
    }
  }
}
