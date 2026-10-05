import { GalleryAction, Layout } from "@/types/app";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { MediaItem } from "@/core/domain/post/post";
import { Preference } from "@/lib/storage/preference";

export type Resolution = "3840x2160" | "7680x4320" | "1920x1080";

export type BudgetedRequests = {
  accepted: ImageRequest[];
  rejected: ImageRequest[];
};

export interface ImageBudgeter {
  partition: (items: MediaItem[]) => BudgetedRequests;
}

export interface ImageFetcher {
  fetchBitmap: (request: ImageRequest) => Promise<boolean>;
  cancelFetch: (id: string) => void;
}

export interface Renderer {
  root: HTMLElement;
  render: (item: MediaItem) => void;
  hide: () => void;
  cache: (items: MediaItem[]) => Promise<void> | void;
}

export type VideoClip = {
  start: number;
  end: number;
};

export interface GallerySizeSettings {
  layout: Preference<Layout>;
  columnCount: Preference<number>;
  rowHeight: Preference<number>;
  upscaleQuality: Preference<number>;
}

export interface GalleryReleasableCanvas {
  clear: () => void;
}

export interface GalleryWarmTarget {
  cacheImages: (items: MediaItem[]) => Promise<void>;
  upscale: (items: MediaItem[]) => Promise<void>;
}

export interface GalleryFollowTarget {
  scrollToThumb: (id: string) => void;
}

export interface GalleryBudget {
  upscale: { paintDelay: number; canvasWidth: number };
  releaseCanvas: (canvas: GalleryReleasableCanvas) => void;
  warm: (target: GalleryWarmTarget, items: MediaItem[]) => Promise<void>;
  follow: (target: GalleryFollowTarget, id: string) => void;
}

export interface GalleryViewDependencies {
  onVideoEnded: () => void;
  onVolumeChanged: (volume: number) => void;
}

export type GalleryMenuButton = {
  id: string;
  icon: string;
  action: GalleryAction;
  enabled: boolean;
  tooltip: string;
  color: string;
  href?: string;
};
