import * as GalleryImageCreator from "./gallery_image_creator";
import * as GalleryCanvas from "./gallery_canvas";
import { GalleryBaseRenderer } from "./gallery_base_renderer";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { ImageRequest } from "../../../types/image_request";

class GalleryImageRenderer extends GalleryBaseRenderer {
  public thumbUpscaler: ThumbUpscaler;
  public lastShownId: string;

  constructor() {
    super();
    GalleryImageCreator.setupImageCreator(this.onImageCreated.bind(this));
    GalleryCanvas.setupGalleryCanvas(this.container);
    this.thumbUpscaler = GallerySettings.useOffscreenThumbUpscaler ? new OffscreenThumbUpscalerWrapper() : new MainThumbUpscaler();
    this.lastShownId = "";
  }

  public show(thumb: HTMLElement): void {
    const imageRequest = this.imageCreator.getImageRequest(thumb);
    const requestHasNotStarted = imageRequest === undefined;

    this.lastShownId = thumb.id;

    if (requestHasNotStarted) {
      this.imageCreator.createImage(new ImageRequest(thumb));
      this.imageCreator.createLowResolutionImage(thumb);
      return;
    }

    if (imageRequest.isIncomplete) {
      this.imageCreator.createLowResolutionImage(thumb);
      return;
    }
    this.canvas.draw(imageRequest.imageBitmap);

    if (imageRequest.accentColor !== null) {
      Utils.setColorScheme(imageRequest.accentColor);
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  preload(thumbs) {
    this.imageCreator.createNewImages(thumbs);
  }

  handlePageChange() {
    this.imageCreator.clearAllImages();
    this.thumbUpscaler.handlePageChange();
  }

  handlePageChangeInGallery() {
    this.imageCreator.clearAnimatedImages();
    setTimeout(() => {
      this.thumbUpscaler.handlePageChange();
      this.upscaleThumbsWithAvailableImages();
    }, 10);
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  handleResultsAddedToCurrentPage(thumbs) {
    this.thumbUpscaler.presetCanvasDimensions(thumbs);
  }

  upscaleThumbsWithAvailableImages() {
    for (const request of this.imageCreator.getImageRequests()) {
      this.thumbUpscaler.upscale(request);
    }
  }

  clear() {
    this.canvas.clear();
  }

  /**
   * @param {ImageRequest} request
   */
  onImageCreated(request) {
    this.thumbUpscaler.upscale(request);

    if (request.id === this.lastShownId) {
      this.show(request.thumb);
    }
  }

  /**
   * @param {Boolean | undefined} value
   * @returns {Boolean}
   */
  toggleZoom(value) {
    return this.container.classList.toggle("zoomed-in", value);
  }

  /**
   * @param {Boolean} value
   */
  toggleZoomCursor(value) {
    this.container.classList.toggle("zooming", value);

  }

  /**
   * @param {Number} x
   * @param {Number} y
   */
  scrollToZoomPoint(x, y) {
     this.canvas.scrollToZoomPoint(x, y);
  }
}
