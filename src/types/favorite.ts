import { Metric, MediaItem } from "@/core/domain/post/post";
import { Searchable } from "@/core/search/searchable";

export interface Favorite extends MediaItem, Searchable {
  tags: Set<string>;
  isNew: boolean;
  getMetric: (metric: Metric) => number;
}
