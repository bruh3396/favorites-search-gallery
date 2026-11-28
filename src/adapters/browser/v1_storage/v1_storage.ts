import { TagCategory, isTagCategory } from "@/core/domain/tag_category/tag_category";
import { isNumber, isString } from "@/core/utils/guard/unknown_utilities";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { Media } from "@/core/domain/media/media";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { Post } from "@/core/domain/post/post";
import { Rating } from "@/core/domain/post/rating";
import { Snippet } from "@/core/domain/snippet/snippet";
import { V1StorageContents } from "@/adapters/browser/v1_storage/v1_storage_contents";
import { createFieldsGuard } from "@/core/utils/guard/fields_guard";

const DATABASE_NAMES = { favorites: "FavoritesV2", posts: "Posts", tagCategories: "TagCategories" } as const;
const SNIPPETS_KEY = "searchSnippets";
const LOCAL_KEYS = [SNIPPETS_KEY, "savedSearches", "customTags", "searchHistory", "lastEditedSearchQuery", "aspectRatios", "storedVideoClips"];
const OWNER_PREFIX = "user";
const COMPRESSED_PREVIEW = /^([^_/]+)_([^/.]+)$/;
const RATING_BY_INITIAL: Partial<Record<string, Rating>> = { e: "explicit", q: "questionable", s: "safe" };

interface V1Post {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly score: number;
  readonly rating: string;
  readonly change: number;
  readonly fileURL: string;
  readonly previewURL?: string;
  readonly tags: string;
  readonly duration?: number;
  readonly deleted?: boolean;
  readonly extension?: string;
  readonly fetchedAt?: number;
}

interface V1TagCategory {
  readonly id: string;
  readonly category: TagCategory;
}

const isSnippet = createFieldsGuard<Snippet>({ name: isString, query: isString, lastUsedAt: isNumber, createdAt: isNumber });

export interface V1StorageDependencies {
  mintMedia: MediaMinter;
  localKeyedValues: Pick<LocalKeyedValues, "get" | "remove">;
}

export class V1Storage {
  constructor(private readonly dependencies: V1StorageDependencies) { }

  public async read(): Promise<V1StorageContents | null> {
    const databaseNames = await listDatabaseNames();
    const storedSnippets = this.dependencies.localKeyedValues.get(SNIPPETS_KEY);
    const snippets = Array.isArray(storedSnippets) ? storedSnippets.filter(isSnippet) : [];

    if (databaseNames.length === 0 && snippets.length === 0) {
      return null;
    }
    const read = (name: string): Promise<Map<string, unknown[]>> => (
      databaseNames.includes(name) ? readDatabase(name) : Promise.resolve(new Map())
    );
    const [favoriteRowsByStoreName, postRowsByStoreName, tagCategoryRowsByStoreName] = await Promise.all([
      read(DATABASE_NAMES.favorites),
      read(DATABASE_NAMES.posts),
      read(DATABASE_NAMES.tagCategories)
    ]);
    const favoriteV1PostsByStoreName = new Map([...favoriteRowsByStoreName].map(([storeName, rows]) => [storeName, rows.filter(isV1Post)]));
    const v1Posts = removeDuplicateIds([...(postRowsByStoreName.get("posts") ?? []).filter(isV1Post), ...[...favoriteV1PostsByStoreName.values()].flat()]);
    return {
      posts: v1Posts.map(v1Post => this.convertPost(v1Post)).filter(post => post !== null),
      favoriteIdsByOwnerId: collectFavoriteIds(favoriteV1PostsByStoreName),
      tagCategoryByTagName: new Map((tagCategoryRowsByStoreName.get("tagCategories") ?? []).filter(isV1TagCategory).map(({ id, category }) => [id, category])),
      snippets
    };
  }

  public async delete(): Promise<void> {
    LOCAL_KEYS.forEach(key => this.dependencies.localKeyedValues.remove(key));
    (await listDatabaseNames()).forEach(name => indexedDB.deleteDatabase(name));
  }

