import { Readable, effect } from "@/core/utils/reactive/signal";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { doNothing } from "@/core/utils/function/function";
import { h } from "@/core/ui/h/h";
import { mountSharpnessExperiment } from "@/core/ui/lightbox/sharpness_experiment";

export const LightboxStageClass = {
  root: "fsg-LightboxStage",
  image: "fsg-LightboxStage-image"
} as const;

export interface LightboxStageProps {
  current: Readable<MediaItem | undefined>;
  neighbors: Readable<readonly MediaItem[]>;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalUrl: (media: Media) => Promise<string>;
  // TODO: temporary, for the sharpness experiment.
  fetchOriginal?: (media: Media) => Promise<Blob>;
}

export function LightboxStage(props: LightboxStageProps): HTMLElement {
  const image = <img className={LightboxStageClass.image} decoding="async" draggable={false} alt="" /> as HTMLImageElement;
  const preloader = new ImagePreloader(image.ownerDocument);
  const stage = <div className={LightboxStageClass.root}>{image}</div>;

  effect(() => showPost(image, props.current.value, props));
  effect(() => preloadOriginals(preloader, props.neighbors.value, props));

  if (props.fetchOriginal !== undefined) {
    mountSharpnessExperiment(stage, image, props.current, props.fetchOriginal);
  }
  return stage;
}

class ImagePreloader {
  private images: HTMLImageElement[] = [];

  constructor(private readonly document: Document) { }

  public preload(urls: readonly string[]): void {
    this.images = urls.map(url => {
      const loader = this.document.createElement("img");

      loader.src = url;
      loader.decode().catch(doNothing);
      return loader;
    });
  }
}

function preloadOriginals(preloader: ImagePreloader, neighbors: readonly MediaItem[], { neighbors: published, resolveOriginalUrl }: LightboxStageProps): void {
  Promise.all(neighbors.map(neighbor => resolveOriginalUrl(neighbor.media)))
    .then(urls => {
      if (published.peek() === neighbors) {
        preloader.preload(urls);
      }
    })
    .catch(console.error);
}

function showPost(image: HTMLImageElement, post: MediaItem | undefined, props: LightboxStageProps): void {
  if (post === undefined) {
    image.removeAttribute("src");
    return;
  }
  showImage(image, post, props).catch(console.error);
}

async function showImage(image: HTMLImageElement, post: MediaItem, { current, resolvePreviewUrl, resolveOriginalUrl }: LightboxStageProps): Promise<void> {
  const previewUrl = await resolvePreviewUrl(post.media);

  if (current.peek() !== post) {
    return;
  }
  image.src = previewUrl;
  const originalUrl = await resolveOriginalUrl(post.media);

  await preloadImage(image.ownerDocument, originalUrl);

  if (current.peek() === post) {
    // eslint-disable-next-line require-atomic-updates -- the check above is the staleness guard
    image.src = originalUrl;
  }
}

async function preloadImage(ownerDocument: Document, url: string): Promise<void> {
  const loader = ownerDocument.createElement("img");

  loader.src = url;
  await loader.decode().catch(doNothing);
}
