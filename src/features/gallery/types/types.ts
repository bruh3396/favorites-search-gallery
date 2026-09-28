import { GalleryAction, Layout } from "@/types/app";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { PostMedia } from "@/core/domain/post/post";
import { Preference } from "@/lib/storage/preference";

export type Resolution = "3840x2160" | "7680x4320" | "1920x1080";

export type BudgetedRequests = {
  accepted: ImageRequest[];
  rejected: ImageRequest[];
};

export interface ImageBudgeter {
  partition: (items: PostMedia[]) => BudgetedRequests;
}

export interface ImageFetcher {
  fetchBitmap: (request: ImageRequest) => Promise<boolean>;
  cancelFetch: (id: string) => void;
}

export interface Renderer {
  root: HTMLElement;
  render: (item: PostMedia) => void;
  hide: () => void;
  cache: (items: PostMedia[]) => Promise<void> | void;
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
