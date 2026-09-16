import { EnhancedMouseEvent } from "@/lib/event/input";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { NavigationKey } from "@/types/input";

export class GalleryTouchFlow extends GalleryFlow {
  public handleMouseDown(event: EnhancedMouseEvent): void {
    this.flows.dispatch.run({
      preview: (mouseEvent) => this.handleMouseDownOutsideGallery(mouseEvent),
      idle: (mouseEvent) => this.handleMouseDownOutsideGallery(mouseEvent)
    }, event);
  }

  public handleTouchStart(event: TouchEvent): void {
    this.flows.dispatch.run({
      open: (touchEvent) => this.handleTouchStartInGallery(touchEvent)
    }, event);
  }

  public navigateBackInGallery(): void {
    this.navigateInGallery("ArrowLeft");
  }

  public navigateForwardInGallery(): void {
    this.navigateInGallery("ArrowRight");
  }

  public closeGallery(): void {
    this.flows.dispatch.run({ open: () => this.flows.openClose.close() });
  }

  public favoriteCurrentPost(): void {
    this.flows.dispatch.run({ open: () => this.flows.favoriter.addFavoriteInGallery() });
  }

  private navigateInGallery(direction: NavigationKey): void {
    if (this.context.domEvents.didSwipe() || this.context.domEvents.didHold()) {
      return;
    }
    this.flows.dispatch.run({
      open: () => {
        this.flows.navigation.navigate(direction);
      }
    });
  }

  private handleMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
    if (mouseEvent.thumb !== null && this.context.preferences.gallery.mobileEnabled.value) {
      mouseEvent.originalEvent.preventDefault();
      mouseEvent.originalEvent.stopPropagation();
      mouseEvent.originalEvent.stopImmediatePropagation();
      this.flows.openClose.open(mouseEvent.thumb);
    }
  }

  private handleTouchStartInGallery(event: TouchEvent): void {
    if (event.target instanceof HTMLElement && event.target.closest("#gallery-menu, #autoplay-menu") !== null) {
      return;
    }
    event.preventDefault();
  }
}
