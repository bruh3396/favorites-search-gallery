import * as GalleryView from "@/features/gallery/view/gallery_view";
import { GalleryConfig } from "@/config/gallery_config";
import { POSTS_PER_POST_LIST_PAGE } from "@/lib/rule34_constants";
import * as GalleryDispatch from "@/features/gallery/flows/dispatch";
import { getAllContentThumbs } from "@/app/layout/content_thumbs";

export function onUpscaleToggled(value: boolean): void {
  if (value) {
    const thumbs = getAllContentThumbs();
    const notUsingInfiniteScroll = thumbs.length <= POSTS_PER_POST_LIST_PAGE;

    if (notUsingInfiniteScroll) {
      GalleryView.cacheImages(thumbs);
    }
    GalleryView.upscaleCachedThumbs();
  } else {
    GalleryView.downscaleAll();
  }
}

export function onInitialPostListCreated(): void {
  GalleryDispatch.run({
    idle: preloadOutsideGallery
  });
}

function preloadOutsideGallery(): void {
  if (GalleryConfig.preloadOutsideGalleryOnPostList) {
    GalleryView.cacheImages(getAllContentThumbs());
  }
}
