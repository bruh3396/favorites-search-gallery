import { GalleryConfig } from "@/config/gallery_config";
import { GalleryFlow } from "@/features/gallery/flows/flow";

export class GalleryVisibilityFlow extends GalleryFlow {
  public handleVisibleThumbsChanged(): void {
    this.flows.dispatch.run({
      idle: () => this.withVisibleThumbs((thumbs) => this.cacheOrUpscale(thumbs)),
      preview: () => this.withVisibleThumbs((thumbs) => this.view.cacheImages(thumbs))
    });
  }

  public upscaleVisibleThumbsAround(thumb: HTMLElement): void {
    this.control.setCenterThumb(thumb);
    this.withVisibleThumbs((thumbs) => this.cacheOrUpscale(thumbs));
  }

  public cacheVisibleThumbsAround(thumb: HTMLElement): void {
    this.control.setCenterThumb(thumb);
    this.withVisibleThumbs((thumbs) => this.view.cacheImages(thumbs));
  }

  private cacheOrUpscale(thumbs: HTMLElement[]): void {
    if (!this.context.environment.usingFirefox) {
      this.view.cacheImages(thumbs);
    } else {
      this.view.upscale(thumbs);
    }
  }

  private withVisibleThumbs(use: (thumbs: HTMLElement[]) => void): void {
    if (!GalleryConfig.preloadingEnabled || this.model.isInGallery()) {
      return;
    }
    const thumbs = this.control.getVisibleThumbs();

    if (thumbs.length > 0 && thumbs.length < GalleryConfig.maxVisibleThumbsBeforeStoppingPreload) {
      Promise.resolve().then(() => use(thumbs));
    }
  }
}
