import { Metric, Post } from "@/core/domain/post/post";
import { Arena } from "@/core/features/favorites/types/arena";
import { FavoritesPostTable } from "@/core/features/favorites/model/collection/post_table";
import { Media } from "@/core/domain/media/media";
import { TagPool } from "@/core/utils/collection/tag_pool";
import { toTagSet } from "@/core/domain/tag/tag";

export class FavoritesColumnarArena implements Arena {
  private favoriteCount = 0;
  private readonly postTable = new FavoritesPostTable();
  private readonly tagPool = new TagPool();
  private readonly cachedTags = new Map<number, Set<string>>();
  private readonly newSlots = new Set<number>();

  public allocate(): number {
    const slot = this.favoriteCount;

    this.postTable.ensureCapacity(slot + 1);
    this.tagPool.ensureCapacity(slot + 1);
    this.favoriteCount += 1;
    return slot;
  }

  public write(slot: number, post: Post): void {
    this.postTable.write(slot, post);
    this.tagPool.write(slot, post.tags);
    this.cachedTags.delete(slot);
  }

  public compact(): void {
    this.postTable.trim(this.favoriteCount);
    this.tagPool.trim(this.favoriteCount);
    this.tagPool.compact();
    this.cachedTags.clear();
  }

  public getPost(slot: number): Post {
    return { ...this.postTable.getTaglessPost(slot), tags: this.tagPool.read(slot) };
  }

  public getNumericId(slot: number): number {
    return this.postTable.getNumericId(slot);
  }

  public getRatingBit(slot: number): number {
    return this.postTable.getRatingBit(slot);
  }

  public getMetric(slot: number, metric: Metric): number {
    return this.postTable.getMetric(slot, metric);
  }

  public getMedia(slot: number): Media {
    return this.postTable.getMedia(slot);
  }

  public getTags(slot: number): Set<string> {
    return this.cachedTags.get(slot) ?? toTagSet(this.tagPool.read(slot));
  }

  public isNew(slot: number): boolean {
    return this.newSlots.has(slot);
  }

  public markNew(slot: number): void {
    this.newSlots.add(slot);
  }

  public cacheTags(slot: number, tags: Set<string>): void {
    this.cachedTags.set(slot, tags);
  }

  public clearTagCache(): void {
    this.cachedTags.clear();
  }
}
