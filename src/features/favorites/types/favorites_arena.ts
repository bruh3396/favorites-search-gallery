import { MediaExtension, decodeMediaExtension, encodeMediaExtension } from "@/types/media";
import { Metric, Rating } from "@/types/search";
import { bitWidth, packIntArray, readPackedInt } from "@/utils/pure/bit";
import { toRatingString, toRatingValue } from "@/features/favorites/types/rating";
import { Favorite } from "@/types/favorite";
import { Post } from "@/types/api";
import { internString } from "@/lib/search/interner";
import { toTagSet } from "@/utils/pure/tag";

const DEFAULT_FAVORITE_COUNT = 1024;
const DEFAULT_TAG_COUNT = 1024;

type TagSpan = {
  offset: number;
  count: number;
};

export class FavoritesArena {
  public favoriteCount = 0;

  private readonly tagSets = new WeakMap<Favorite, Set<string>>();

  private ids = new Uint32Array(DEFAULT_FAVORITE_COUNT);
  private widths = new Uint16Array(DEFAULT_FAVORITE_COUNT);
  private heights = new Uint16Array(DEFAULT_FAVORITE_COUNT);
  private scores = new Uint32Array(DEFAULT_FAVORITE_COUNT);
  private deleted = new Uint8Array(DEFAULT_FAVORITE_COUNT);
  private encodedMediaExtensions = new Uint8Array(DEFAULT_FAVORITE_COUNT);
  private durations = new Uint16Array(DEFAULT_FAVORITE_COUNT);
  private changes = new Float64Array(DEFAULT_FAVORITE_COUNT);
  private fetchedAt = new Float64Array(DEFAULT_FAVORITE_COUNT);
  private ratings = new Uint8Array(DEFAULT_FAVORITE_COUNT);
  private tagOffsets = new Uint32Array(DEFAULT_FAVORITE_COUNT);
  private tagCounts = new Uint16Array(DEFAULT_FAVORITE_COUNT);

  private tagIds: Uint16Array | Uint32Array = new Uint16Array(DEFAULT_TAG_COUNT);
  private packedTagIds: Uint8Array | null = null;
  private bitsPerId = 0;
  private vocabulary: Map<string, number> | null = new Map<string, number>();
  private readonly vocabularyReverse: string[] = [];
  private tagsLength = 0;
  private vocabularyLength = 0;

  public allocate(): number {
    this.ensureItemCapacity(this.favoriteCount + 1);
    const index = this.favoriteCount;

    this.favoriteCount += 1;
    return index;
  }

  public write(index: number, post: Post): void {
    this.ids[index] = parseInt(post.id, 10);
    this.widths[index] = post.width;
    this.heights[index] = post.height;
    this.scores[index] = post.score;
    this.changes[index] = post.change;
    this.durations[index] = post.duration ?? 0;
    this.fetchedAt[index] = post.fetchedAt ?? 0;
    this.ratings[index] = toRatingValue(post.rating);
    this.deleted[index] = post.deleted ? 1 : 0;
    this.encodedMediaExtensions[index] = encodeMediaExtension(post.extension ? internString(post.extension) as MediaExtension : post.extension);
    const span = this.storeTags(post.tags);

    this.tagOffsets[index] = span.offset;
    this.tagCounts[index] = span.count;
  }

  public id(index: number): number {
    return this.ids[index];
  }

  public width(index: number): number {
    return this.widths[index];
  }

  public height(index: number): number {
    return this.heights[index];
  }

  public rating(index: number): Rating {
    return this.ratings[index] as Rating;
  }

  public getMetric(index: number, metric: Metric): number {
    switch (metric) {
      case "id":
        return this.ids[index];
      case "width":
        return this.widths[index];
      case "height":
        return this.heights[index];
      case "score":
        return this.scores[index];
      case "lastChangedTimestamp":
        return this.changes[index];
      case "duration":
        return this.durations[index];
      case "creationTimestamp":
      case "default":
      case "random":
      default:
        return 0;
    }
  }

  public extension(index: number): MediaExtension | undefined {
    return decodeMediaExtension(this.encodedMediaExtensions[index]);
  }

  public tags(index: number): string {
    return this.loadTags({ offset: this.tagOffsets[index], count: this.tagCounts[index] });
  }

  public cacheTagSet(favorite: Favorite, tags: Set<string>): void {
    this.tagSets.set(favorite, tags);
  }

  public tagSet(favorite: Favorite, index: number): Set<string> {
    return this.tagSets.get(favorite) ?? toTagSet(this.tags(index));
  }

  public evictTagSet(favorite: Favorite): void {
    this.tagSets.delete(favorite);
  }

  public toPost(index: number): Post {
    return {
      id: String(this.ids[index]),
      tags: this.tags(index),
      width: this.widths[index],
      height: this.heights[index],
      score: this.scores[index],
      rating: toRatingString(this.ratings[index] as Rating),
      change: this.changes[index],
      fileURL: "",
      duration: this.durations[index],
      fetchedAt: this.fetchedAt[index],
      deleted: this.deleted[index] === 1,
      previewURL: "",
      extension: this.extension(index)
    };
  }

