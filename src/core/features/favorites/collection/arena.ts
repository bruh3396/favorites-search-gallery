import { Metric, Post } from "@/core/domain/post/post";
import { Media } from "@/core/domain/media/media";

export interface FavoritesArena {
  allocate: () => number;
  write: (slot: number, post: Post) => void;
  getNumericId: (slot: number) => number;
  getMetric: (slot: number, metric: Metric) => number;
  getMedia: (slot: number) => Media;
  getTags: (slot: number) => ReadonlySet<string>;
  isNew: (slot: number) => boolean;
  getRatingBit: (slot: number) => number;
  cacheTags: (slot: number, tags: ReadonlySet<string>) => void;
}
