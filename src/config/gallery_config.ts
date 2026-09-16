import { POSTS_PER_POST_LIST_PAGE } from "@/lib/constants";
import { Resolution } from "@/types/media";

export const GalleryConfig = {
  mainCanvasResolution: {
    lowPower: "1920x1080" as Resolution,
    postList: "3840x2160" as Resolution,
    favorites: "7680x4320" as Resolution
  },

  imageMegabyteLimit: 700,
  cachedImageCount: { mobile: 4, desktop: POSTS_PER_POST_LIST_PAGE },
  minimumCachedImageCount: 5,
  preloadedVideoCount: { mobile: 0, desktop: 2 },
  preloadedGifCount: { mobile: 0, desktop: 2 },
  maxVisibleThumbsBeforeStoppingPreload: 175,
  preloadWaitingTimeout: 1_000,
  preloadingEnabled: true,
  // cacheImagesOnIdle: !firefox
  cacheFirstImages: true,
  gifPreloadingEnabled: false,
  preloadOutsideGalleryOnPostList: true,
  upscaleEverythingOnPostList: false,

  contentRefreshTime: 500,
  navigationThrottleTime: 250,
  galleryNavigationDelay: 50,
  idleInteractionDuration: 300,
  recentCloseDuration: 500,
  menuVisibilityTime: { mobile: 2_000, desktop: 1_000 },

  maxImagesToPreloadAroundInGallery: { mobile: 3, desktop: 50 },
  bottomOverscanPercent: 175,
  bitmapCloseDelay: 50,

  // useOffscreenThumbUpscaler: firefox
  galleryMenuMonoColor: true
};
