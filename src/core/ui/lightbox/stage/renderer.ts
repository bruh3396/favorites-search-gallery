import { MediaItem } from "@/core/domain/post/post";

export interface LightboxStageRenderer {
  readonly root: HTMLElement;
  show(item: MediaItem): void;
  clear(): void;
  setNeighbors(items: readonly MediaItem[]): void;
  dispose(): void;
}
