import { MediaItem } from "@/core/domain/media/media";
import { MetricSearchable } from "@/core/search/searchable";

export interface Favorite extends MediaItem, MetricSearchable {
  readonly numericId: number;
  readonly isNew: boolean;
  readonly ratingBit: number;
}
