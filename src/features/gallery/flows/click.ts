import { EnhancedMouseEvent } from "@/lib/event/input";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { overGalleryMenu } from "@/features/gallery/dom_tweaks/menu";

export class GalleryClickFlow extends GalleryFlow {
  public handleClick(mouseEvent: EnhancedMouseEvent): void {
    this.flows.dispatch.run({
      open: (event) => this.openMediaOnCtrlClick(event)
    }, mouseEvent.originalEvent);
  }

  public handleMouseDown(event: EnhancedMouseEvent): void {
    this.flows.dispatch.run({
      preview: (mouseEvent) => this.handleMouseDownOutsideGallery(mouseEvent),
      idle: (mouseEvent) => this.handleMouseDownOutsideGallery(mouseEvent),
      open: (mouseEvent) => this.handleMouseDownInGallery(mouseEvent)
    }, event);
  }

  public handleContextMenu(mouseEvent: MouseEvent): void {
    this.flows.dispatch.run({
      open: (event) => this.closeOnContextMenu(event)
    }, mouseEvent);
  }

  public toggleGalleryImageZoom(value: undefined | boolean = undefined): boolean {
    const isZoomedIn = this.view.toggleZoom(value);

    this.context.domEvents.document.wheel.toggle(!isZoomedIn);
    return isZoomedIn;
  }

  private openMediaOnCtrlClick(mouseEvent: MouseEvent): void {
    if (mouseEvent.ctrlKey) {
      this.model.openMedia();
    }
  }

  private handleMouseDownOutsideGallery(mouseEvent: EnhancedMouseEvent): void {
    if (mouseEvent.leftClick && mouseEvent.thumb !== null && !mouseEvent.ctrlKey && !mouseEvent.shiftKey) {
      mouseEvent.originalEvent.preventDefault();
      this.flows.openClose.open(mouseEvent.thumb);
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
    if (mouseEvent.ctrlKey || overGalleryMenu(mouseEvent.originalEvent)) {
      return;
    }

    if (mouseEvent.shiftKey) {
      if (this.toggleGalleryImageZoom()) {
        this.view.zoomToPoint({x: mouseEvent.originalEvent.x, y: mouseEvent.originalEvent.y});
      }
      return;
    }
    const isZoomedIn = mouseEvent.originalEvent.target instanceof HTMLElement && mouseEvent.originalEvent.target.closest(".zoomed-in") !== null;

    if (mouseEvent.leftClick && !isZoomedIn && !this.model.isViewingVideo()) {
      this.flows.openClose.close();
      return;
    }

    if (mouseEvent.rightClick) {
      return;
    }

    if (mouseEvent.middleClick) {
      this.model.openPost();
    }
  }

  private closeOnContextMenu(mouseEvent: MouseEvent): void {
    mouseEvent.preventDefault();
    this.flows.openClose.close();
  }
}
