import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "@/lib/environment";
import { POSTS_PER_SEARCH_PAGE } from "@/lib/rule34_constants";
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
    return ON_SEARCH_PAGE ? GalleryConfig.mainCanvasResolutions.search : GalleryConfig.mainCanvasResolutions.favorites;
  },

  imageMegabyteLimit: ON_MOBILE_DEVICE ? 0 : 700,
  searchPagePreloadedImageCount: ON_MOBILE_DEVICE ? 4 : POSTS_PER_SEARCH_PAGE,
  minimumPreloadedImageCount: ON_MOBILE_DEVICE ? 3 : 5,
  preloadedVideoCount: ON_MOBILE_DEVICE ? 0 : 2,
  preloadedGifCount: ON_MOBILE_DEVICE ? 0 : 2,
  maxVisibleThumbsBeforeStoppingPreload: 175,
  preloadWaitingTimeout: 1_000,
  preloadingEnabled: true,
  gifPreloadingEnabled: false,
  preloadOutsideGalleryOnSearchPage: true,
  upscaleEverythingOnSearchPage: false,

  preloadMediaDebounceTime: 150,
  navigationThrottleTime: 250,
  galleryNavigationDelay: 100,
  idleInteractionDuration: 300,
  recentCloseDuration: 500,
  menuVisibilityTime: ON_MOBILE_DEVICE ? 2_000 : 1_000,

  maxImagesToPreloadAroundInGallery: ON_MOBILE_DEVICE ? 3 : 50,
  favoritesMenuHeight: 200,
  visibleThumbsDownwardScrollPixelGenerosity: 50,
  visibleThumbsDownwardScrollPercentageGenerosity: 100,
  bitmapCloseDelay: 50,
  fetchImageBitmapsInWorker: false,
  get sendImageBitmapsToWorker(): boolean {
    return !this.fetchImageBitmapsInWorker;
  },
  useOffscreenThumbUpscaler: false,
  createImageAccentColors: false,
  galleryMenuMonoColor: true
};
