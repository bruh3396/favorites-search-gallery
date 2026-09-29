import { EnhancedMouseEvent, EnhancedWheelEvent } from "@/lib/event/input";
import { GalleryFlow, GalleryFlowDependencies } from "@/features/gallery/flows/flow";
import { throttle } from "@/lib/async/rate_limiting";

export class GalleryMouseFlow extends GalleryFlow {
  private readonly showCursorThrottled: () => void;

  constructor(dependencies: GalleryFlowDependencies) {
    super(dependencies);
    this.showCursorThrottled = throttle(() => this.runForState({ open: () => this.view.showCursor() }), 250);
  }

  public handleClick(mouseEvent: EnhancedMouseEvent): void {
    this.runForState({ open: (event) => this.handleClickInGallery(event) }, mouseEvent.originalEvent);
  }

  public handleDoubleClick(mouseEvent: MouseEvent): void {
    this.runForState({ open: (event) => this.closeIfOverVideo(event) }, mouseEvent);
  }

  public handleMouseDown(event: EnhancedMouseEvent): void {
    this.runForState({
      preview: (mouseEvent) => this.handleMouseDownOutsideGallery(mouseEvent),
      idle: (mouseEvent) => this.handleMouseDownOutsideGallery(mouseEvent),
      open: (mouseEvent) => this.handleMouseDownInGallery(mouseEvent)
    }, event);
  }

  public handleContextMenu(mouseEvent: MouseEvent): void {
    this.runForState({ open: (event) => this.closeOnContextMenu(event) }, mouseEvent);
  }

  public handleMouseMove(event: MouseEvent): void {
    this.showCursorThrottled();
    this.view.revealMenu();
    this.showVideoControlsIfOverVideo(event);
  }

  public handleMouseOver(mouseEvent: EnhancedMouseEvent): void {
    this.view.toggleMenuPersistence(mouseEvent);
    this.runForState({
      preview: (thumb: HTMLElement | null) => this.handlePreview(thumb),
      idle: (thumb: HTMLElement | null) => this.flows.thumbs.upscaleAround(thumb)
    }, mouseEvent.thumb);
  }

  public handleWheel(wheelEvent: EnhancedWheelEvent): void {
    this.runForState({
      preview: (event) => this.flows.actions.adjustBackgroundOpacity(event.originalEvent),
      open: (event) => this.navigateOnWheel(event)
    }, wheelEvent);
  }

  public hideCursor(): void {
    this.runForState({ open: () => this.view.toggleCursor(false) });
  }

  private showVideoControlsIfOverVideo(event: Event): void {
    if (this.view.isOverVideo(event.target)) {
      this.view.showVideoControls();
    }
  }

  private handleClickInGallery(mouseEvent: MouseEvent): void {
    if (mouseEvent.ctrlKey) {
      this.model.openOriginal();
    }
    this.togglePauseIfOverVideo(mouseEvent);
  }

  private togglePauseIfOverVideo(event: MouseEvent): void {
    if (event.ctrlKey || !this.view.isOverVideo(event.target)) {
      return;
    }
    event.preventDefault();
    this.view.toggleVideoPause();
  }

  private closeIfOverVideo(event: MouseEvent): void {
    if (this.view.isOverVideo(event.target)) {
      this.flows.navigation.close();
    }
  }

  private handleMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
    if (mouseEvent.leftClick && mouseEvent.thumb !== null && !mouseEvent.ctrlKey && !mouseEvent.shiftKey) {
      mouseEvent.originalEvent.preventDefault();
      this.openThumb(mouseEvent.thumb);
      return;
    }

    if (mouseEvent.middleClick && mouseEvent.thumb === null && !this.clickedInteractiveOverlay(mouseEvent)) {
      mouseEvent.originalEvent.preventDefault();
      this.context.preferences.gallery.previewEnabled.set(!this.model.isShowingPreviews());
    }
  }

  private clickedInteractiveOverlay(mouseEvent: EnhancedMouseEvent): boolean {
    const target = mouseEvent.originalEvent.target;
    return target instanceof HTMLElement && target.closest(".post-overlay") !== null;
  }

  private handleMouseDownInGallery(mouseEvent: EnhancedMouseEvent): void {
    if (mouseEvent.ctrlKey || this.view.isOverMenu(mouseEvent.originalEvent.target)) {
      return;
    }

    if (mouseEvent.shiftKey) {
      this.zoomToPoint(mouseEvent.originalEvent);
      return;
    }
    const isZoomedIn = mouseEvent.originalEvent.target instanceof HTMLElement && mouseEvent.originalEvent.target.closest(".zoomed-in") !== null;

    if (mouseEvent.leftClick && !isZoomedIn && !this.model.isViewingVideo()) {
      this.flows.navigation.close();
      return;
    }

    if (mouseEvent.middleClick) {
      this.model.openPost();
    }
  }

  private zoomToPoint(event: MouseEvent): void {
    const isZoomedIn = this.view.toggleZoom();

    this.context.domEvents.document.wheel.toggle(!isZoomedIn);

    if (isZoomedIn) {
      this.view.zoomToPoint({ x: event.x, y: event.y });
    }
  }

  private closeOnContextMenu(mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    this.flows.navigation.close();
  }

  private openThumb(thumb: HTMLElement): void {
    const item = this.itemFor(thumb);

    if (item !== undefined) {
      this.flows.navigation.open(item);
    }
  }

  private handlePreview(thumb: HTMLElement | null): void {
    const item = thumb === null ? undefined : this.itemFor(thumb);

    if (item === undefined) {
      this.view.hidePreview();
      return;
    }
    this.view.showPreview(item);
    this.flows.thumbs.cacheAround(thumb);
  }

  private navigateOnWheel(event: EnhancedWheelEvent): void {
    if (!event.originalEvent.shiftKey && !event.originalEvent.ctrlKey) {
      this.flows.navigation.navigate(event.direction);
    }
  }
}
