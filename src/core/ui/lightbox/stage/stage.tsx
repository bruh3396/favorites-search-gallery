import { Media, MediaKind } from "@/core/domain/media/media";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { BitmapDecoder } from "@/core/boundary/ports/bitmap_decoder/bitmap_decoder";
import { GifRenderer } from "@/core/ui/lightbox/stage/gif_renderer";
import { ImageRenderer } from "@/core/ui/lightbox/stage/image_renderer";
import { LightboxStageClass } from "@/core/ui/lightbox/stage/stage_class";
import { LightboxStageRenderer } from "@/core/ui/lightbox/stage/renderer";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { VideoRenderer } from "@/core/ui/lightbox/stage/video/video_renderer";
import { h } from "@/core/ui/h/h";
import { onCleanup } from "@/core/utils/reactive/scope";

export interface LightboxStageProps {
  readonly current: Readable<MediaItem | undefined>;
  readonly neighbors: Readable<readonly MediaItem[]>;
  readonly resolvePreviewUrl: (media: Media) => Promise<string>;
  readonly resolveOriginalUrl: (media: Media) => Promise<string>;
  readonly resolveOriginalImageFallbackUrl: (media: Media) => Promise<string>;
  readonly fetchOriginal: (media: Media, signal: AbortSignal) => Promise<Blob>;
  readonly bitmapDecoder: BitmapDecoder;
  readonly scheduler: Pick<Scheduler, "schedule">;
}

type LightboxStageControllerDependencies = Omit<LightboxStageProps, "current" | "neighbors">;

const NEIGHBOR_LIMIT = 20;

export function LightboxStage(props: LightboxStageProps): HTMLElement {
  const { current, neighbors, ...dependencies } = props;
  const controller = new LightboxStageController(dependencies);
  const stopShowEffect = effect(() => controller.show(current.value));
  const stopNeighborsEffect = effect(() => controller.updateNeighbors(neighbors.value, current.peek()));

  onCleanup(() => {
    stopShowEffect();
    stopNeighborsEffect();
    controller.dispose();
  });
  return controller.root;
}

class LightboxStageController {
  public readonly root: HTMLElement;
  private readonly renderersByKind: Map<MediaKind, LightboxStageRenderer>;
  private activeRenderer: LightboxStageRenderer | undefined;

  constructor(dependencies: LightboxStageControllerDependencies) {
    const { resolvePreviewUrl, resolveOriginalUrl, resolveOriginalImageFallbackUrl, fetchOriginal, bitmapDecoder, scheduler } = dependencies;
    const imageRenderer = new ImageRenderer({
      resolvePreviewUrl,
      resolveOriginalImageFallbackUrl,
      fetchOriginal,
      bitmapDecoder,
      scheduler
    });
    const gifRenderer = new GifRenderer({ resolveOriginalUrl });
    const videoRenderer = new VideoRenderer({ resolveOriginalUrl, scheduler });

    this.renderersByKind = new Map<MediaKind, LightboxStageRenderer>([
      ["image", imageRenderer],
      ["gif", gifRenderer],
      ["video", videoRenderer]
    ]);
    this.root = <div className={LightboxStageClass.root}>{this.renderers.map(renderer => renderer.root)}</div>;
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
      const kindNeighbors = neighbors.filter(item => item.media.kind === kind && item.id !== current?.id).slice(0, NEIGHBOR_LIMIT);

      renderer.setNeighbors(kindNeighbors);
    });
  }

  public dispose(): void {
    this.renderers.forEach(renderer => renderer.dispose());
  }
}
