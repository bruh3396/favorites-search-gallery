import { GalleryConfig } from "@/config/gallery_config";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { NavigationKey } from "@/types/input";
import { MediaItem } from "@/core/domain/post/post";
import { queueMacroTask } from "@/lib/async/scheduling";

export class GalleryNavigationFlow extends GalleryFlow {
  public open(item: MediaItem): void {
    this.disablePreview();
    this.model.open(item);
    this.view.open();
    this.display(item);
    this.control.enableInteractionTracking();
    this.context.events.gallery.galleryOpened.emit();
  }

  public close(): void {
    this.model.close();
    this.view.close();
    this.returnToLastViewed();
    this.control.disableInteractionTracking();
    this.flows.mouse.clearZoom();
    this.context.events.gallery.galleryClosed.emit();
  }

  public reOpen(): void {
    this.open(this.model.currentItem());
  }

  public navigate(direction: NavigationKey): void {
    switch (this.model.move(direction)) {
      case "start": this.handleStartBoundary();
        break;
      case "end": this.handleEndBoundary();
        break;
      case "none":
        this.displaySelected();
        break;
      default:
        break;
    }
  }

  public navigateIfOpen(direction?: NavigationKey): void {
    this.runForState<NavigationKey>({ open: key => this.navigate(key) }, direction);
  }

  private display(item: MediaItem): void {
    this.view.display(item);
    this.followInContent(item);
    this.context.events.gallery.itemDisplayed.emit(item);
    this.cacheAdjacent(item);
  }

  private displaySelected(): void {
    this.display(this.model.currentItem());
  }

  private followInContent(item: MediaItem): void {
    if (!this.usingColumnLayout()) {
      this.view.follow(item.id);
    }
  }

  private cacheAdjacent(item: MediaItem): void {
    if (GalleryConfig.preloadingEnabled) {
      queueMacroTask(() => {
        this.view.cache(this.model.getItemsAround(item.id));
      });
    }
  }

  private handleStartBoundary(): void {
    if (this.usingInfiniteScroll() || !this.advanceResults("ArrowLeft")) {
      this.view.nudge(this.model.currentItem(), "start");
      return;
    }
    this.model.jumpToLast();
    this.displaySelected();
  }

  private handleEndBoundary(): void {
    if (!this.advanceResults("ArrowRight")) {
      this.view.nudge(this.model.currentItem(), "end");
      return;
    }

    if (this.usingInfiniteScroll()) {
      this.model.move("ArrowRight");
    } else {
      this.model.jumpToFirst();
    }
    this.displaySelected();
  }

  private advanceResults(direction: NavigationKey): boolean {
    if (this.context.environment.mode === "postList") {
      return this.context.featureBridge.postList.navigateToAdjacent.request(direction) !== null;
    }
    return this.context.featureBridge.favorites.advance.request(direction);
  }

  private usingInfiniteScroll(): boolean {
    return this.context.featureBridge.usingInfiniteScroll();
  }

  private returnToLastViewed(): void {
    if (this.usingColumnLayout()) {
      this.view.scrollToThumbAfterLoad(this.model.currentItem().id);
    }
  }

  private disablePreview(): void {
    if (this.context.preferences.gallery.previewEnabled.value) {
      this.context.preferences.gallery.previewEnabled.set(false);
    }
  }
}
