import { Metric, Post } from "@/core/domain/post/post";
import { Arena } from "@/features/favorites/types/types";
import { FavoritesPostTable } from "@/features/favorites/model/collection/post_table";
import { Media } from "@/core/domain/media/media";
import { RatingMask } from "@/types/search";
import { TagPool } from "@/core/utils/collection/tag_pool";
import { toTagSet } from "@/core/domain/tag/tag";

export class FavoritesColumnarArena implements Arena {
  public favoriteCount = 0;
  private readonly postTable = new FavoritesPostTable();
  private readonly tagPool = new TagPool();
  private readonly tagSets = new Map<number, Set<string>>();

  public get isEmpty(): boolean {
    return this.favoriteCount === 0;
  }

  public allocate(): number {
    const index = this.favoriteCount;

    this.postTable.ensureCapacity(index + 1);
    this.tagPool.ensureCapacity(index + 1);
    this.favoriteCount += 1;
    return index;
  }

  public write(index: number, post: Post): void {
    this.postTable.write(index, post);
    this.tagPool.write(index, post.tags);
  }

  public compress(): void {
    this.postTable.trim(this.favoriteCount);
    this.tagPool.trim(this.favoriteCount);
    this.tagPool.compact();
  }

  public id(index: number): number {
    return this.postTable.id(index);
  }

  public rating(index: number): RatingMask {
    return this.postTable.rating(index);
  }

  public getMetric(index: number, metric: Metric): number {
    return this.postTable.getMetric(index, metric);
  }

  public media(index: number): Media {
    return this.postTable.media(index);
  }

  public isNewFavorite(index: number): boolean {
    return this.postTable.isNewItem(index);
  }

  public markNew(index: number): void {
    this.postTable.markNew(index);
  }

  public cacheTagSet(index: number, tags: Set<string>): void {
    this.tagSets.set(index, tags);
  }

  public tagSet(index: number): Set<string> {
    return this.tagSets.get(index) ?? toTagSet(this.tagPool.read(index));
  }

  public consumeTagSet(index: number): Set<string> {
    const tags = this.tagSet(index);

    this.tagSets.delete(index);
    return tags;
  }
}
