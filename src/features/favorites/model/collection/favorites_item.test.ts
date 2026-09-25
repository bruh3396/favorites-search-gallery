import { MediaExtension, MediaType } from "@/types/media";
import { Metric, Rating } from "@/types/search";
import { describe, expect, test } from "vitest";
import { FavoritesArena } from "@/features/favorites/types/types";
import { FavoritesColumnarArena } from "@/features/favorites/model/collection/favorites_columnar_arena";
import { FavoritesItem } from "@/features/favorites/model/collection/favorites_item";
import { Post } from "@/types/api";
import { toTagSet } from "@/utils/pure/tag";

interface Slot {
  post: Post;
  written: boolean;
  cachedTags?: Set<string>;
  isNew: boolean;
}

class TestArena implements FavoritesArena {
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
    this.slots.set(index, { post: post({}), written: false, isNew: false });
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

  public rating(index: number): Rating {
    this.lastIndex = index;
    return this.slot(index).post.rating === "s" ? 1 : 4;
  }

  public getMetric(index: number, metric: Metric): number {
    this.lastIndex = index;
    const { post: value } = this.slot(index);

    switch (metric) {
      case "score":
        return value.score;
      case "duration":
        return value.duration ?? 0;
      default:
        return 0;
    }
  }

  public extension(index: number): MediaExtension | undefined {
    this.lastIndex = index;
    return this.slot(index).post.extension;
  }

  public isNewFavorite(index: number): boolean {
    this.lastIndex = index;
    return this.slot(index).isNew;
  }

  public markNew(index: number): void {
    this.lastIndex = index;
    this.slot(index).isNew = true;
  }

  public previewUrl(index: number): string {
    this.lastIndex = index;
    return this.slot(index).post.previewURL;
  }

  public setDuration(index: number, duration: number): void {
    this.lastIndex = index;
    this.slot(index).post.duration = duration;
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

  public mediaType(index: number): MediaType {
    this.lastIndex = index;
    return "image";
  }

  public toPost(index: number): Post {
    this.lastIndex = index;
    return this.slot(index).post;
  }
}

function post(overrides: Partial<Post>): Post {
  return {
    id: "0",
    tags: "",
    width: 0,
    height: 0,
    score: 0,
    rating: "e",
    change: 0,
    fileURL: "",
    previewURL: "",
    ...overrides
  };
}

describe("FavoritesItem", () => {
  test("allocates its own slot and enriches on construction", () => {
    const arena = new TestArena();
    const item = new FavoritesItem(post({ id: "42", tags: "cat dog" }), arena, false);

    expect(arena.slot(0).written).toBe(true);
    expect(item.id).toBe("42");
    expect(item.tags).toEqual(new Set(["cat", "dog"]));
  });

  test("reads every field from its own allocated slot", () => {
    const arena = new TestArena();

    arena.nextIndex = 3;

    const item = new FavoritesItem(post({ id: "7", tags: "a", rating: "s", score: 99 }), arena, false);

    expect(item.id).toBe("7");
    expect(item.tags).toEqual(new Set(["a"]));
    expect(item.rating).toBe(1 satisfies Rating);
    expect(item.getMetric("score")).toBe(99);
    expect(item.getMetric("width")).toBe(0);
    expect(item.post.id).toBe("7");
    expect(arena.lastIndex).toBe(3);
  });

  test("caches the tag set when tags are clean", () => {
    const arena = new TestArena();

    new FavoritesItem(post({ id: "1", tags: "clean tags" }), arena, true);

    expect(arena.slot(0).cachedTags).toEqual(new Set(["clean", "tags"]));
  });

  test("does not cache the tag set when tags are dirty", () => {
    const arena = new TestArena();

    new FavoritesItem(post({ id: "1", tags: "dirty tags" }), arena, false);

    expect(arena.slot(0).cachedTags).toBeUndefined();
  });

  test("setDuration and markAsNew write back to the same slot", () => {
    const arena = new TestArena();
    const item = new FavoritesItem(post({ id: "5" }), arena, false);

    item.setDuration(123);
    item.markAsNew();

    expect(item.getMetric("duration")).toBe(123);
    expect(item.isNew).toBe(true);
  });

  test("consumeTags returns and clears the cached tags", () => {
    const arena = new TestArena();
    const item = new FavoritesItem(post({ id: "1", tags: "one two" }), arena, true);

    expect(item.consumeTags()).toEqual(new Set(["one", "two"]));
    expect(arena.slot(0).cachedTags).toBeUndefined();
  });

  test("enrich overwrites the backing post", () => {
    const arena = new TestArena();
    const item = new FavoritesItem(post({ id: "3", score: 1 }), arena, false);

    item.enrich(post({ id: "3", score: 500 }));
    expect(item.getMetric("score")).toBe(500);
  });

  test("keeps distinct items on independent slots", () => {
    const arena = new TestArena();

    const first = new FavoritesItem(post({ id: "10", tags: "one" }), arena, false);
    const second = new FavoritesItem(post({ id: "20", tags: "two" }), arena, false);

    expect(first.id).toBe("10");
    expect(second.id).toBe("20");
    expect(first.tags).toEqual(new Set(["one"]));
    expect(second.tags).toEqual(new Set(["two"]));
  });

  describe("real arena", () => {
    test("round trips fields, mutations, and tags", () => {
      const arena = new FavoritesColumnarArena();
      const item0 = new FavoritesItem(post({ id: "42", tags: "cat dog", rating: "s", score: 99 }), arena, true);
      const item1 = new FavoritesItem(post({ id: "103", tags: "apple banana cherry", rating: "e", score: 3, height: 1920, width: 1080 }), arena, true);

      expect(item0.id).toBe("42");
      expect(item0.rating).toBe(1 satisfies Rating);
      expect(item0.getMetric("score")).toBe(99);
      expect(item0.tags).toEqual(new Set(["cat", "dog"]));

      expect(item1.id).toBe("103");
      expect(item1.rating).toBe(4 satisfies Rating);
      expect(item1.getMetric("score")).toBe(3);
      expect(item1.getMetric("width")).toBe(1080);
      expect(item1.getMetric("height")).toBe(1920);
      expect(item1.tags).toEqual(new Set(["apple", "banana", "cherry"]));

      item0.setDuration(123);
      item0.markAsNew();

      expect(item0.getMetric("duration")).toBe(123);
      expect(item0.isNew).toBe(true);
      expect(item0.consumeTags()).toEqual(new Set(["cat", "dog"]));

      expect(item1.getMetric("duration")).toBe(0);
      expect(item1.isNew).toBe(false);
      expect(item1.tags).toEqual(new Set(["apple", "banana", "cherry"]));
    });
  });
});
