class GallerySettings {
  static mainCanvasResolutions = {
    search: "3840x2160",
    favorites: "7680x4320",
    mobile: "1920x1080"
  };
  static get mainCanvasResolution() {
    if (Flags.onMobileDevice) {
      return GallerySettings.mainCanvasResolutions.mobile;
    }
    return Flags.onSearchPage ? GallerySettings.mainCanvasResolutions.search : GallerySettings.mainCanvasResolutions.favorites;
  }
  static get mainCanvasDimensions() {
    return Utils.getDimensions(GallerySettings.mainCanvasResolution);
  }
  static upscaledThumbCanvasWidth = 900;
  static minUpscaledThumbCanvasWidth = 200;
  static maxUpscaledThumbCanvasWidth = 2500;
  static maxUpscaledThumbCanvasHeight = 16000;
  static upscaleDelay = 100;
  static imageMegabyteLimit = 600;
  static searchPagePreloadedImageCount = 42;
  static minimumPreloadedImageCount = 5;
  static visibleThumbsDownwardScrollPixelGenerosity = 500;
  static navigationThrottleTime = 250;
  static maxImagesToRenderAroundInGallery = Flags.onMobileDevice ? 3 : 50;
  static additionalVideoPlayerCount = Flags.onMobileDevice ? 2 : 2;
  static endlessSearchPageGallery = false;
  static idleInteractionDuration = 1000;
  static galleryMenuVisibilityTime = 1000;
}
