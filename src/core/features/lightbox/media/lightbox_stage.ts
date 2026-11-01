import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { LightboxMediaCache } from "@/core/features/lightbox/media/lightbox_media_cache";
import { LightboxMediaElement } from "@/core/features/lightbox/media/lightbox_media_element";
import { LightboxMediaResolver } from "@/core/features/lightbox/media/lightbox_media_resolver";
import { LightboxVideoPool } from "@/core/features/lightbox/media/lightbox_video_pool";
import { MediaItem } from "@/core/domain/media/media_item";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Resource } from "@/core/utils/reactive/resource";
import { Size } from "@/core/utils/geometry/size";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { currentDocument } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";
import { playVideo } from "@/core/features/lightbox/media/video_utilities";

export interface LightboxStageConfiguration {
  readonly gifCapacity: number;
  readonly videoCapacity: number;
}

export interface LightboxStageDependencies<T extends MediaItem> {
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  lightboxMediaResolver: LightboxMediaResolver;
  currentItem: Readable<T | undefined>;
  retainedItems: Readable<readonly T[]>;
  volume: StoredValue<number>;
  muted: StoredValue<boolean>;
}

export class LightboxStage<T extends MediaItem> {
  public readonly image: Readable<HTMLCanvasElement | undefined>;
  public readonly gif: Readable<HTMLImageElement | undefined>;
  public readonly video: Readable<HTMLVideoElement | undefined>;
  public readonly previewUrl: Readable<string | undefined>;
  public readonly shownPreviewUrl: Readable<string | undefined>;
  public readonly shownMedia: Readable<LightboxMediaElement | undefined>;
  public readonly mediaSize: Readable<Size | undefined>;
  private readonly videoPool: LightboxVideoPool;
  private readonly volume: StoredValue<number>;
  private readonly muted: StoredValue<boolean>;

  constructor(configuration: LightboxStageConfiguration, dependencies: LightboxStageDependencies<T>) {
    const { remoteMedia, lightboxMediaResolver, currentItem, retainedItems, volume, muted } = dependencies;
    const ownerDocument = currentDocument();
    const resolvedItems = computed(() => lightboxMediaResolver.readResolved(retainedItems.value));
    const imageLightboxMediaCache = new LightboxMediaCache<HTMLCanvasElement>({ kind: "image" }, {
      load: async(media, signal): Promise<HTMLCanvasElement> => {
        const bitmap = await remoteMedia.decodeStill(media, signal);
        const canvas = drawBitmap(ownerDocument, bitmap);

        bitmap.close();
        return canvas;
      },
      release: (canvas): void => {
        canvas.width = 0;
        canvas.height = 0;
      }
    });
    const gifLightboxMediaCache = new LightboxMediaCache<HTMLImageElement>({ kind: "gif", capacity: configuration.gifCapacity }, {
      load: (media, signal): Promise<HTMLImageElement> => remoteMedia.loadOriginal(media, signal),
      release: (gif): void => gif.removeAttribute("src")
    });
    const videoLightboxMediaCache = new LightboxMediaCache<HTMLVideoElement>({ kind: "video", capacity: configuration.videoCapacity }, {
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
    this.image = showCurrent(imageLightboxMediaCache, currentItem);
    this.gif = showCurrent(gifLightboxMediaCache, currentItem);
    this.video = showCurrent(videoLightboxMediaCache, currentItem);
    this.previewUrl = new Resource({
      source: currentItem,
      load: (item: T): Promise<string> => resolveDecodedUrl(ownerDocument, remoteMedia.resolvePreviewUrl(item.media))
    }).value;
    this.shownPreviewUrl = computed(() => {
      const isVideo = lightboxMediaResolver.readMedia(currentItem.value?.id ?? "")?.kind === "video";
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

      lightboxMediaResolver.resolve(current === undefined ? retainedItems.value : [current, ...retainedItems.value]);
    });
    effect(() => imageLightboxMediaCache.retain(resolvedItems.value));
    effect(() => gifLightboxMediaCache.retain(resolvedItems.value));
    effect(() => videoLightboxMediaCache.retain(resolvedItems.value));
    effect(() => {
      const video = this.video.value;

      if (video !== undefined) {
        video.volume = volume.value;
        video.muted = muted.value;
      }
    });
    onCleanup(() => {
      imageLightboxMediaCache.dispose();
      gifLightboxMediaCache.dispose();
      videoLightboxMediaCache.dispose();
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
    const video = ownerDocument.createElement("video");

    video.controls = true;
    video.loop = true;
    video.preload = "auto";
    video.setAttribute("controlsList", "nofullscreen");
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

function drawBitmap(ownerDocument: Document, bitmap: ImageBitmap): HTMLCanvasElement {
  const canvas = ownerDocument.createElement("canvas");

  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  return canvas;
}

async function resolveDecodedUrl(ownerDocument: Document, url: string): Promise<string> {
  const image = ownerDocument.createElement("img");

  image.src = url;
  await image.decode();
  return url;
}

function showCurrent<V>(lightboxMediaCache: LightboxMediaCache<V>, currentItem: Readable<MediaItem | undefined>): Readable<V | undefined> {
  return computed(() => lightboxMediaCache.loaded.value.get(currentItem.value?.id ?? ""));
}
