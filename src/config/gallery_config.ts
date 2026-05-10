import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../lib/environment/environment";
import { POSTS_PER_SEARCH_PAGE } from "../lib/environment/constants";
import { Resolution } from "../types/media";

const FAVORITES_PAGE_RESOLUTION: Resolution = "7680x4320";
const SEARCH_PAGE_RESOLUTION: Resolution = "3840x2160";
const MOBILE_RESOLUTION: Resolution = "1920x1080";

export const GalleryConfig = {
  mainCanvasResolutions: {
    favorites: FAVORITES_PAGE_RESOLUTION,
    search: SEARCH_PAGE_RESOLUTION,
    mobile: MOBILE_RESOLUTION
  },
  get mainCanvasResolution(): string {
    if (ON_MOBILE_DEVICE) {
      return GalleryConfig.mainCanvasResolutions.mobile;
    }
    return ON_SEARCH_PAGE ? GalleryConfig.mainCanvasResolutions.search : GalleryConfig.mainCanvasResolutions.favorites;
  },

  imageMegabyteLimit: ON_MOBILE_DEVICE ? 0 : 900,
  searchPagePreloadedImageCount: ON_MOBILE_DEVICE ? 4 : POSTS_PER_SEARCH_PAGE,
  minimumPreloadedImageCount: ON_MOBILE_DEVICE ? 3 : 5,
  preloadedVideoCount: ON_MOBILE_DEVICE ? 0 : 2,
  preloadedGifCount: ON_MOBILE_DEVICE ? 0 : 2,
  maxVisibleThumbsBeforeStoppingPreload: 175,
  preloadWaitingTimeout: 1000,
  preloadingEnabled: true,
  gifPreloadingEnabled: false,
  preloadOutsideGalleryOnSearchPage: true,
  upscaleEverythingOnSearchPage: false,

  preloadMediaDebounceTime: 150,
  navigationThrottleTime: 250,
  galleryNavigationDelay: 100,
  idleInteractionDuration: 750,
  menuVisibilityTime: ON_MOBILE_DEVICE ? 2000 : 1000,

  maxImagesToPreloadAroundInGallery: ON_MOBILE_DEVICE ? 3 : 50,
  visibleThumbsDownwardScrollPixelGenerosity: 50,
  visibleThumbsDownwardScrollPercentageGenerosity: 100,
  fetchImageBitmapsInWorker: false,
  get sendImageBitmapsToWorker(): boolean {
    return !this.fetchImageBitmapsInWorker;
  },
  useOffscreenThumbUpscaler: false,
  createImageAccentColors: false,
  galleryMenuMonoColor: true
};
