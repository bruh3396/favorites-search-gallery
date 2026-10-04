import { EnhancedMouseEvent } from "@/lib/event/input";
import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { downloadMedia } from "@/lib/media/download";
import { handleActionBarClick } from "@/lib/ui/thumb/action_bar";

export class FavoritesInputFlow extends FavoritesFlow {
  public triggerPostAction(event: EnhancedMouseEvent): void {
    if (this.context.domEvents.didSwipe()) {
      return;
    }
    handleActionBarClick(event.originalEvent, {
      onFavoriteAdded: (id) => this.addFavorite(id),
      onFavoriteRemoved: (id) => this.removeFavorite(id),
      onPostOpened: (id) => this.openPost(id),
      onMediaDownloaded: (id) => this.download(id)
    });
  }

  public handleClick(event: EnhancedMouseEvent): void {
    this.triggerPostAction(event);

    if (event.thumb === null) {
      return;
    }

    if (event.ctrlKey) {
      this.openOriginal(event.thumb.id);
    }
    event.originalEvent.preventDefault();
  }

  public handleMouseDown(event: EnhancedMouseEvent): void {
    this.closePopoversOutside(event);

    if (event.thumb === null || event.ctrlKey) {
      return;
    }
    const shouldOpen = event.middleClick ||
      (event.leftClick && (event.shiftKey || !this.context.features.has("gallery")));

    if (shouldOpen) {
      this.openPost(event.thumb.id);
    }
    event.originalEvent.preventDefault();
  }

  public toggleGotoPage(): void {
    this.view.toggleGotoPagePopover();
  }

  public submitGotoPage(pageNumber: number): void {
    this.view.closeGotoPagePopover();
    this.flows.display.goToPage(pageNumber);
  }

  private async addFavorite(id: string): Promise<void> {
    const result = await this.model.addFavorite(id);

    if (result === "added" || result === "alreadyAdded") {
      this.context.events.app.favoriteAdded.emit(id);
    }
  }

  private async removeFavorite(id: string): Promise<void> {
    const result = await this.model.removeFavorite(id);

    if (result === "removed") {
      this.context.events.app.favoriteRemoved.emit(id);
    }
  }

  private download(id: string): void {
    const favorite = this.model.getFavorite(id);

    if (favorite !== undefined) {
      downloadMedia(this.context.ports.remoteMedia, favorite);
    }
  }

  private openPost(id: string): void {
    this.context.ports.navigator.open(this.context.ports.remotePages.postUrl(id));
  }

  private openOriginal(id: string): void {
    const favorite = this.model.getFavorite(id);

    if (favorite !== undefined) {
      this.context.ports.remoteMedia.resolveOriginalUrl(favorite.media).then(url => this.context.ports.navigator.open(url));
    }
  }

  private closePopoversOutside(event: EnhancedMouseEvent): void {
    const target = event.originalEvent.target;

    if (target instanceof Node && !this.view.isGotoPagePopoverTarget(target)) {
      this.view.closeGotoPagePopover();
    }
  }
}
