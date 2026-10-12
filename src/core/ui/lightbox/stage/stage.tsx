import { Media, MediaKind } from "@/core/domain/media/media";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { GifRenderer } from "@/core/ui/lightbox/stage/gif/renderer";
import { ImageRenderer } from "@/core/ui/lightbox/stage/image/renderer";
import { LightboxStageRenderer } from "@/core/ui/lightbox/stage/renderer";
import { MediaItem } from "@/core/domain/post/post";
import { MorphSource } from "@/core/boundary/ports/morpher/morpher";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { VideoRenderer } from "@/core/ui/lightbox/stage/video/renderer";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export const LightboxStageClass = {
  root: "fsg-LightboxStage"
} as const;

export interface LightboxStageProps {
  current: Readable<MediaItem | undefined>;
  neighbors: Readable<readonly MediaItem[]>;
  warmItems: Readable<readonly MediaItem[]>;
  resolvePreviewUrl: (media: Media) => Promise<string>;
  resolveOriginalUrl: (media: Media) => Promise<string>;
  decodeOriginal: (media: Media, signal: AbortSignal) => Promise<ImageBitmap>;
  scheduler: Pick<Scheduler, "schedule">;
  exposeShownMedia: (readShownMedia: () => MorphSource | undefined) => void;
}

export interface LightboxStageControllerConfiguration {
  readonly neighborLimit: number;
}

export type LightboxStageControllerDependencies = Omit<LightboxStageProps, "current" | "neighbors" | "warmItems" | "exposeShownMedia">;

const NEIGHBOR_LIMIT = 15;

export function LightboxStage(props: LightboxStageProps): HTMLElement {
  const { current, neighbors, warmItems, exposeShownMedia, ...dependencies } = props;
  const controller = new LightboxStageController({ neighborLimit: NEIGHBOR_LIMIT }, dependencies);

  exposeShownMedia(() => controller.shownMedia);
  const stopShowEffect = effect(() => controller.show(current.value));
  const stopNeighborsEffect = effect(() => controller.updateNeighbors([...warmItems.value, ...neighbors.value], current.peek()));

  onCleanup(() => {
    stopShowEffect();
    stopNeighborsEffect();
    controller.dispose();
  });
  return controller.root;
}

export class LightboxStageController {
  public readonly root: HTMLElement;
  private readonly renderersByKind: Map<MediaKind, LightboxStageRenderer>;
  private activeRenderer: LightboxStageRenderer | undefined;

  constructor(private readonly configuration: LightboxStageControllerConfiguration, dependencies: LightboxStageControllerDependencies) {
    const { resolvePreviewUrl, resolveOriginalUrl, decodeOriginal, scheduler } = dependencies;
    const imageRenderer = new ImageRenderer({ resolvePreviewUrl, decodeOriginal, scheduler });
    const gifRenderer = new GifRenderer({ resolveOriginalUrl });
    const videoRenderer = new VideoRenderer({ resolveOriginalUrl, scheduler });

    this.renderersByKind = new Map<MediaKind, LightboxStageRenderer>([
      ["image", imageRenderer],
      ["gif", gifRenderer],
      ["video", videoRenderer]
    ]);
    this.root = <div className={LightboxStageClass.root}>{this.renderers.map(renderer => renderer.root)}</div>;
  }

  public get shownMedia(): MorphSource | undefined {
    return this.activeRenderer?.shownMedia;
  }

  private get renderers(): readonly LightboxStageRenderer[] {
    return [...this.renderersByKind.values()];
  }

  public show(item: MediaItem | undefined): void {
    const nextRenderer = item === undefined ? undefined : this.renderersByKind.get(item.media.kind);

    if (this.activeRenderer !== nextRenderer) {
      this.activeRenderer?.clear();
      this.activeRenderer = nextRenderer;
    }

    if (item !== undefined) {
      nextRenderer!.show(item);
    }
  }

  public updateNeighbors(neighbors: readonly MediaItem[], current: MediaItem | undefined): void {
    this.renderersByKind.forEach((renderer, kind) => {
      const kindNeighbors = neighbors.filter(item => item.media.kind === kind && item.id !== current?.id).slice(0, this.configuration.neighborLimit);

      renderer.setNeighbors(kindNeighbors);
    });
  }

  public dispose(): void {
    this.renderers.forEach(renderer => renderer.dispose());
  }
}
