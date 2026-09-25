import { GalleryMenuAction, Layout } from "@/types/app";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { MediaItem } from "@/types/media";
import { Preference } from "@/lib/storage/preference";

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

export interface GalleryViewDependencies {
  onMenuAction: (action: GalleryMenuAction) => void;
  onVideoEnded: () => void;
  onVideoDoubleClicked: (event: MouseEvent) => void;
  onVolumeChanged: (volume: number) => void;
}

export type GalleryMenuButton = {
  id: string;
  icon: string;
  action: GalleryMenuAction;
  enabled: boolean;
  tooltip: string;
  color: string;
  href?: string;
};
