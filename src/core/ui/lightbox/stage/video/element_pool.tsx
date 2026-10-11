import { Media } from "@/core/domain/media/media";
import { MediaItem } from "@/core/domain/post/post";
import { VideoElement } from "@/core/ui/lightbox/stage/video/element";

export class VideoElementPool {
  private readonly elements: readonly VideoElement[];
  private readonly assignments: Map<string, VideoElement>;
  private activeElement: VideoElement | undefined;

  constructor(
    private readonly capacity: number,
    resolveOriginalUrl: (media: Media) => Promise<string>
  ) {
    this.elements = Array.from({ length: capacity }, () => new VideoElement(resolveOriginalUrl));
    this.assignments = new Map<string, VideoElement>();
  }

  public get videoElements(): readonly HTMLVideoElement[] {
    return this.elements.map(video => video.root);
  }

  public update(current: MediaItem | undefined, neighbors: readonly MediaItem[]): void {
    const targets = this.chooseTargets(current, neighbors);

    this.deactivatePrevious(current);
    this.releaseUnused(targets);
    this.assignMissing(targets);
    this.activateCurrent(current);
  }

  public dispose(): void {
    for (const video of this.elements) {
      video.release();
    }
    this.assignments.clear();
    this.activeElement = undefined;
  }

  private chooseTargets(current: MediaItem | undefined, neighbors: readonly MediaItem[]): ReadonlyMap<string, MediaItem> {
    const targets = new Map<string, MediaItem>();

    if (current !== undefined) {
      targets.set(current.id, current);
    }

    for (const neighbor of neighbors) {
      if (targets.size >= this.capacity) {
        break;
      }

      if (!targets.has(neighbor.id)) {
        targets.set(neighbor.id, neighbor);
      }
    }
    return targets;
  }

  private deactivatePrevious(current: MediaItem | undefined): void {
    const currentAssignment = this.getAssignment(current);

    if (this.activeElement !== currentAssignment) {
      this.activeElement?.deactivate();
      this.activeElement = undefined;
    }
  }

  private releaseUnused(targets: ReadonlyMap<string, MediaItem>): void {
    for (const [id, video] of this.assignments) {
      if (!targets.has(id)) {
        video.release();
        this.assignments.delete(id);
      }
    }
  }

  private assignMissing(targets: ReadonlyMap<string, MediaItem>): void {
    const occupiedElements = new Set(this.assignments.values());
    const freeElements = this.elements.filter(video => !occupiedElements.has(video));

    for (const [id, item] of targets) {
      if (this.assignments.has(id)) {
        continue;
      }

      const video = freeElements.shift();

      if (video === undefined) {
        break;
      }

      this.assignments.set(id, video);
      video.assign(item.media);
    }
  }

  private activateCurrent(current: MediaItem | undefined): void {
    const currentAssignment = this.getAssignment(current);

    if (this.activeElement !== currentAssignment) {
      this.activeElement = currentAssignment;
      currentAssignment?.activate();
    }
  }

  private getAssignment(item: MediaItem | undefined): VideoElement | undefined {
    return item === undefined ? undefined : this.assignments.get(item.id);
  }
}
