import { debounceLeading, debounceTrailing } from "@/lib/async/rate_limiting";
import { GalleryConfig } from "@/config/gallery_config";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { GalleryUpscaleConfig } from "@/config/gallery_upscale_config";

export class GalleryContentFlow extends GalleryFlow {
  private readonly refreshImagesDebounced = debounceLeading(() => {
    this.flows.dispatch.run({
      idle: () => this.refreshImages(),
      preview: () => this.refreshImages(),
      open: () => this.view.reUpscale()
    });
  }, GalleryConfig.contentRefreshTime);

  private readonly upscaleQuality = this.context.environment.onPostListPage ? this.context.preferences.postList.upscaleQuality : this.context.preferences.favorites.upscaleQuality;

  private readonly updateUpscaleQualityDebounced = debounceTrailing(() => {
    const quality = this.model.computeUpscaleQuality();

    if (quality !== null) {
      this.upscaleQuality.set(quality);
    }
  }, GalleryUpscaleConfig.dynamicQualitySettleTime);

  public refresh(): void {
    this.view.downscaleAll();
    this.control.refreshThumbObserver();
    this.model.indexThumbs(this.context.shell.getContentThumbs());
    this.refreshImagesDebounced();
  }

  public updateUpscaleQuality(): void {
    this.updateUpscaleQualityDebounced();
  }

  public toggleUpscaling(value: boolean): void {
    if (value) {
      this.view.reUpscale();
      this.view.upscale(this.control.getVisibleThumbs().slice(0, 25));
    } else {
      this.view.downscaleAll();
    }
  }

  private refreshImages(): void {
    if (this.context.environment.onDesktopDevice) {
      this.view.cacheImages(this.context.shell.getContentThumbs().slice(0, 25));
    }
    this.view.reUpscale();
  }
}
