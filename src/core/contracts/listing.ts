import { MediaItem, Post } from "@/core/domain/post/post";
import { Readable } from "@/core/utils/reactive/signal";

export type Direction = "forward" | "backward";

export interface Listing {
  readonly posts: Readable<readonly MediaItem[]>;
  readonly query: Readable<string>;
  findPost: (id: string) => Post | undefined;
  advance: (direction: Direction) => Promise<boolean>;
}
