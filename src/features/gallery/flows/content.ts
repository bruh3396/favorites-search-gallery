import { GalleryConfig } from "@/config/gallery_config";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { debounceLeading } from "@/lib/async/rate_limiting";

export class GalleryContentFlow extends GalleryFlow {
  private readonly recache = debounceLeading(() => {
    this.flows.dispatch.run({
      idle: () => this.recacheFirstThumbs(),
      preview: () => this.recacheFirstThumbs(),
      open: () => this.view.reupscaleCachedThumbs()
    });
  }, GalleryConfig.contentRefreshTime);

  public refresh(): void {
    this.reIndex();
    this.recache();
  }

  public downscaleThumbsOutsideResults(): void {
    this.view.downscaleDetached();
  }

  public toggleUpscaling(value: boolean): void {
    if (value) {
      this.view.upscaleCached();
      this.control.refreshThumbObserver();
    } else {
      this.view.downscaleAll();
    }
  }

  private reIndex(): void {
    this.control.refreshThumbObserver();
    this.model.indexThumbs(this.context.shell.getContentThumbs());
  }

  private recacheFirstThumbs(): void {
    if (this.context.environment.onDesktopDevice) {
      this.view.cacheImages(this.context.shell.getContentThumbs().slice(0, 25));
    }
  }
}
