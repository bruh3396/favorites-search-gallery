import * as GalleryFlows from "@/features/gallery/flows/flows";
import * as GalleryView from "@/features/gallery/view/view";
import { GalleryConfig } from "@/config/gallery_config";
import { POSTS_PER_POST_LIST_PAGE } from "@/lib/rule34_constants";
import { getAllContentThumbs } from "@/app/layout/content_thumbs";

export function toggleUpscaling(value: boolean): void {
  if (value) {
    const thumbs = getAllContentThumbs();
    const isNotUsingInfiniteScroll = thumbs.length <= POSTS_PER_POST_LIST_PAGE;

    if (isNotUsingInfiniteScroll) {
      GalleryView.cacheImages(thumbs);
    }
    GalleryView.upscaleCachedThumbs();
  } else {
    GalleryView.downscaleAll();
  }
}

export function preloadOnIdle(): void {
  if (GalleryConfig.preloadOutsideGalleryOnPostList) {
    GalleryFlows.Dispatch.run({ idle: preload });
  }
}

function preload(): void {
  GalleryView.cacheImages(getAllContentThumbs());
}
