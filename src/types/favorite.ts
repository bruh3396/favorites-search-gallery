import { Post } from "@/core/domain/post/post";
import { Metric, Rating, Searchable } from "@/types/search";
import { MediaItem } from "@/types/media";

export interface Favorite extends MediaItem, Searchable {
  rating: Rating;
  post: Post;
  tags: Set<string>;
  isNew: boolean;
  pixelCount: number;
  markAsNew: () => void;
  enrich: (post: Post) => void;
  setDuration: (duration: number) => void;
  consumeTags: () => Set<string>;
  getMetric: (metric: Metric) => number;
}