  public setDuration(index: number, duration: number): void {
    this.durations[index] = duration;
  }

  public storeTags(tagString: string): TagSpan {
    if (this.packedTagIds !== null) {
      this.unpackTagIds();
    }
    const vocabulary = this.vocabulary ?? this.rebuildVocabulary();
    const tagNames = tagString.split(" ");
    const offset = this.tagsLength;

    this.ensureTagCapacity(this.tagsLength + tagNames.length);

    for (const tagName of tagNames) {
      let id = vocabulary.get(tagName);

      if (id === undefined) {
        this.promoteTagIds();
        id = this.vocabularyLength;
        vocabulary.set(internString(tagName), id);
        this.vocabularyReverse.push(internString(tagName));
        this.vocabularyLength += 1;
      }
      this.tagIds[this.tagsLength] = id;
      this.tagsLength += 1;
    }
    return { offset, count: tagNames.length };
  }

  public compress(): void {
    this.trimItemArrays();
    this.packTagIds();
    this.vocabulary = null;
  }

  public loadTags(span: TagSpan): string {
    const tagNames: string[] = [];

    for (let i = 0; i < span.count; i += 1) {
      tagNames.push(this.vocabularyReverse[this.readTagId(span.offset + i)]);
    }
    return tagNames.join(" ");
  }

  private rebuildVocabulary(): Map<string, number> {
    const vocabulary = new Map<string, number>();

    for (let id = 0; id < this.vocabularyReverse.length; id += 1) {
      vocabulary.set(this.vocabularyReverse[id], id);
    }
    this.vocabulary = vocabulary;
    return vocabulary;
  }

  private readTagId(index: number): number {
    if (this.packedTagIds === null) {
      return this.tagIds[index];
    }
    return readPackedInt(this.packedTagIds, index, this.bitsPerId);
  }

  private packTagIds(): void {
    this.bitsPerId = Math.max(1, bitWidth(this.vocabularyLength));
    this.packedTagIds = packIntArray(this.tagIds, this.tagsLength, this.bitsPerId);
    this.tagIds = new Uint16Array(0);
  }

  private unpackTagIds(): void {
    if (this.packedTagIds === null) {
      return;
    }
    const restored = this.vocabularyLength >= 65536 ? new Uint32Array(this.tagsLength) : new Uint16Array(this.tagsLength);

    for (let i = 0; i < this.tagsLength; i += 1) {
      restored[i] = readPackedInt(this.packedTagIds, i, this.bitsPerId);
    }
    this.tagIds = restored;
    this.packedTagIds = null;
    this.bitsPerId = 0;
  }

  private ensureItemCapacity(required: number): void {
    if (required <= this.ids.length) {
      return;
    }

    const capacity = Math.max(this.ids.length * 2, required);

    this.ids = grow(this.ids, capacity);
    this.widths = grow(this.widths, capacity);
    this.heights = grow(this.heights, capacity);
    this.scores = grow(this.scores, capacity);
    this.deleted = grow(this.deleted, capacity);
    this.encodedMediaExtensions = grow(this.encodedMediaExtensions, capacity);
    this.durations = grow(this.durations, capacity);
    this.changes = grow(this.changes, capacity);
    this.fetchedAt = grow(this.fetchedAt, capacity);
    this.ratings = grow(this.ratings, capacity);
    this.tagOffsets = grow(this.tagOffsets, capacity);
    this.tagCounts = grow(this.tagCounts, capacity);
  }

  private ensureTagCapacity(required: number): void {
    if (required <= this.tagIds.length) {
      return;
    }

    let newLength = this.tagIds.length * 2;

    while (newLength < required) {
      newLength *= 2;
    }
    this.tagIds = grow(this.tagIds, newLength);
  }

  private trimItemArrays(): void {
    const count = this.favoriteCount;

    if (count === this.ids.length) {
      return;
    }
    this.ids = this.ids.slice(0, count);
    this.widths = this.widths.slice(0, count);
    this.heights = this.heights.slice(0, count);
    this.scores = this.scores.slice(0, count);
    this.deleted = this.deleted.slice(0, count);
    this.encodedMediaExtensions = this.encodedMediaExtensions.slice(0, count);
    this.durations = this.durations.slice(0, count);
    this.changes = this.changes.slice(0, count);
    this.fetchedAt = this.fetchedAt.slice(0, count);
    this.ratings = this.ratings.slice(0, count);
    this.tagOffsets = this.tagOffsets.slice(0, count);
    this.tagCounts = this.tagCounts.slice(0, count);
  }

  private promoteTagIds(): void {
    if (this.tagIds instanceof Uint16Array && this.vocabularyLength >= 65536) {
      const next = new Uint32Array(this.tagIds.length);

      next.set(this.tagIds);
      this.tagIds = next;
    }
  }
}

function grow<T extends Uint8Array | Uint16Array | Uint32Array | Float64Array>(array: T, capacity: number): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const next = new (array.constructor as any)(capacity) as T;

  next.set(array);
  return next;
}
