import { Readable, computed, effect } from "@/core/utils/reactive/signal";
import { LightboxMediaCache } from "@/core/features/lightbox2/media_cache";
import { LightboxVideoPool } from "@/core/features/lightbox2/video_pool";
import { MediaItem } from "@/core/domain/post/post";
import { Preference } from "@/core/utils/reactive/preference";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { onCleanup } from "@/core/utils/reactive/scope";
import { createLightboxVideo, playVideo } from "@/core/features/lightbox2/ui/video";

export interface LightboxStageConfiguration {
  readonly gifCapacity: number;
  readonly videoCapacity: number;
}

export interface LightboxStageDependencies<T extends MediaItem> {
  remoteMedia: Pick<RemoteMedia, "resolveOriginalUrl" | "decodeStill" | "loadOriginal">;
  currentItem: Readable<T | undefined>;
  retainedItems: Readable<readonly T[]>;
  volume: Preference<number>;
  muted: Preference<boolean>;
}

export class LightboxStage<T extends MediaItem> {
  public readonly image: Readable<ImageBitmap | undefined>;
  public readonly gif: Readable<HTMLImageElement | undefined>;
  public readonly video: Readable<HTMLVideoElement | undefined>;
  private readonly videoPool: LightboxVideoPool;
  private readonly volume: Preference<number>;
  private readonly muted: Preference<boolean>;

  constructor(configuration: LightboxStageConfiguration, dependencies: LightboxStageDependencies<T>) {
    const { remoteMedia, currentItem, retainedItems, volume, muted } = dependencies;
    const bitmapCache = new LightboxMediaCache<ImageBitmap>({ kind: "image" }, {
      load: (media, signal): Promise<ImageBitmap> => remoteMedia.decodeStill(media, signal),
      release: (bitmap): void => bitmap.close()
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
    this.image = showCurrent(bitmapCache, currentItem);
    this.gif = showCurrent(gifCache, currentItem);
    this.video = showCurrent(videoCache, currentItem);
    effect(() => bitmapCache.retain(retainedItems.value));
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
      bitmapCache.dispose();
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

function showCurrent<V>(cache: LightboxMediaCache<V>, currentItem: Readable<MediaItem | undefined>): Readable<V | undefined> {
  return computed(() => cache.loaded.value.get(currentItem.value?.id ?? ""));
}
