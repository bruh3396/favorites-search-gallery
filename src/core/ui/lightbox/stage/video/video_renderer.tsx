import { LightboxStageClass } from "@/core/ui/lightbox/stage/stage_class";
import { LightboxStageRenderer } from "@/core/ui/lightbox/stage/renderer";
import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { PreloadingRenderer } from "@/core/ui/lightbox/stage/preloading_renderer";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { VideoElementPool } from "@/core/ui/lightbox/stage/video/video_element_pool";
import { h } from "@/core/ui/h/h";

export interface VideoRendererDependencies {
  readonly resolveOriginalUrl: (media: Media) => Promise<string>;
  readonly scheduler: Pick<Scheduler, "schedule">;
}

const VIDEO_POOL_CAPACITY = 5;

export class VideoRenderer extends PreloadingRenderer implements LightboxStageRenderer {
  public readonly root: HTMLElement;
  private readonly pool: VideoElementPool;
  private current: MediaItem | undefined;
  private settledNeighbors: readonly MediaItem[] = [];

  constructor(dependencies: VideoRendererDependencies) {
    super(dependencies.scheduler);
    this.pool = new VideoElementPool(VIDEO_POOL_CAPACITY, dependencies.resolveOriginalUrl);
    this.root = <div className={LightboxStageClass.renderer} hidden>{this.pool.videoElements}</div>;
  }

  public show(item: MediaItem): void {
    this.current = item;
    this.updatePool();
  }

  public clear(): void {
    this.current = undefined;
    this.updatePool();
  }

  public override setNeighbors(items: readonly MediaItem[]): void {
    super.setNeighbors(items);
    const neighborIds = new Set(items.map(item => item.id));

    this.settledNeighbors = this.settledNeighbors.filter(item => neighborIds.has(item.id));
    this.updatePool();
  }

  public dispose(): void {
    this.disposePreloading();
    this.pool.dispose();
    this.current = undefined;
    this.settledNeighbors = [];
    this.root.hidden = true;
  }

  protected override preloadNeighbors(items: readonly MediaItem[]): void {
    this.settledNeighbors = items;
    this.updatePool();
  }

  private updatePool(): void {
    this.pool.update(this.current, this.settledNeighbors);
    this.root.hidden = this.current === undefined;
  }
}
