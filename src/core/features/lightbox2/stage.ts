import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { createLightboxVideo, playVideo } from "@/core/features/lightbox2/ui/video";
import { LightboxMediaCache } from "@/core/features/lightbox2/media_cache";
import { LightboxVideoPool } from "@/core/features/lightbox2/video_pool";
import { MediaItem } from "@/core/domain/post/post";
import { MorphSource } from "@/core/boundary/ports/morpher/morpher";
import { Preference } from "@/core/utils/reactive/preference";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Resource } from "@/core/utils/reactive/resource";
import { ZoomSize } from "@/core/features/lightbox2/zoom";
import { createLightboxImage } from "@/core/features/lightbox2/ui/image";
import { currentDocument } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export interface LightboxStageConfiguration {
  readonly gifCapacity: number;
  readonly videoCapacity: number;
}

export interface LightboxStageDependencies<T extends MediaItem> {
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  currentItem: Readable<T | undefined>;
  retainedItems: Readable<readonly T[]>;
  volume: Preference<number>;
  muted: Preference<boolean>;
}

export class LightboxStage<T extends MediaItem> {
  public readonly image: Readable<HTMLCanvasElement | undefined>;
  public readonly gif: Readable<HTMLImageElement | undefined>;
  public readonly video: Readable<HTMLVideoElement | undefined>;
  public readonly previewUrl: Readable<string | undefined>;
  public readonly shownPreviewUrl: Readable<string | undefined>;
  public readonly shownMedia: Readable<MorphSource | undefined>;
  public readonly mediaSize: Readable<ZoomSize | undefined>;
  private readonly videoPool: LightboxVideoPool;
  private readonly volume: Preference<number>;
  private readonly muted: Preference<boolean>;

  constructor(configuration: LightboxStageConfiguration, dependencies: LightboxStageDependencies<T>) {
    const { remoteMedia, currentItem, retainedItems, volume, muted } = dependencies;
    const ownerDocument = currentDocument();
    const imageCache = new LightboxMediaCache<HTMLCanvasElement>({ kind: "image" }, {
      load: async(media, signal): Promise<HTMLCanvasElement> => {
        const bitmap = await remoteMedia.decodeStill(media, signal);
        const canvas = createLightboxImage(ownerDocument, bitmap);

        bitmap.close();
        return canvas;
      },
      release: (canvas): void => {
        canvas.width = 0;
        canvas.height = 0;
      }
    });
    const gifCache = new LightboxMediaCache<HTMLImageElement>({ kind: "gif", capacity: configuration.gifCapacity }, {
      load: (media, signal): Promise<HTMLImageElement> => remoteMedia.loadOriginal(media, signal),
      release: (gif): void => gif.removeAttribute("src")
    });
    const videoCache = new LightboxMediaCache<HTMLVideoElement>({ kind: "video", capacity: configuration.videoCapacity }, {
      load: async(media, signal): Promise<HTMLVideoElement> => {
        const url = await remoteMedia.resolveOriginalUrl(media);

        signal.throwIfAborted();
        return this.videoPool.acquire(url);
      },
      release: (video): void => this.videoPool.release(video)
    });

    this.volume = volume;
    this.muted = muted;
    this.videoPool = new LightboxVideoPool({ capacity: configuration.videoCapacity }, () => this.createVideo());
    this.image = showCurrent(imageCache, currentItem);
    this.gif = showCurrent(gifCache, currentItem);
    this.video = showCurrent(videoCache, currentItem);
    this.previewUrl = new Resource({
      source: currentItem,
      load: (item: T): Promise<string> => resolveDecodedUrl(ownerDocument, remoteMedia.resolvePreviewUrl(item.media))
    }).value;
    this.shownPreviewUrl = computed(() => {
      const isCovered = currentItem.value?.media.kind === "video" || this.image.value !== undefined || this.gif.value !== undefined;
      return isCovered ? undefined : this.previewUrl.value;
    });
    this.shownMedia = computed(() => this.image.value ?? this.gif.value ?? this.video.value);
    this.mediaSize = computed(() => {
      const image = this.image.value;
      const gif = this.gif.value;

      if (image !== undefined) {
        return { width: image.width, height: image.height };
      }
      return gif === undefined ? undefined : { width: gif.naturalWidth, height: gif.naturalHeight };
    });
    effect(() => imageCache.retain(retainedItems.value));
    effect(() => gifCache.retain(retainedItems.value));
    effect(() => videoCache.retain(retainedItems.value));
    effect(() => {
      const video = this.video.value;

      if (video !== undefined) {
        video.volume = volume.value;
        video.muted = muted.value;
      }
    });
    onCleanup(() => {
      imageCache.dispose();
      gifCache.dispose();
      videoCache.dispose();
    });
  }

  public toggleMute(): void {
    if (this.video.peek() !== undefined) {
      this.muted.set(!this.muted.peek());
    }
  }

  public togglePause(): void {
    const video = this.video.peek();

    if (video === undefined) {
      return;
    }

    if (video.paused) {
      playVideo(video);
    } else {
      video.pause();
    }
  }

  private createVideo(): HTMLVideoElement {
    const video = createLightboxVideo();

    video.addEventListener("volumechange", () => {
      if (video === this.video.peek()) {
        this.volume.set(video.volume);
        this.muted.set(video.muted);
      }
    });
    return video;
  }
}

async function resolveDecodedUrl(ownerDocument: Document, pendingUrl: Promise<string>): Promise<string> {
  const url = await pendingUrl;
  const image = ownerDocument.createElement("img");

  image.src = url;
  await image.decode();
  return url;
}

function showCurrent<V>(cache: LightboxMediaCache<V>, currentItem: Readable<MediaItem | undefined>): Readable<V | undefined> {
  return computed(() => cache.loaded.value.get(currentItem.value?.id ?? ""));
}
