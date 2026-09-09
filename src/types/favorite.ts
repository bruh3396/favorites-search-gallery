import { MediaItem } from "@/types/media";
import { Metric } from "@/types/search";
import { Post } from "@/types/api";

export interface Favorite extends MediaItem {
  root: HTMLElement;
  post: Post;
  enrich: (post: Post) => void;
  setDuration: (duration: number) => void;
  getMetric: (metric: Metric) => number;
}

export type AddFavoriteStatus = "error" | "alreadyAdded" | "loggedOut" | "success";
export type RemoveFavoriteStatus = "error" | "forbidden" | "success";

export const FavoritesDrawerViewNames = ["settings", "snippets", "tags", "download", "change", "help"] as const;
export type FavoritesDrawerView = (typeof FavoritesDrawerViewNames)[number];

export type FavoritesDrawerViewContent = {
  mount?: (panel: HTMLElement) => void;
  actions?: HTMLElement[];
};

export type FavoritesDrawerViewMap = Partial<Record<FavoritesDrawerView, FavoritesDrawerViewContent>>;
