import { GalleryConfig } from "@/config/gallery_config";
import { GalleryFlow } from "@/features/gallery/flows/flow";
import { POSTS_PER_POST_LIST_PAGE } from "@/lib/constants";

export class GalleryPostListFlow extends GalleryFlow {
  public toggleUpscaling(value: boolean): void {
    if (value) {
      const thumbs = this.context.shell.getContentThumbs();
      const isNotUsingInfiniteScroll = thumbs.length <= POSTS_PER_POST_LIST_PAGE;

      if (isNotUsingInfiniteScroll) {
        this.view.cacheImages(thumbs);
      }
      this.view.reUpscale();
    } else {
      this.view.downscaleAll();
    }
  }

  public preloadOnIdle(): void {
    if (GalleryConfig.preloadOutsideGalleryOnPostList) {
      this.flows.dispatch.run({ idle: () => this.preload() });
    }
  }

  private preload(): void {
    this.view.cacheImages(this.context.shell.getContentThumbs());
  }
}
