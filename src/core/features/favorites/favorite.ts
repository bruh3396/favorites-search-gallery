import { MediaItem } from "@/core/domain/post/post";
import { MetricSearchable } from "@/core/search/searchable";

export interface Favorite extends MediaItem, MetricSearchable {
  readonly isNew: boolean;
  readonly ratingBit: number;
}
