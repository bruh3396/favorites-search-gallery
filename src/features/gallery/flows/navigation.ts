import { GalleryFlow } from "@/features/gallery/flows/flow";
import { NavigationKey } from "@/types/input";

export class GalleryNavigationFlow extends GalleryFlow {
  public navigate(direction: NavigationKey): void {
    switch (this.model.move(direction)) {
      case "start": this.handleStartBoundary();
        break;
      case "end": this.handleEndBoundary();
        break;
      case "none":
        this.flows.display.displaySelected();
        break;
      default:
        break;
    }
  }

  private handleStartBoundary(): void {
    if (this.usingInfiniteScroll() || !this.advanceResults("ArrowLeft")) {
      this.view.nudge(this.model.currentThumb(), "start");
      return;
    }
    this.model.jumpToLast();
    this.flows.display.displaySelected();
  }

  private handleEndBoundary(): void {
    if (!this.advanceResults("ArrowRight")) {
      this.view.nudge(this.model.currentThumb(), "end");
      return;
    }

    if (this.usingInfiniteScroll()) {
      this.model.move("ArrowRight");
    } else {
      this.model.jumpToFirst();
    }
    this.flows.display.displaySelected();
  }

  private advanceResults(direction: NavigationKey): boolean {
    if (this.context.environment.onPostListPage) {
      return this.context.featureBridge.postList.navigateToAdjacent.call(direction) !== null;
    }
    return this.context.featureBridge.favorites.advance.call(direction);
  }

  private usingInfiniteScroll(): boolean {
    return this.context.featureBridge.usingInfiniteScroll();
  }
}
