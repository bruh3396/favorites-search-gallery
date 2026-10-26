import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { createLightboxImage, createLightboxVideo, playVideo } from "@/core/features/lightbox/stage/media_elements";
import { LightboxMediaCache } from "@/core/features/lightbox/stage/media_cache";
import { LightboxMediaResolver } from "@/core/features/lightbox/stage/media_resolver";
import { LightboxVideoPool } from "@/core/features/lightbox/stage/video_pool";
import { MediaItem } from "@/core/domain/media/media_item";
import { MorphSource } from "@/core/features/lightbox/closer/morph";
import { Preference } from "@/core/utils/preference/preference";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Resource } from "@/core/utils/reactive/resource";
import { Size } from "@/core/utils/geometry/size";
import { currentDocument } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export interface LightboxStageConfiguration {
  readonly gifCapacity: number;
  readonly videoCapacity: number;
}

export interface LightboxStageDependencies<T extends MediaItem> {
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  resolver: LightboxMediaResolver;
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
  public readonly mediaSize: Readable<Size | undefined>;
  private readonly videoPool: LightboxVideoPool;
  private readonly volume: Preference<number>;
  private readonly muted: Preference<boolean>;

  constructor(configuration: LightboxStageConfiguration, dependencies: LightboxStageDependencies<T>) {
    const { remoteMedia, resolver, currentItem, retainedItems, volume, muted } = dependencies;
    const ownerDocument = currentDocument();
    const resolvedItems = computed(() => resolver.readResolved(retainedItems.value));
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
    this.videoPool = new LightboxVideoPool({ capacity: configuration.videoCapacity }, () => this.createVideo(ownerDocument));
    this.image = showCurrent(imageCache, currentItem);
    this.gif = showCurrent(gifCache, currentItem);
    this.video = showCurrent(videoCache, currentItem);
    this.previewUrl = new Resource({
      source: currentItem,
      load: (item: T): Promise<string> => resolveDecodedUrl(ownerDocument, remoteMedia.resolvePreviewUrl(item.media))
    }).value;
    this.shownPreviewUrl = computed(() => {
      const isVideo = resolver.readMedia(currentItem.value?.id ?? "")?.kind === "video";
      const isCovered = isVideo || this.image.value !== undefined || this.gif.value !== undefined;
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
    effect(() => {
      const current = currentItem.value;

      resolver.resolve(current === undefined ? retainedItems.value : [current, ...retainedItems.value]);
    });
    effect(() => imageCache.retain(resolvedItems.value));
    effect(() => gifCache.retain(resolvedItems.value));
    effect(() => videoCache.retain(resolvedItems.value));
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

  private createVideo(ownerDocument: Document): HTMLVideoElement {
    const video = createLightboxVideo(ownerDocument);

    video.addEventListener("volumechange", () => {
      if (video === this.video.peek()) {
        const { volume, muted: isMuted } = video;

        this.volume.set(volume);
        this.muted.set(isMuted);
      }
    });
    return video;
  }
}

async function resolveDecodedUrl(ownerDocument: Document, url: string): Promise<string> {
  const image = ownerDocument.createElement("img");

  image.src = url;
  await image.decode();
  return url;
}

function showCurrent<V>(cache: LightboxMediaCache<V>, currentItem: Readable<MediaItem | undefined>): Readable<V | undefined> {
  return computed(() => cache.loaded.value.get(currentItem.value?.id ?? ""));
}
