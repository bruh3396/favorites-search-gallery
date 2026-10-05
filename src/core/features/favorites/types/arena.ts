import { Metric, Post } from "@/core/domain/post/post";
import { Media } from "@/core/domain/media/media";

export interface Arena {
  allocate: () => number;
  write: (slot: number, post: Post) => void;
  getNumericId: (slot: number) => number;
  getMetric: (slot: number, metric: Metric) => number;
  getMedia: (slot: number) => Media;
  getTags: (slot: number) => Set<string>;
  isNew: (slot: number) => boolean;
  cacheTags: (slot: number, tags: Set<string>) => void;
}
