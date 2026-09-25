import { MediaExtension, MediaType } from "@/types/media";
import { Metric, Rating } from "@/types/search";
import { FavoritesArena } from "@/features/favorites/types/types";
import { FavoritesPostTable } from "@/features/favorites/model/collection/post_table";
import { Post } from "@/types/api";
import { TagPool } from "@/lib/collection/tag_pool";
import { resolveMediaType } from "@/lib/media/media_type";
import { toTagSet } from "@/utils/pure/tag";

export class FavoritesColumnarArena implements FavoritesArena {
  public favoriteCount = 0;
  private readonly postTable = new FavoritesPostTable();
  private readonly tagPool = new TagPool();
  private readonly tagSets = new Map<number, Set<string>>();

  public allocate(): number {
    const index = this.favoriteCount;

    this.postTable.ensureCapacity(index + 1);
    this.tagPool.ensureCapacity(index + 1);
    this.favoriteCount += 1;
    return index;
  }

  public write(index: number, post: Post): void {
    this.postTable.write(index, post);
    this.tagPool.store(index, post.tags);
  }

  public compress(): void {
    this.postTable.trim(this.favoriteCount);
    this.tagPool.trim(this.favoriteCount);
    this.tagPool.compress();
  }

  public id(index: number): number {
    return this.postTable.id(index);
  }

  public rating(index: number): Rating {
    return this.postTable.rating(index);
  }

  public getMetric(index: number, metric: Metric): number {
    return this.postTable.getMetric(index, metric);
  }

  public extension(index: number): MediaExtension | undefined {
    return this.postTable.extension(index);
  }

  public isNewFavorite(index: number): boolean {
    return this.postTable.isNewItem(index);
  }

  public markNew(index: number): void {
    this.postTable.markNew(index);
  }

  public previewUrl(index: number): string {
    return this.postTable.previewUrl(index);
  }

  public setDuration(index: number, duration: number): void {
    this.postTable.setDuration(index, duration);
  }

  public cacheTagSet(index: number, tags: Set<string>): void {
    this.tagSets.set(index, tags);
  }

  public tagSet(index: number): Set<string> {
    return this.tagSets.get(index) ?? toTagSet(this.tagPool.load(index));
  }

  public consumeTagSet(index: number): Set<string> {
    const tags = this.tagSet(index);

    this.tagSets.delete(index);
    return tags;
  }

  public mediaType(index: number): MediaType {
    return resolveMediaType(this.tagSet(index));
  }

  public toPost(index: number): Post {
    return this.postTable.toPost(index, this.tagPool.load(index));
  }
}
