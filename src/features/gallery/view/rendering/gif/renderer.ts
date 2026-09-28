import { Environment } from "@/core/boundary/environment";
import { GalleryConfig } from "@/config/gallery_config";
import { PostMedia } from "@/core/domain/post/post";
import { MediaSource } from "@/core/boundary/ports/media_source";
import { Renderer } from "@/features/gallery/types/types";
import { createElement } from "@/utils/browser/element";
import { isGif } from "@/lib/media/media_type";

export class GalleryGifRenderer implements Renderer {
  public readonly root: HTMLDivElement;
  private readonly gif: HTMLImageElement;
  private readonly preloadedGifs: HTMLImageElement[] = [];
  private readonly preloadedGifCount: number;
  private shownId: string | undefined;

  constructor(environment: Environment, private readonly mediaSource: Pick<MediaSource, "originalUrl">) {
    this.preloadedGifCount = environment.device === "mobile" ? GalleryConfig.preloadedGifCount.mobile : GalleryConfig.preloadedGifCount.desktop;
    this.gif = createElement("img", {className: "gallery-image"});
    this.root = createElement("div", { id: "gif-container", className: "gallery-image-frame", children: [this.gif] });
  }

  public render(item: PostMedia): void {
    this.root.style.visibility = "visible";
    this.gif.src = "";
    this.shownId = item.id;
    void this.show(item);
  }

  public hide(): void {
    this.root.style.visibility = "hidden";
    this.gif.src = "";
    this.shownId = undefined;
  }

  public async cache(items: PostMedia[]): Promise<void> {
    if (!GalleryConfig.gifPreloadingEnabled) {
      return;
    }
    const gifs = items
      .filter((item) => isGif(item))
      .slice(0, this.preloadedGifCount);

    for (const gif of gifs) {
      const preloadedGif = new Image();

      preloadedGif.src = await this.mediaSource.originalUrl(gif.media);
      this.preloadedGifs.push(preloadedGif);
    }
  }

  private async show(item: PostMedia): Promise<void> {
    const url = await this.mediaSource.originalUrl(item.media);

    if (this.shownId === item.id) {
      this.gif.src = url;
    }
  }
}
