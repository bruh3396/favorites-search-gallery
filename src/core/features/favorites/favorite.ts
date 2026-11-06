import { MediaItem } from "@/core/domain/media/media_item";
import { MetricSearchable } from "@/core/domain/search/searchable";

export interface Favorite extends MediaItem, MetricSearchable {
  readonly numericId: number;
  readonly isNew: boolean;
  readonly ratingBit: number;
  readonly statusBit: number;
}
