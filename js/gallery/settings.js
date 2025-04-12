// eslint-disable-next-line max-classes-per-file
class GallerySettings {
  static get mainCanvasResolution() {
    if (Flags.onMobileDevice) {
      return GallerySettings.mainCanvasResolutions.mobile;
    }
    return Flags.onSearchPage ? GallerySettings.mainCanvasResolutions.search : GallerySettings.mainCanvasResolutions.favorites;
  }
  static mainCanvasResolutions = {
    search: "3840x2160",
    favorites: "7680x4320",
    mobile: "1920x1080"
  };
  static imageMegabyteLimit = 800;
  static searchPagePreloadedImageCount = 42;
  static minimumPreloadedImageCount = 5;
  static preloadedVideoCount = Flags.onMobileDevice ? 2 : 2;
  static preloadedGifCount = Flags.onMobileDevice ? 2 : 2;
  static preloadContentDebounceTime = 400;
  static preloadingEnabled = true;
  static visibleThumbsDownwardScrollPixelGenerosity = 1000;
  static navigationThrottleTime = 250;
  static maxImagesToRenderAroundInGallery = Flags.onMobileDevice ? 3 : 50;
  static idleInteractionDuration = 1000;
  static menuVisibilityTime = 1000;
  static maxVisibleThumbsBeforeStoppingPreload = 100;
  static useOffscreenThumbUpscaler = true;
  static fetchImageBitmapsInWorker = true;
  static sendImageBitmapsToWorker = !GallerySettings.fetchImageBitmapsInWorker;
  static createImageAccentColors = false;
}

class SharedGallerySettings {
  static upscaledThumbCanvasWidth = 800;
  static maxUpscaledThumbCanvasHeight = 16000;
}
