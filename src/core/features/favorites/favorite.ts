import { MediaItem } from "@/core/domain/post/post";
import { MetricSearchable } from "@/core/domain/search/searchable";

export interface Favorite extends MediaItem, MetricSearchable {
  readonly numericId: number;
  readonly isNew: boolean;
  readonly ratingBit: number;
}
