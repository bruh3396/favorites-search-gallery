import { ON_MOBILE_DEVICE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { POSTS_PER_POST_LIST_PAGE } from "@/lib/rule34_constants";
import { Resolution } from "@/types/media";

export const GalleryConfig = {
  mainCanvasResolutions: {
    favorites: "7680x4320",
    search: "3840x2160",
    mobile: "1920x1080"
  } satisfies Record<"favorites" | "search" | "mobile", Resolution>,
  get mainCanvasResolution(): Resolution {
    if (ON_MOBILE_DEVICE) {
      return GalleryConfig.mainCanvasResolutions.mobile;
    }
    return ON_POST_LIST_PAGE ? GalleryConfig.mainCanvasResolutions.search : GalleryConfig.mainCanvasResolutions.favorites;
  },

  imageMegabyteLimit: ON_MOBILE_DEVICE ? 0 : 700,
  postListPreloadedImageCount: ON_MOBILE_DEVICE ? 4 : POSTS_PER_POST_LIST_PAGE,
  minimumPreloadedImageCount: ON_MOBILE_DEVICE ? 3 : 5,
  preloadedVideoCount: ON_MOBILE_DEVICE ? 0 : 2,
  preloadedGifCount: ON_MOBILE_DEVICE ? 0 : 2,
  maxVisibleThumbsBeforeStoppingPreload: 175,
  preloadWaitingTimeout: 1_000,
  preloadingEnabled: true,
  cacheImagesOnIdle: true,
  cacheFirstImages: true,
  gifPreloadingEnabled: false,
  preloadOutsideGalleryOnPostList: true,
  upscaleEverythingOnPostList: false,

  preloadMediaDebounceTime: 500,
  navigationThrottleTime: 250,
  galleryNavigationDelay: 100,
  idleInteractionDuration: 300,
  recentCloseDuration: 500,
  menuVisibilityTime: ON_MOBILE_DEVICE ? 2_000 : 1_000,

  maxImagesToPreloadAroundInGallery: ON_MOBILE_DEVICE ? 3 : 50,
  bottomOverscanPercent: 100,
  bitmapCloseDelay: 50,
  fetchImageBitmapsInWorker: false,
  get sendImageBitmapsToWorker(): boolean {
    return !this.fetchImageBitmapsInWorker;
  },
  useOffscreenThumbUpscaler: false,
  createImageAccentColors: false,
  galleryMenuMonoColor: true
};
