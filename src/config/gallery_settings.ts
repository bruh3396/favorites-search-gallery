import { ON_MOBILE_DEVICE, ON_SEARCH_PAGE } from "../lib/global/flags/intrinsic_flags";
import { SharedGallerySettings } from "./shared_gallery_settings";

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
  searchPagePreloadedImageCount: ON_MOBILE_DEVICE ? 4 : 42,
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
  menuVisibilityTime: ON_MOBILE_DEVICE ? 2000 : 1000,
  maxVisibleThumbsBeforeStoppingPreload: 175,
  useOffscreenThumbUpscaler: false,
  fetchImageBitmapsInWorker: true,
  onlyCacheImagesInGallery: SharedGallerySettings.upscaleUsingSamples,
  upscaleOnMobile: true,
  preloadSingleImagesWhenCachingOutsideDisabled: true,
  maxSingleImageCacheCount: 5,
  get sendImageBitmapsToWorker(): boolean {
    return !this.fetchImageBitmapsInWorker;
  },
  createImageAccentColors: false,
  galleryMenuMonoColor: true
};
