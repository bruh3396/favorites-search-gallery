import { Readable, effect } from "@/core/utils/reactive/signal";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { doNothing } from "@/core/utils/function/function";
import { h } from "@/core/ui/h/h";

export const LightboxStageClass = {
  root: "fsg-LightboxStage",
  image: "fsg-LightboxStage-image"
} as const;

export interface LightboxStageProps {
  current: Readable<MediaItem | undefined>;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalUrl: (media: Media) => Promise<string>;
}

export function LightboxStage(props: LightboxStageProps): HTMLElement {
  const image = <img className={LightboxStageClass.image} decoding="async" alt="" /> as HTMLImageElement;

  effect(() => showPost(image, props.current.value, props));
  return <div className={LightboxStageClass.root}>{image}</div>;
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
    image.src = originalUrl;
  }
}

async function preloadImage(ownerDocument: Document, url: string): Promise<void> {
  const loader = ownerDocument.createElement("img");

  loader.src = url;
  await loader.decode().catch(doNothing);
}
