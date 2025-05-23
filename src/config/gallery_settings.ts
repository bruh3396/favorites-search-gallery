import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../lib/globals/flags";

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
  imageMegabyteLimit: 800,
  searchPagePreloadedImageCount: 42,
  minimumPreloadedImageCount: 5,
  preloadedVideoCount: ON_MOBILE_DEVICE ? 2 : 2,
  preloadedGifCount: ON_MOBILE_DEVICE ? 2 : 2,
  preloadContentDebounceTime: 400,
  preloadingEnabled: true,
  visibleThumbsDownwardScrollPixelGenerosity: 1000,
  navigationThrottleTime: 250,
  maxImagesToRenderAroundInGallery: ON_MOBILE_DEVICE ? 3 : 50,
  idleInteractionDuration: 1000,
  menuVisibilityTime: 1000,
  maxVisibleThumbsBeforeStoppingPreload: 100,
  useOffscreenThumbUpscaler: true,
  fetchImageBitmapsInWorker: true,
  get sendImageBitmapsToWorker(): boolean {
    return !this.fetchImageBitmapsInWorker;
  },
  createImageAccentColors: false
};

export const SharedGallerySettings = {
   upscaledThumbCanvasWidth: 800,
   maxUpscaledThumbCanvasHeight: 16000
};