  private convertPost(v1Post: V1Post): Post | null {
    const media = mintV1Media(v1Post, this.dependencies.mintMedia);

    if (media === null) {
      return null;
    }
    return {
      id: v1Post.id,
      width: v1Post.width,
      height: v1Post.height,
      score: v1Post.score,
      rating: RATING_BY_INITIAL[v1Post.rating.charAt(0).toLowerCase()] ?? "explicit",
      changedAt: v1Post.change * 1_000,
      media,
      tags: v1Post.tags,
      ...(v1Post.duration === undefined ? {} : { durationSeconds: v1Post.duration }),
      status: v1Post.deleted === true ? "deleted" : "active",
      ...(v1Post.fetchedAt === undefined ? {} : { fetchedAt: v1Post.fetchedAt })
    };
  }
}

async function listDatabaseNames(): Promise<string[]> {
  try {
    const existingNames = new Set((await indexedDB.databases()).map(database => database.name));
    return Object.values(DATABASE_NAMES).filter(name => existingNames.has(name));
  } catch {
    return [];
  }
}

function readDatabase(name: string): Promise<Map<string, unknown[]>> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name);

    request.onerror = (): void => reject(request.error);
    request.onsuccess = (): void => {
      const database = request.result;
      const storeNames = [...database.objectStoreNames];

      if (storeNames.length === 0) {
        database.close();
        resolve(new Map());
        return;
      }
      const transaction = database.transaction(storeNames, "readonly");
      const requests = storeNames.map(storeName => [storeName, transaction.objectStore(storeName).getAll()] as const);

      transaction.oncomplete = (): void => {
        database.close();
        resolve(new Map(requests.map(([storeName, getAll]) => [storeName, getAll.result as unknown[]])));
      };
      transaction.onabort = (): void => {
        database.close();
        reject(transaction.error);
      };
    };
  });
}

function collectFavoriteIds(favoriteV1PostsByStoreName: Map<string, V1Post[]>): Map<string, string[]> {
  const favoriteIdsByOwnerId = new Map<string, string[]>();

  for (const [storeName, favoriteV1Posts] of favoriteV1PostsByStoreName) {
    const ownerId = storeName.slice(OWNER_PREFIX.length);

    if (storeName.startsWith(OWNER_PREFIX) && ownerId !== "" && favoriteV1Posts.length > 0) {
      favoriteIdsByOwnerId.set(ownerId, favoriteV1Posts.map(v1Post => v1Post.id).reverse());
    }
  }
  return favoriteIdsByOwnerId;
}

function removeDuplicateIds(v1Posts: V1Post[]): V1Post[] {
  const seenPostIds = new Set<string>();
  return v1Posts.filter(v1Post => !seenPostIds.has(v1Post.id) && seenPostIds.add(v1Post.id));
}

function mintV1Media({ fileURL, previewURL = "", extension = "", tags }: V1Post, mintMedia: MediaMinter): Media | null {
  const media = mintMedia({ url: fileURL, tags }) ?? mintMedia({ url: expandCompressedPreview(previewURL), tags });

  if (media === null || media.locator.includes(".")) {
    return media;
  }
  return mintMedia({ url: `/images/${media.locator}.${extension}`, tags });
}

function expandCompressedPreview(previewURL: string): string {
  const match = COMPRESSED_PREVIEW.exec(previewURL);
  return match === null ? "" : `/thumbnails/${match[1]}/thumbnail_${match[2]}.jpg`;
}

function isV1Post(value: unknown): value is V1Post {
  const partialV1Post = value as Partial<V1Post> | null;
  return typeof partialV1Post?.id === "string" && typeof partialV1Post.fileURL === "string" && typeof partialV1Post.tags === "string";
}

function isV1TagCategory(value: unknown): value is V1TagCategory {
  const partialV1TagCategory = value as Partial<V1TagCategory> | null;
  return typeof partialV1TagCategory?.id === "string" && isTagCategory(partialV1TagCategory.category);
}
