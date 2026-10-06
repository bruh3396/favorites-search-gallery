import { LightboxDependencies, LightboxIntents } from "@/core/features/lightbox/types/lightbox";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";

export type LightboxNavigationFlowDependencies = Pick<LightboxDependencies, "mediaSequence">;

export class LightboxNavigationFlow implements LightboxIntents {
  private readonly currentPost = new Signal<MediaItem | undefined>(undefined);
  private readonly isOpenState = computed(() => this.currentPost.value !== undefined);

  constructor(private readonly dependencies: LightboxNavigationFlowDependencies) { }

  public get isOpen(): Readable<boolean> {
    return this.isOpenState;
  }

  public get current(): Readable<MediaItem | undefined> {
    return this.currentPost;
  }

  public open(post: MediaItem): void {
    this.currentPost.value = post;
  }

  public close(): void {
    this.currentPost.value = undefined;
  }

  public showNext(): Promise<void> {
    return this.showNeighbor(current => this.dependencies.mediaSequence.findNext(current));
  }

  public showPrevious(): Promise<void> {
    return this.showNeighbor(current => this.dependencies.mediaSequence.findPrevious(current));
  }

  private async showNeighbor(findNeighbor: (current: MediaItem) => Promise<MediaItem | undefined>): Promise<void> {
    const current = this.currentPost.peek();

    if (current === undefined) {
      return;
    }
    const neighbor = await findNeighbor(current);

    if (neighbor !== undefined && this.currentPost.peek() === current) {
      this.currentPost.value = neighbor;
    }
  }
}
