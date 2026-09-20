import { Favorite } from "@/types/favorite";
import { internString } from "@/lib/search/interner";

const DEFAULT_FAVORITE_COUNT = 1024;
const DEFAULT_TAG_COUNT = 1024;

type TagSpan = {
  offset: number;
  count: number;
};

export class FavoritesArena {
  public ids = new Uint32Array(DEFAULT_FAVORITE_COUNT);
  public widths = new Uint16Array(DEFAULT_FAVORITE_COUNT);
  public heights = new Uint16Array(DEFAULT_FAVORITE_COUNT);
  public scores = new Uint32Array(DEFAULT_FAVORITE_COUNT);
  public deleted = new Uint8Array(DEFAULT_FAVORITE_COUNT);
  public encodedMediaExtensions = new Uint8Array(DEFAULT_FAVORITE_COUNT);
  public durations = new Uint16Array(DEFAULT_FAVORITE_COUNT);
  public changes = new Float64Array(DEFAULT_FAVORITE_COUNT);
  public fetchedAt = new Float64Array(DEFAULT_FAVORITE_COUNT);
  public ratings = new Uint8Array(DEFAULT_FAVORITE_COUNT);
  public tagOffsets = new Uint32Array(DEFAULT_FAVORITE_COUNT);
  public tagCounts = new Uint16Array(DEFAULT_FAVORITE_COUNT);
  public favoriteCount = 0;
  public readonly tagSets = new WeakMap<Favorite, Set<string>>();

  private tagIds: Uint16Array | Uint32Array = new Uint16Array(DEFAULT_TAG_COUNT);
  private readonly vocabulary = new Map<string, number>();
  private readonly vocabularyReverse: string[] = [];
  private tagsLength = 0;
  private vocabularyLength = 0;

  public allocate(): number {
    this.ensureItemCapacity(this.favoriteCount + 1);
    const index = this.favoriteCount;

    this.favoriteCount += 1;
    return index;
  }

  public storeTags(tagString: string): TagSpan {
    const tagNames = tagString.split(" ");
    const offset = this.tagsLength;

    this.ensureTagCapacity(this.tagsLength + tagNames.length);

    for (const tagName of tagNames) {
      let id = this.vocabulary.get(tagName);
      const sharedTagName = internString(tagName);

      if (id === undefined) {
        this.promoteTagIds();
        id = this.vocabularyLength;
        this.vocabulary.set(sharedTagName, id);
        this.vocabularyReverse.push(sharedTagName);
        this.vocabularyLength += 1;
      }
      this.tagIds[this.tagsLength] = id;
      this.tagsLength += 1;
    }
    return { offset, count: tagNames.length };
  }

  public loadTags(span: TagSpan): string {
    const tagNames: string[] = [];

    for (let i = 0; i < span.count; i += 1) {
      const id = this.tagIds[span.offset + i];

      tagNames.push(this.vocabularyReverse[id]);
    }
    return tagNames.join(" ");
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
