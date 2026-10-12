import { Media, MediaKind } from "@/core/domain/media/media";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { GifRenderer } from "@/core/features/lightbox/ui/stage/gif/renderer";
import { ImageRenderer } from "@/core/features/lightbox/ui/stage/image/renderer";
import { LightboxStageRenderer } from "@/core/features/lightbox/ui/stage/renderer";
import { MediaItem } from "@/core/domain/post/post";
import { MorphSource } from "@/core/boundary/ports/morpher/morpher";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
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
}

export const DEFAULT_LIGHTBOX_STAGE_CONFIGURATION: LightboxStageConfiguration = { maxNeighborsPerKind: 15 };

export class LightboxStage {
  public readonly root: HTMLElement;
  private readonly renderersByKind: Map<MediaKind, LightboxStageRenderer>;
  private readonly stopEffects: ReadonlyArray<() => void>;
  private activeRenderer: LightboxStageRenderer | undefined;

  constructor(private readonly configuration: LightboxStageConfiguration, dependencies: LightboxStageDependencies) {
    const { current, neighbors, warmItems, remoteMedia, scheduler } = dependencies;
    const resolvePreviewUrl = (media: Media): Promise<string> => remoteMedia.resolvePreviewUrl(media);
    const resolveOriginalUrl = (media: Media): Promise<string> => remoteMedia.resolveOriginalUrl(media);
    const decodeOriginal = (media: Media, signal: AbortSignal): Promise<ImageBitmap> => remoteMedia.decodeOriginal(media, signal);

    this.renderersByKind = new Map<MediaKind, LightboxStageRenderer>([
      ["image", new ImageRenderer({ resolvePreviewUrl, decodeOriginal, scheduler })],
      ["gif", new GifRenderer({ resolveOriginalUrl })],
      ["video", new VideoRenderer({ resolveOriginalUrl, scheduler })]
    ]);
    this.root = <div className={LightboxStageClass.root}>{this.renderers.map(renderer => renderer.root)}</div>;
    this.stopEffects = [
      effect(() => this.show(current.value)),
      effect(() => this.updateNeighbors([...warmItems.value, ...neighbors.value], current.peek()))
    ];
  }

  public get shownMedia(): MorphSource | undefined {
    return this.activeRenderer?.shownMedia;
  }

  private get renderers(): readonly LightboxStageRenderer[] {
    return [...this.renderersByKind.values()];
  }

  public dispose(): void {
    this.stopEffects.forEach(stop => stop());
    this.renderers.forEach(renderer => renderer.dispose());
  }

  private show(item: MediaItem | undefined): void {
    const nextRenderer = item === undefined ? undefined : this.renderersByKind.get(item.media.kind);

    if (this.activeRenderer !== nextRenderer) {
      this.activeRenderer?.clear();
      this.activeRenderer = nextRenderer;
    }

    if (item !== undefined) {
      nextRenderer!.show(item);
    }
  }

  private updateNeighbors(neighbors: readonly MediaItem[], current: MediaItem | undefined): void {
    this.renderersByKind.forEach((renderer, kind) => {
      const kindNeighbors = neighbors.filter(item => item.media.kind === kind && item.id !== current?.id).slice(0, this.configuration.maxNeighborsPerKind);

      renderer.setNeighbors(kindNeighbors);
    });
  }
}
