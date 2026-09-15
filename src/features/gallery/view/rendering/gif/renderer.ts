import { GalleryConfig } from "@/config/gallery_config";
import { Renderer } from "@/features/gallery/types/gallery_types";
import { createElement } from "@/utils/browser/element";
import { gifUrl } from "@/lib/media/url";
import { isGif } from "@/lib/media/media_type";
import { toMediaItem } from "@/lib/ui/thumb/media_item";

export class GalleryGifRenderer implements Renderer {
  public readonly root: HTMLDivElement;
  private readonly gif: HTMLImageElement;
  private readonly preloadedGifs: HTMLImageElement[] = [];

  constructor() {
    this.gif = createElement("img", {className: "gallery-image"});
    this.root = createElement("div", { id: "gif-container", className: "gallery-image-frame", children: [this.gif] });
  }

  public render(thumb: HTMLElement): void {
    this.root.style.visibility = "visible";
    this.gif.src = "";
    this.gif.src = gifUrl(toMediaItem(thumb));
  }

  public hide(): void {
    this.root.style.visibility = "hidden";
    this.gif.src = "";
  }

  public cache(thumbs: HTMLElement[]): void {
    if (!GalleryConfig.gifPreloadingEnabled) {
      return;
    }

    const gifSources = thumbs
      .map((thumb) => toMediaItem(thumb))
      .filter((item) => isGif(item))
      .slice(0, GalleryConfig.preloadedGifCount)
      .map((item) => gifUrl(item));

    for (const source of gifSources) {
      const preloadedGif = new Image();

      preloadedGif.src = source;
      this.preloadedGifs.push(preloadedGif);
    }
  }
}
