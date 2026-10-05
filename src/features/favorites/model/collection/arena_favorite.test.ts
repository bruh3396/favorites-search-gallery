import { Metric } from "@/core/domain/post/post";
import { RatingMask } from "@/types/search";
import { describe, expect, test } from "vitest";
import { Arena } from "@/features/favorites/types/types";
import { ArenaFavorite } from "@/features/favorites/model/collection/arena_favorite";
import { FavoritesColumnarArena } from "@/features/favorites/model/collection/favorites_columnar_arena";
import { Media } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";
import { createPost } from "@/testing/post";
import { toTagSet } from "@/core/domain/tag/tag";

interface Slot {
  post: Post;
  written: boolean;
  cachedTags?: Set<string>;
  isNew: boolean;
}

class TestArena implements Arena {
  public nextIndex = 0;
  public lastIndex = -1;
  private readonly slots = new Map<number, Slot>();

  public slot(index: number): Slot {
    const slot = this.slots.get(index);

    if (slot === undefined) {
      throw new Error(`no slot allocated at index ${index}`);
    }
    return slot;
  }

  public allocate(): number {
    const index = this.nextIndex;

    this.nextIndex += 1;
    this.slots.set(index, { post: createPost({}), written: false, isNew: false });
    return index;
  }

  public write(index: number, value: Post): void {
    const slot = this.slot(index);

    slot.post = value;
    slot.written = true;
    this.lastIndex = index;
  }

  public id(index: number): number {
    this.lastIndex = index;
    return parseInt(this.slot(index).post.id, 10);
  }

  public rating(index: number): RatingMask {
    this.lastIndex = index;
    return this.slot(index).post.rating === "safe" ? 1 : 4;
  }

  public getMetric(index: number, metric: Metric): number {
    this.lastIndex = index;
    const { post: value } = this.slot(index);

    switch (metric) {
      case "score":
        return value.score;
      case "duration":
        return value.durationSeconds ?? 0;
      default:
        return 0;
    }
  }

  public media(index: number): Media {
    this.lastIndex = index;
    return this.slot(index).post.media;
  }

  public isNewFavorite(index: number): boolean {
    this.lastIndex = index;
    return this.slot(index).isNew;
  }

  public markNew(index: number): void {
    this.lastIndex = index;
    this.slot(index).isNew = true;
  }

  public cacheTagSet(index: number, tags: Set<string>): void {
    this.lastIndex = index;
    this.slot(index).cachedTags = tags;
  }

  public tagSet(index: number): Set<string> {
    this.lastIndex = index;
    return this.slot(index).cachedTags ?? toTagSet(this.slot(index).post.tags);
  }

  public consumeTagSet(index: number): Set<string> {
    const tags = this.tagSet(index);

    this.slot(index).cachedTags = undefined;
    return tags;
  }
}

describe("ArenaFavorite", () => {
  test("allocates its own slot and writes the post on construction", () => {
    const arena = new TestArena();
    const item = new ArenaFavorite(createPost({ id: "42", tags: "apple banana" }), arena, false);

    expect(arena.slot(0).written).toBe(true);
    expect(item.id).toBe("42");
    expect(item.tags).toEqual(new Set(["apple", "banana"]));
  });

  test("reads every field from its own allocated slot", () => {
    const arena = new TestArena();

    arena.nextIndex = 3;

    const item = new ArenaFavorite(createPost({ id: "7", tags: "a", score: 99 }), arena, false);

    expect(item.id).toBe("7");
    expect(item.index).toBe(3);
    expect(item.tags).toEqual(new Set(["a"]));
    expect(item.getMetric("score")).toBe(99);
    expect(item.getMetric("width")).toBe(0);
    expect(item.isNew).toBe(false);
    expect(arena.lastIndex).toBe(3);
  });

  test("caches the tag set when tags are clean", () => {
    const arena = new TestArena();

    new ArenaFavorite(createPost({ id: "1", tags: "clean tags" }), arena, true);

    expect(arena.slot(0).cachedTags).toEqual(new Set(["clean", "tags"]));
  });

  test("does not cache the tag set when tags are dirty", () => {
    const arena = new TestArena();

    new ArenaFavorite(createPost({ id: "1", tags: "dirty tags" }), arena, false);

    expect(arena.slot(0).cachedTags).toBeUndefined();
  });

  test("keeps distinct items on independent slots", () => {
    const arena = new TestArena();

    const first = new ArenaFavorite(createPost({ id: "10", tags: "one" }), arena, false);
    const second = new ArenaFavorite(createPost({ id: "20", tags: "two" }), arena, false);

    expect(first.id).toBe("10");
    expect(second.id).toBe("20");
    expect(first.tags).toEqual(new Set(["one"]));
    expect(second.tags).toEqual(new Set(["two"]));
  });

  test("round-trips fields and tags through a real arena", () => {
    const arena = new FavoritesColumnarArena();
    const item0 = new ArenaFavorite(createPost({ id: "42", tags: "apple banana", score: 99, durationSeconds: 123 }), arena, true);
    const item1 = new ArenaFavorite(createPost({ id: "103", tags: "apple banana cherry", score: 3, height: 1_920, width: 1_080 }), arena, true);

    expect(item0.id).toBe("42");
    expect(item0.getMetric("score")).toBe(99);
    expect(item0.getMetric("duration")).toBe(123);
    expect(item0.tags).toEqual(new Set(["apple", "banana"]));

    expect(item1.id).toBe("103");
    expect(item1.getMetric("score")).toBe(3);
    expect(item1.getMetric("width")).toBe(1_080);
    expect(item1.getMetric("height")).toBe(1_920);
    expect(item1.getMetric("duration")).toBe(0);
    expect(item1.tags).toEqual(new Set(["apple", "banana", "cherry"]));
  });

  test("reads the media from a real arena", () => {
    const arena = new FavoritesColumnarArena();
    const item = new ArenaFavorite(createPost({ id: "1", tags: "cat", media: { kind: "video", locator: "12/abc123.mp4" } }), arena, true);

    expect(item.media).toEqual({ kind: "video", locator: "12/abc123.mp4" });
  });
});
