import { DO_NOTHING } from "../../../../../lib/environment/constants";
import { GalleryAbstractController } from "../gallery_abstract_controller";
import { GallerySettings } from "../../../../../config/gallery_settings";
import { isGif } from "../../../../../lib/media_resolver";
import { resolveGIFURL } from "../../../../../lib/server/url/media_url_resolver";

class GifController extends GalleryAbstractController {
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
    this.preload = GallerySettings.gifPreloadingEnabled ? this.preload : DO_NOTHING;
  }

  public hide(): void {
    super.hide();
    this.gif.src = "";
  }
  public preload(elements: HTMLElement[]): void {
    const gifSources = elements
      .filter((element) => isGif(element))
      .slice(0, GallerySettings.preloadedGifCount)
      .map((element) => resolveGIFURL(element));

    for (const source of gifSources) {
      const gif = new Image();

      gif.src = source;
      this.preloadedGIFs.push(gif);
    }
  }
  public handlePageChange(): void { }
  public handlePageChangeInGallery(): void { }

  protected display(element: HTMLElement): void {
    this.gif.src = "";
    this.gif.src = resolveGIFURL(element);
  }
}

export const GalleryGifController = new GifController();
