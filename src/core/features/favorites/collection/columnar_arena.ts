import { Metric, Post } from "@/core/domain/post/post";
import { FavoritesPostTable } from "@/core/features/favorites/collection/post_table";
import { Media } from "@/core/domain/media/media";
import { TagPool } from "@/core/utils/collection/tag_pool";

export class FavoritesColumnarArena {
  private count = 0;
  private readonly postTable = new FavoritesPostTable();
  private readonly tagPool = new TagPool();
  private readonly newSlots = new Set<number>();

  public allocate(): number {
    const slot = this.count;

    this.count += 1;
    return slot;
  }

  public write(slot: number, post: Post): void {
    this.postTable.write(slot, post);
    this.tagPool.write(slot, post.tags.split(" "));
  }

  public compact(): void {
    this.postTable.trim(this.count);
    this.tagPool.trim(this.count);
    this.tagPool.compact();
  }

  public getPost(slot: number): Post {
    return { ...this.postTable.getTaglessPost(slot), tags: this.tagPool.read(slot).join(" ") };
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

  public getTags(slot: number): ReadonlySet<string> {
    const tags = new Set(this.tagPool.read(slot));

    tags.delete("");
    return tags;
  }

  public isNew(slot: number): boolean {
    return this.newSlots.has(slot);
  }

  public markNew(slot: number): void {
    this.newSlots.add(slot);
  }
}
