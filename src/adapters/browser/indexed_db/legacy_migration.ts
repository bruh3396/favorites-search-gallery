import { LegacyDatabaseNames } from "@/adapters/browser/indexed_db/legacy_database_names";
import { Media } from "@/core/domain/media/media";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { Post } from "@/core/domain/post/post";
import { Rating } from "@/core/domain/post/rating";

const OWNER_PREFIX = "user";
const TAG_CATEGORIES = ["general", "artist", "unknown", "copyright", "character", "metadata"];
const COMPRESSED_PREVIEW = /^([^_/]+)_([^/.]+)$/;
const RATING_BY_INITIAL: Partial<Record<string, Rating>> = { e: "explicit", q: "questionable", s: "safe" };

interface LegacyPost {
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

interface LegacyTagCategory {
  readonly id: string;
  readonly category: string;
}

interface LegacyData {
  readonly posts: LegacyPost[];
  readonly favorites: Map<string, LegacyPost[]>;
  readonly tagCategories: LegacyTagCategory[];
}

export interface LegacyMigration {
  writeToNewDatabase: (transaction: IDBTransaction) => void;
  deleteLegacyDatabases: () => void;
}

const NO_MIGRATION: LegacyMigration = {
  writeToNewDatabase: () => undefined,
  deleteLegacyDatabases: () => undefined
};

export async function prepareLegacyMigration(
  newDatabaseName: string,
  legacyDatabaseNames: LegacyDatabaseNames | null,
  mintMedia: MediaMinter
): Promise<LegacyMigration> {
  if (legacyDatabaseNames === null) {
    return NO_MIGRATION;
  }
  const databaseNames = await listDatabaseNames();

  if (databaseNames === null) {
    return NO_MIGRATION;
  }
  const legacyDatabases = Object.values(legacyDatabaseNames).filter(name => databaseNames.has(name));

  if (legacyDatabases.length === 0) {
    return NO_MIGRATION;
  }
  const deleteLegacyDatabases = (): void => legacyDatabases.forEach(name => indexedDB.deleteDatabase(name));

  if (databaseNames.has(newDatabaseName)) {
    deleteLegacyDatabases();
    return NO_MIGRATION;
  }
  const legacyData = await readLegacy(legacyDatabaseNames, legacyDatabases);
  return {
    writeToNewDatabase: (transaction): void => writeToTarget(transaction, legacyData, mintMedia),
    deleteLegacyDatabases
  };
}

async function listDatabaseNames(): Promise<Set<string | undefined> | null> {
  try {
    return new Set((await indexedDB.databases()).map(database => database.name));
  } catch {
    return null;
  }
}

async function readLegacy(legacyDatabaseNames: LegacyDatabaseNames, present: string[]): Promise<LegacyData> {
  const read = (name: string): Promise<Map<string, unknown[]>> => (
    present.includes(name) ? readDatabase(name) : Promise.resolve(new Map())
  );
  const [favorites, posts, tagCategories] = await Promise.all([
    read(legacyDatabaseNames.favorites),
    read(legacyDatabaseNames.posts),
    read(legacyDatabaseNames.tagCategories)
  ]);
  return {
    posts: (posts.get("posts") ?? []).filter(isLegacyPost),
    favorites: new Map([...favorites].map(([storeName, rows]) => [storeName, rows.filter(isLegacyPost)])),
    tagCategories: (tagCategories.get("tagCategories") ?? []).filter(isLegacyTagCategory)
  };
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

function writeToTarget(transaction: IDBTransaction, legacyData: LegacyData, mintMedia: MediaMinter): void {
  const posts = transaction.objectStore("posts");
  const favorites = transaction.objectStore("favorites");
  const tagCategories = transaction.objectStore("tagCategories");
  const allLegacyPosts = removeDuplicateIds([...legacyData.posts, ...[...legacyData.favorites.values()].flat()]);

  for (const post of allLegacyPosts.map(legacyPost => convertPost(legacyPost, mintMedia))) {
    if (post !== null) {
      addIfAbsent(posts, post);
    }
  }

  for (const [storeName, favoriteLegacyPosts] of legacyData.favorites) {
    const ownerId = storeName.slice(OWNER_PREFIX.length);

    if (storeName.startsWith(OWNER_PREFIX) && ownerId !== "" && favoriteLegacyPosts.length > 0) {
      addIfAbsent(favorites, favoriteLegacyPosts.map(legacyPost => legacyPost.id).reverse(), ownerId);
    }
  }

  for (const { id, category } of legacyData.tagCategories) {
    addIfAbsent(tagCategories, category, id);
  }
}

function removeDuplicateIds(legacyPosts: LegacyPost[]): LegacyPost[] {
  const seenPostIds = new Set<string>();
  return legacyPosts.filter(legacyPost => !seenPostIds.has(legacyPost.id) && seenPostIds.add(legacyPost.id));
}

function addIfAbsent(store: IDBObjectStore, value: unknown, key?: IDBValidKey): void {
  store.add(value, key).onerror = (event): void => {
    event.preventDefault();
    event.stopPropagation();
  };
}

function convertPost(legacyPost: LegacyPost, mintMedia: MediaMinter): Post | null {
  const media = mintLegacyMedia(legacyPost, mintMedia);

  if (media === null) {
    return null;
  }
  return {
    id: legacyPost.id,
    width: legacyPost.width,
    height: legacyPost.height,
    score: legacyPost.score,
    rating: RATING_BY_INITIAL[legacyPost.rating.charAt(0).toLowerCase()] ?? "explicit",
    changedAt: legacyPost.change * 1_000,
    media,
    tags: legacyPost.tags,
    ...(legacyPost.duration === undefined ? {} : { durationSeconds: legacyPost.duration }),
    status: legacyPost.deleted === true ? "deleted" : "active",
    ...(legacyPost.fetchedAt === undefined ? {} : { fetchedAt: legacyPost.fetchedAt })
  };
}

function mintLegacyMedia({ fileURL, previewURL = "", extension = "", tags }: LegacyPost, mintMedia: MediaMinter): Media | null {
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

function isLegacyPost(value: unknown): value is LegacyPost {
  const partialLegacyPost = value as Partial<LegacyPost> | null;
  return typeof partialLegacyPost?.id === "string" && typeof partialLegacyPost.fileURL === "string" && typeof partialLegacyPost.tags === "string";
}

function isLegacyTagCategory(value: unknown): value is LegacyTagCategory {
  const partialLegacyTagCategory = value as Partial<LegacyTagCategory> | null;
  return typeof partialLegacyTagCategory?.id === "string" && TAG_CATEGORIES.includes(partialLegacyTagCategory.category ?? "");
}
