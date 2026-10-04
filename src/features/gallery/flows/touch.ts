import { EnhancedMouseEvent } from "@/lib/event/input";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { NavigationKey } from "@/types/input";

export class GalleryTouchFlow extends GalleryFlow {
  public handleMouseDown(event: EnhancedMouseEvent): void {
    this.runForState({
      preview: mouseEvent => this.handleMouseDownOutsideGallery(mouseEvent),
      idle: mouseEvent => this.handleMouseDownOutsideGallery(mouseEvent)
    }, event);
  }

  public handleTouchStart(event: TouchEvent): void {
    this.runForState({ open: touchEvent => this.handleTouchStartInGallery(touchEvent) }, event);
  }

  public handleTouchEnd(event: TouchEvent): void {
    this.dismissTutorial(event);

    if (this.view.isOverVideo(event.target)) {
      this.view.showVideoControls();
    }
  }

  public navigateBack(): void {
    this.navigate("ArrowLeft");
  }

  public navigateForward(): void {
    this.navigate("ArrowRight");
  }

  public close(): void {
    this.runForState({ open: () => this.flows.navigation.close() });
  }

  public favoriteCurrentPost(): void {
    this.runForState({ open: () => this.flows.actions.run("addFavorite") });
  }

  public showTutorialOnFirstOpen(): void {
    if (!this.context.preferences.gallery.tutorialSeen.value) {
      this.context.preferences.gallery.tutorialSeen.set(true);
      this.view.showTutorial();
    }
  }

  private navigate(direction: NavigationKey): void {
    if (!this.context.domEvents.didSwipe() && !this.context.domEvents.didHold()) {
      this.flows.navigation.navigateIfOpen(direction);
    }
  }

  private dismissTutorial(event: TouchEvent): void {
    if (this.view.isOverTutorial(event.target)) {
      this.view.hideTutorial();
    }
  }

  private handleMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
    const item = mouseEvent.thumb === null ? undefined : this.itemFor(mouseEvent.thumb);

    if (item !== undefined && this.context.preferences.gallery.mobileEnabled.value) {
      mouseEvent.originalEvent.preventDefault();
      mouseEvent.originalEvent.stopPropagation();
      mouseEvent.originalEvent.stopImmediatePropagation();
      this.flows.navigation.open(item);
    }
  }

  private handleTouchStartInGallery(event: TouchEvent): void {
    if (event.target instanceof HTMLElement && event.target.closest("#gallery-menu, #autoplay-menu") !== null) {
      return;
    }
    event.preventDefault();
  }
}
