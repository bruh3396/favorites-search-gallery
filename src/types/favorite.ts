import { Metric, PostMedia } from "@/core/domain/post/post";
import { Searchable } from "@/core/search/searchable";

export interface Favorite extends PostMedia, Searchable {
  tags: Set<string>;
  isNew: boolean;
  getMetric: (metric: Metric) => number;
}
