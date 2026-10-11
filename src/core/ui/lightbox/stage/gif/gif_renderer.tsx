import { LightboxRendererClass, LightboxStageRenderer } from "@/core/ui/lightbox/stage/renderer";
import { Signal, effect } from "@/core/utils/reactive/signal";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/media/media";
import { Resource } from "@/core/utils/reactive/resource";
import { h } from "@/core/ui/h/h";

export interface GifRendererDependencies {
  resolveOriginalUrl: (media: Media) => Promise<string>;
}

export class GifRenderer implements LightboxStageRenderer {
  public readonly root: HTMLElement;
  private readonly image: HTMLImageElement;
  private readonly current = new Signal<MediaItem | undefined>(undefined);
  private readonly urlResource: Resource<MediaItem, string>;
  private readonly stopRenderEffect: () => void;

  constructor(dependencies: GifRendererDependencies) {
    this.image = <img className={LightboxRendererClass.media} alt="" decoding="async" /> as HTMLImageElement;
    this.root = <div className={LightboxRendererClass.root}>{this.image}</div>;
    this.urlResource = new Resource({
      source: this.current,
      load: (item): Promise<string> => dependencies.resolveOriginalUrl(item.media).catch(error => {
        console.error(error);
        throw error;
      })
    });
    this.stopRenderEffect = effect(() => this.render());
  }

  public show(item: MediaItem): void {
    this.current.value = item;
  }

  public clear(): void {
    this.current.value = undefined;
  }

  public setNeighbors(): void { }

  public dispose(): void {
    this.clear();
    this.stopRenderEffect();
    this.urlResource.dispose();
  }

  private render(): void {
    const item = this.current.value;
    const url = this.urlResource.value.value;

    if (item === undefined) {
      this.root.hidden = true;
      this.image.hidden = true;
      this.image.removeAttribute("src");
      return;
    }
    this.root.hidden = false;
    this.image.hidden = false;

    if (url === undefined) {
      this.image.removeAttribute("src");
    } else if (this.image.getAttribute("src") !== url) {
      this.image.src = url;
    }
  }
}
