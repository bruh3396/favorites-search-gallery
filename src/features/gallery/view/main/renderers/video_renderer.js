class GalleryVideoRenderer extends Renderer {
  /** @type {VideoController} */
  videoController;

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    super(galleryContainer);
    this.videoController = new VideoController(this.container);
  }

  /**
   * @param {HTMLElement} thumb
   */
  show(thumb) {
    this.videoController.playVideo(thumb);
  }

  clear() {
    this.videoController.stopAllVideos();
  }

  handlePageChange() {
    this.videoController.clearVideoSources();
  }

  handlePageChangeInGallery() { }

  /**
   * @param {HTMLElement[]} thumbs
   */
  preload(thumbs) {
    this.videoController.preloadVideoPlayers(thumbs);
  }

  /**
   * @param {Boolean} value
   */
  toggleVideoLooping(value) {
    this.videoController.toggleVideoLooping(value);
  }

  restartVideo() {
    this.videoController.restartActiveVideo();
  }

  toggleVideoPause() {
    this.videoController.toggleActiveVideoPause();
  }
}
