import { GalleryBaseRenderer } from "../gallery_base_renderer";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { getGIFSource } from "../../../../../utils/content/url_dom";
import { isGif } from "../../../../../utils/content/content_type";

class GifRenderer extends GalleryBaseRenderer {
  private readonly gif: HTMLImageElement;
  private preloadedGIFs: HTMLImageElement[];

  constructor() {
    super();
    this.container.id = "gif-container";
    this.gif = document.createElement("img");
    this.container.className = "fullscreen-image-container";
    this.gif.className = "fullscreen-image";
    this.preloadedGIFs = [];
    this.container.appendChild(this.gif);
  }

  public display(element: HTMLElement): void {
    super.display(element);
    this.gif.src = "";
    this.gif.src = getGIFSource(element);
  }

  public hide(): void {
    super.hide();
    this.gif.src = "";
  }

  public preload(elements: HTMLElement[]): void {
    const gifSources = elements
      .filter((element) => isGif(element))
      .slice(0, GallerySettings.preloadedGifCount)
      .map((element) => getGIFSource(element));

    for (const source of gifSources) {
      const gif = new Image();

      gif.src = source;
      this.preloadedGIFs.push(gif);
    }
  }

  public handlePageChange(): void { }

  public handlePageChangeInGallery(): void { }
}

export const GalleryGifRenderer = new GifRenderer();
