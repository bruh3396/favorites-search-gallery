import { MediaItem } from "@/types/media";

export interface Navigation {
  postUrl: (id: string) => string;
  openPost: (id: string) => void;
  openMedia: (item: MediaItem) => void;
  openSearch: (query: string) => void;
}
