import { MetricSearchable } from "@/core/search/searchable";
import { PostMedia } from "@/core/domain/post/post";

export interface Favorite extends PostMedia, MetricSearchable {
  readonly isNew: boolean;
}
