import { EMPTY_FRAME, FIT_VIEW, ZoomFrame, ZoomView } from "@/core/features/lightbox/zoom/zoom";
import { Media, MediaKind } from "@/core/domain/media/media";
import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { GifRenderer } from "@/core/features/lightbox/ui/stage/gif/renderer";
import { ImageRenderer } from "@/core/features/lightbox/ui/stage/image/renderer";
import { LightboxStageRenderer } from "@/core/features/lightbox/ui/stage/renderer";
import { MediaItem } from "@/core/domain/post/post";
import { MorphSource } from "@/core/boundary/ports/morpher/morpher";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { VideoRenderer } from "@/core/features/lightbox/ui/stage/video/renderer";
import { h } from "@/core/ui/h/h";

export const LightboxStageClass = {
  root: "fsg-LightboxStage"
} as const;

export interface LightboxStageConfiguration {
  readonly maxNeighborsPerKind: number;
}

export interface LightboxStageDependencies {
  current: Readable<MediaItem | undefined>;
  neighbors: Readable<readonly MediaItem[]>;
  warmItems: Readable<readonly MediaItem[]>;
  remoteMedia: Pick<RemoteMedia, "resolvePreviewUrl" | "resolveOriginalUrl" | "decodeOriginal">;
  scheduler: Pick<Scheduler, "schedule">;
  sizeObserver: SizeObserver;
}

export const DEFAULT_LIGHTBOX_STAGE_CONFIGURATION: LightboxStageConfiguration = { maxNeighborsPerKind: 15 };

// Media load events don't bubble, so only capturing listeners hear them.
const MEDIA_SIZE_EVENTS = ["load", "loadedmetadata"] as const;

export class LightboxStage {
  public readonly root: HTMLElement;
  private readonly renderersByKind: Map<MediaKind, LightboxStageRenderer>;
  private readonly frameState = new Signal<ZoomFrame>(EMPTY_FRAME);
  private readonly stopEffects: ReadonlyArray<() => void>;
  private readonly stopObservingSize: () => void;
  private activeRenderer: LightboxStageRenderer | undefined;
  private shownScale = 1;

  constructor(private readonly configuration: LightboxStageConfiguration, dependencies: LightboxStageDependencies) {
    const { current, neighbors, warmItems, remoteMedia, scheduler, sizeObserver } = dependencies;
    const resolvePreviewUrl = (media: Media): Promise<string> => remoteMedia.resolvePreviewUrl(media);
    const resolveOriginalUrl = (media: Media): Promise<string> => remoteMedia.resolveOriginalUrl(media);
    const decodeOriginal = (media: Media, signal: AbortSignal): Promise<ImageBitmap> => remoteMedia.decodeOriginal(media, signal);
    const measureShownMedia = (): void => this.measureShownMedia();

    this.renderersByKind = new Map<MediaKind, LightboxStageRenderer>([
      ["image", new ImageRenderer({ resolvePreviewUrl, decodeOriginal, scheduler, onShownMediaChange: measureShownMedia })],
      ["gif", new GifRenderer({ resolveOriginalUrl })],
      ["video", new VideoRenderer({ resolveOriginalUrl, scheduler })]
    ]);
    this.root = <div className={LightboxStageClass.root}>{this.renderers.map(renderer => renderer.root)}</div>;
    MEDIA_SIZE_EVENTS.forEach(type => this.root.addEventListener(type, measureShownMedia, true));
    this.stopObservingSize = sizeObserver.observe(this.root, ({ width, height }) => this.updateFrame({ width, height }));
    this.stopEffects = [
      effect(() => this.show(current.value)),
      effect(() => this.updateNeighbors([...warmItems.value, ...neighbors.value], current.peek()))
    ];
  }

  public get shownMedia(): MorphSource | undefined {
    return this.activeRenderer?.shownMedia;
  }

  public get frame(): Readable<ZoomFrame> {
    return this.frameState;
  }

  private get renderers(): readonly LightboxStageRenderer[] {
    return [...this.renderersByKind.values()];
  }

  // A boolean here directly describes the state being applied to the view.
  // eslint-disable-next-line no-restricted-syntax
  public showZoomView(view: ZoomView, glides: boolean): void {
    const previousScale = this.shownScale;

    this.shownScale = view.scale;
    this.root.dataset.zoomMotion = glides && view.scale !== previousScale ? "glide" : "instant";
    this.root.style.transform = view === FIT_VIEW ? "" : `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  }

  public dispose(): void {
    this.stopObservingSize();
    this.stopEffects.forEach(stop => stop());
    this.renderers.forEach(renderer => renderer.dispose());
  }

  private show(item: MediaItem | undefined): void {
    const nextRenderer = item === undefined ? undefined : this.renderersByKind.get(item.media.kind);

    this.shownScale = 1;
    this.root.dataset.zoomMotion = "instant";
    this.root.style.transform = "";

    if (this.activeRenderer !== nextRenderer) {
      this.activeRenderer?.clear();
      this.activeRenderer = nextRenderer;
    }

    if (item !== undefined) {
      nextRenderer!.show(item);
    }
    this.measureShownMedia();
  }

  private measureShownMedia(): void {
    const [mediaWidth, mediaHeight] = readNaturalSize(this.shownMedia);

    this.updateFrame({ mediaWidth, mediaHeight });
  }

  private updateFrame(change: Partial<ZoomFrame>): void {
    const previous = this.frameState.peek();
    const next = { ...previous, ...change };

    if (next.width !== previous.width || next.height !== previous.height ||
      next.mediaWidth !== previous.mediaWidth || next.mediaHeight !== previous.mediaHeight) {
      this.frameState.value = next;
    }
  }

  private updateNeighbors(neighbors: readonly MediaItem[], current: MediaItem | undefined): void {
    this.renderersByKind.forEach((renderer, kind) => {
      const kindNeighbors = neighbors.filter(item => item.media.kind === kind && item.id !== current?.id).slice(0, this.configuration.maxNeighborsPerKind);

      renderer.setNeighbors(kindNeighbors);
    });
  }
}

export function readNaturalSize(media: MorphSource | undefined): [width: number, height: number] {
  if (media instanceof HTMLImageElement) {
    return [media.naturalWidth, media.naturalHeight];
  }

  if (media instanceof HTMLVideoElement) {
    return [media.videoWidth, media.videoHeight];
  }
  return [media?.width ?? 0, media?.height ?? 0];
}
