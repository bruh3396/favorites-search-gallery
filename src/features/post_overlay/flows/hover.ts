import { EnhancedMouseEvent } from "@/lib/event/input";
import { PostOverlayFlow } from "@/features/post_overlay/flows/flow";
import { isInsideOverlay } from "@/features/post_overlay/dom_tweaks/overlay_hit_test";

export class PostOverlayHoverFlow extends PostOverlayFlow {

  public handleMouseOver(event: EnhancedMouseEvent): void {
    this.model.recordCursorPosition(event);

    if (!this.context.preferences.postOverlay.enabled.value || !this.context.featureBridge.galleryIdle() || this.model.isResizing()) {
      return;
    }

    if (this.model.isCoolingDown() || isInsideOverlay(event.originalEvent.target)) {
      return;
    }

    if (!event.insideOfThumb || event.thumb === null) {
      this.hideOverlay();
      return;
    }
    this.showOverlay(event.thumb);
  }

  public hideOverlay(): void {
    this.model.clearOverlayTarget();
    this.view.hide();
  }

  public hideTemporarily(): void {
    this.hideOverlay();
    this.model.startReopenCooldown(() => this.showThumbUnderCursor());
  }

  public showThumbUnderCursor(): void {
    if (!this.context.preferences.postOverlay.enabled.value) {
      return;
    }
    const thumb = this.model.thumbUnderCursor();

    if (thumb !== null) {
      this.showOverlay(thumb);
    }
  }

  private showOverlay(thumb: HTMLElement): void {
    if (this.model.isCurrentTarget(thumb.id)) {
      return;
    }
    this.model.setCurrentTarget(thumb.id);
    this.flows.modeDispatch.dispatchByMode<HTMLElement>({
      tag: (t) => this.showTags(t)
    }, thumb);
  }

  private async showTags(thumb: HTMLElement): Promise<void> {
    const categories = await this.model.resolveTagCategories(thumb);

    if (this.model.isCurrentTarget(thumb.id)) {
      this.view.renderTags(thumb.id, categories);
      this.view.reveal(thumb);
    }
  }
}
