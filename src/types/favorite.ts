import { Metric, Searchable } from "@/types/search";
import { MediaItem } from "@/types/media";
import { Post } from "@/types/api";

export interface Favorite extends MediaItem, Searchable {
  root: HTMLElement;
  post: Post;
  tags: Set<string>;
  enrich: (post: Post) => void;
  setDuration: (duration: number) => void;
  getMetric: (metric: Metric) => number;
  releaseTags: () => void;
  readonly tagsReleased: boolean;
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
