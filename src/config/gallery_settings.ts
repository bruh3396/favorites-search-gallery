import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../lib/global/flags/intrinsic_flags";

export const GallerySettings = {
  mainCanvasResolutions: {
    search: "3840x2160",
    favorites: "7680x4320",
    mobile: "1920x1080"
  },
  get mainCanvasResolution(): string {
    if (ON_MOBILE_DEVICE) {
      return GallerySettings.mainCanvasResolutions.mobile;
    }
    return ON_SEARCH_PAGE ? GallerySettings.mainCanvasResolutions.search : GallerySettings.mainCanvasResolutions.favorites;
  },
  imageMegabyteLimit: ON_MOBILE_DEVICE ? 0 : 850,
  searchPagePreloadedImageCount: 42,
  minimumPreloadedImageCount: ON_MOBILE_DEVICE ? 3 : 5,
  preloadedVideoCount: ON_MOBILE_DEVICE ? 2 : 2,
  preloadedGifCount: ON_MOBILE_DEVICE ? 2 : 2,
  preloadContentDebounceTime: 150,
  preloadingEnabled: true,
  visibleThumbsDownwardScrollPixelGenerosity: 50,
  visibleThumbsDownwardScrollPercentageGenerosity: 100,
  navigationThrottleTime: 250,
  maxImagesToRenderAroundInGallery: ON_MOBILE_DEVICE ? 3 : 50,
  idleInteractionDuration: 1000,
  menuVisibilityTime: 1000,
  maxVisibleThumbsBeforeStoppingPreload: 150,
  useOffscreenThumbUpscaler: false,
  fetchImageBitmapsInWorker: true,
  get sendImageBitmapsToWorker(): boolean {
    return !this.fetchImageBitmapsInWorker;
  },
  createImageAccentColors: false
};
