import { EnhancedMouseEvent } from "@/lib/event/input";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { debounceTrailing } from "@/lib/async/rate_limiting";

export class GalleryMouseOverFlow extends GalleryFlow {
  private upscaleAround = debounceTrailing((thumb: HTMLElement | null) => {
    if (thumb !== null && this.context.environment.onFavoritesPage) {
      this.flows.visibility.upscaleVisibleThumbsAround(thumb);
    }
  }, 1_000);

  private cacheAround = debounceTrailing((thumb: HTMLElement | null) => {
    if (thumb !== null && this.context.environment.onFavoritesPage) {
      this.flows.visibility.cacheVisibleThumbsAround(thumb);
    }
  }, 1_000);

  public handleMouseOver(mouseEvent: EnhancedMouseEvent): void {
    this.flows.dispatch.run({
      preview: (thumb: HTMLElement | null) => this.handlePreview(thumb),
      idle: (thumb: HTMLElement | null) => this.upscaleAround(thumb)
    }, mouseEvent.thumb);
  }

  private handlePreview(thumb: HTMLElement | null): void {
    if (thumb === null) {
      this.view.hidePreview();
      return;
    }
    this.view.showPreview(thumb);
    this.cacheAround(thumb);
  }
}
