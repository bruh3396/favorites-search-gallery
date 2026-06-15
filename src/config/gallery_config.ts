import { ON_MOBILE_DEVICE, ON_POST_LIST_PAGE } from "@/lib/environment";
import { POSTS_PER_POST_LIST_PAGE } from "@/lib/rule34_constants";
import { Resolution } from "@/types/media";

export const GalleryConfig = {
  get mainCanvasResolution(): Resolution {
    return ON_MOBILE_DEVICE ? "1920x1080" : ON_POST_LIST_PAGE ? "3840x2160" : "7680x4320";
  },

  imageMegabyteLimit: ON_MOBILE_DEVICE ? 0 : 700,
  postListCachedImageCount: ON_MOBILE_DEVICE ? 4 : POSTS_PER_POST_LIST_PAGE,
  minimumCachedImageCount: ON_MOBILE_DEVICE ? 3 : 5,
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

  contentRefreshTime: 500,
  navigationThrottleTime: 250,
  galleryNavigationDelay: 50,
  idleInteractionDuration: 300,
  recentCloseDuration: 500,
  menuVisibilityTime: ON_MOBILE_DEVICE ? 2_000 : 1_000,

  maxImagesToPreloadAroundInGallery: ON_MOBILE_DEVICE ? 3 : 50,
  bottomOverscanPercent: 175,
  bitmapCloseDelay: 50,

  useOffscreenThumbUpscaler: false,
  galleryMenuMonoColor: true
};
