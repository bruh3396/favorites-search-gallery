import { Metric, Rating, Searchable } from "@/types/search";
import { Post, PostMedia } from "@/core/domain/post/post";

export interface Favorite extends PostMedia, Searchable {
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
