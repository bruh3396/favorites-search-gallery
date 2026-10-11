import { MediaItem } from "@/core/domain/media/media";

export const LightboxRendererClass = {
  root: "fsg-LightboxRenderer",
  media: "fsg-LightboxMedia"
} as const;

export interface LightboxStageRenderer {
  readonly root: HTMLElement;
  show(item: MediaItem): void;
  clear(): void;
  setNeighbors(items: readonly MediaItem[]): void;
  dispose(): void;
}
