import { Post, Rating } from "@/core/domain/post/post";
import { Media } from "@/core/domain/media/media";

const LEGACY_FAVORITES = "FavoritesV2";
const LEGACY_POSTS = "Posts";
const LEGACY_TAG_CATEGORIES = "TagCategories";
const LEGACY_DATABASES = [LEGACY_FAVORITES, LEGACY_POSTS, LEGACY_TAG_CATEGORIES];
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

export type LegacyMintMedia = (file: { url: string; tags: string }) => Media | null;

export interface LegacyMigration {
  writeToNewDatabase: (transaction: IDBTransaction) => void;
  deleteLegacyDatabases: () => void;
}

const NO_MIGRATION: LegacyMigration = {
  writeToNewDatabase: () => undefined,
  deleteLegacyDatabases: () => undefined
};

export async function prepareLegacyMigration(newDatabaseName: string, mintMedia: LegacyMintMedia): Promise<LegacyMigration> {
  const databaseNames = await listDatabaseNames();

  if (databaseNames === null) {
    return NO_MIGRATION;
  }
  const legacyDatabases = LEGACY_DATABASES.filter(name => databaseNames.has(name));

  if (legacyDatabases.length === 0) {
    return NO_MIGRATION;
  }
  const deleteLegacyDatabases = (): void => legacyDatabases.forEach(name => indexedDB.deleteDatabase(name));

  if (databaseNames.has(newDatabaseName)) {
    deleteLegacyDatabases();
    return NO_MIGRATION;
  }
  const legacy = await readLegacy(legacyDatabases);
  return {
    writeToNewDatabase: (transaction): void => writeToTarget(transaction, legacy, mintMedia),
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

async function readLegacy(present: string[]): Promise<LegacyData> {
  const read = (name: string): Promise<Map<string, unknown[]>> => (
    present.includes(name) ? readDatabase(name) : Promise.resolve(new Map())
  );
  const [favorites, posts, tagCategories] = await Promise.all([
    read(LEGACY_FAVORITES),
    read(LEGACY_POSTS),
    read(LEGACY_TAG_CATEGORIES)
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

function writeToTarget(transaction: IDBTransaction, legacy: LegacyData, mintMedia: LegacyMintMedia): void {
  const posts = transaction.objectStore("posts");
  const favorites = transaction.objectStore("favorites");
  const tagCategories = transaction.objectStore("tagCategories");
  const allPosts = [...legacy.posts, ...[...legacy.favorites.values()].flat()];

  for (const post of allPosts.map(legacyPost => convertPost(legacyPost, mintMedia))) {
    if (post !== null) {
      addIfAbsent(posts, post);
    }
  }

  for (const [storeName, rows] of legacy.favorites) {
    const ownerId = storeName.slice(OWNER_PREFIX.length);

    if (storeName.startsWith(OWNER_PREFIX) && ownerId !== "" && rows.length > 0) {
      addIfAbsent(favorites, rows.map(row => row.id).reverse(), ownerId);
    }
  }

  for (const { id, category } of legacy.tagCategories) {
    addIfAbsent(tagCategories, category, id);
  }
}

function addIfAbsent(store: IDBObjectStore, value: unknown, key?: IDBValidKey): void {
  store.add(value, key).onerror = (event): void => {
    event.preventDefault();
    event.stopPropagation();
  };
}

function convertPost(legacy: LegacyPost, mintMedia: LegacyMintMedia): Post | null {
  const media = mintLegacyMedia(legacy, mintMedia);

  if (media === null) {
    return null;
  }
  return {
    id: legacy.id,
    width: legacy.width,
    height: legacy.height,
    score: legacy.score,
    rating: RATING_BY_INITIAL[legacy.rating.charAt(0).toLowerCase()] ?? "explicit",
    changedAt: legacy.change * 1_000,
    media,
    tags: legacy.tags,
    ...(legacy.duration === undefined ? {} : { durationSeconds: legacy.duration }),
    ...(legacy.deleted === undefined ? {} : { deleted: legacy.deleted }),
    ...(legacy.fetchedAt === undefined ? {} : { fetchedAt: legacy.fetchedAt })
  };
}

function mintLegacyMedia({ fileURL, previewURL = "", extension = "", tags }: LegacyPost, mintMedia: LegacyMintMedia): Media | null {
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
  const post = value as Partial<LegacyPost> | null;
  return typeof post?.id === "string" && typeof post.fileURL === "string" && typeof post.tags === "string";
}

function isLegacyTagCategory(value: unknown): value is LegacyTagCategory {
  const mapping = value as Partial<LegacyTagCategory> | null;
  return typeof mapping?.id === "string" && TAG_CATEGORIES.includes(mapping.category ?? "");
}
