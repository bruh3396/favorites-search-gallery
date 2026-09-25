import { Metric, Rating, Searchable } from "@/types/search";
import { MediaItem } from "@/types/media";
import { Post } from "@/types/api";

export interface Favorite extends MediaItem, Searchable {
  rating: Rating;
  post: Post;
  tags: Set<string>;
  isNew: boolean;
  markAsNew: () => void;
  enrich: (post: Post) => void;
  setDuration: (duration: number) => void;
  consumeTags: () => Set<string>;
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
