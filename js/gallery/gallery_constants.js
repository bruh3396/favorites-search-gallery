class GalleryConstants {
  static mainCanvasResolutions = {
    search: "3840x2160",
    favorites: "7680x4320",
    mobile: "1920x1080"
  };
  static get mainCanvasResolution() {
    if (Utils.onMobileDevice()) {
      return GalleryConstants.mainCanvasResolutions.mobile;
    }
    return Utils.onSearchPage() ? GalleryConstants.mainCanvasResolutions.search : GalleryConstants.mainCanvasResolutions.favorites;
  }
  static get mainCanvasDimensions() {
    return Utils.getDimensions(GalleryConstants.mainCanvasResolution);
  }
  static upscaledThumbCanvasWidth = 600;
  static maxUpscaledThumbCanvasHeight = 16000;
  static imageMegabyteLimit = 750;
  static minimumPreloadedImagesCount = 6;
  static visibleThumbsDownwardScrollPixelGenerosity = 500;
  static navigationThrottleTime = 250;
  static forwardNavigationKeys = new Set(["d", "D", "ArrowRight"]);
  static backwardNavigationKeys = new Set(["a", "A", "ArrowLeft"]);
  static exitKeys = new Set(["Escape", "Delete", "Backspace"]);
  static navigationKeys = Utils.union(GalleryConstants.forwardNavigationKeys, GalleryConstants.backwardNavigationKeys);
  static maxImagesToRenderAroundInGallery = Utils.onMobileDevice() ? 3 : 50;
  static additionalVideoPlayerCount = Utils.onMobileDevice() ? 2 : 2;
}
