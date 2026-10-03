import { Media, MediaKind } from "@/core/domain/media/media";
import { Post } from "@/core/domain/post/post";

const LEGACY_FAVORITES = "FavoritesV2";
const LEGACY_POSTS = "Posts";
const LEGACY_TAG_CATEGORIES = "TagCategories";
const LEGACY_DATABASES = [LEGACY_FAVORITES, LEGACY_POSTS, LEGACY_TAG_CATEGORIES];
const OWNER_PREFIX = "user";
const TAG_CATEGORIES = ["general", "artist", "unknown", "copyright", "character", "metadata"];
const FILE_URL = /\/(thumbnails|samples|images)\/+([^/]+)\/+(?:thumbnail_|sample_)?([^/.?]+)(?:\.([a-z0-9]+))?/i;
const COMPRESSED_PREVIEW = /^([^_/]+)_([^/.]+)$/;
const EXTENSION_KINDS: Record<string, MediaKind> = { jpg: "image", png: "image", jpeg: "image", gif: "gif", mp4: "video" };
const VIDEO_TAGS = ["video", "mp4"];
const GIF_TAGS = ["gif", "animated", "animated_gif"];

interface LegacyPost {
  id: string;
  width: number;
  height: number;
  score: number;
  rating: string;
  change: number;
  fileURL: string;
  previewURL?: string;
  tags: string;
  duration?: number;
  deleted?: boolean;
  extension?: string;
  fetchedAt?: number;
}

interface LegacyFile {
  directory: string;
  name: string;
  extension: string;
}

interface LegacyTagCategory {
  id: string;
  category: string;
}

interface LegacyData {
  posts: LegacyPost[];
  favorites: Map<string, LegacyPost[]>;
  tagCategories: LegacyTagCategory[];
}

export interface LegacyMigration {
  writeToNewDatabase: (transaction: IDBTransaction) => void;
  deleteLegacyDatabases: () => void;
}

const NO_MIGRATION: LegacyMigration = {
  writeToNewDatabase: () => undefined,
  deleteLegacyDatabases: () => undefined
};

export async function prepareLegacyMigration(newDatabaseName: string): Promise<LegacyMigration> {
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
    writeToNewDatabase: (transaction): void => writeToTarget(transaction, legacy),
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

function writeToTarget(transaction: IDBTransaction, legacy: LegacyData): void {
  const posts = transaction.objectStore("posts");
  const favorites = transaction.objectStore("favorites");
  const tagCategories = transaction.objectStore("tagCategories");
  const allPosts = [...legacy.posts, ...[...legacy.favorites.values()].flat()];

  for (const post of allPosts.map(convertPost)) {
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

function convertPost(legacy: LegacyPost): Post | null {
  const media = mintMedia(legacy);

  if (media === null) {
    return null;
  }
  const post: Post = {
    id: legacy.id,
    width: legacy.width,
    height: legacy.height,
    score: legacy.score,
    rating: legacy.rating,
    changedAt: legacy.change * 1_000,
    media,
    tags: legacy.tags
  };

  if (legacy.duration !== undefined) {
    post.durationSeconds = legacy.duration;
  }

  if (legacy.deleted !== undefined) {
    post.deleted = legacy.deleted;
  }

  if (legacy.fetchedAt !== undefined) {
    post.fetchedAt = legacy.fetchedAt;
  }
  return post;
}

function mintMedia(legacy: LegacyPost): Media | null {
  const file = locateFile(legacy);

  if (file === null) {
    return null;
  }
  const extension = file.extension in EXTENSION_KINDS ? file.extension : legacy.extension ?? "";
  const kind = EXTENSION_KINDS[extension];

  if (kind !== undefined) {
    return { kind, locator: `${file.directory}/${file.name}.${extension}` };
  }
  return { kind: guessKind(legacy.tags), locator: `${file.directory}/${file.name}` };
}

function locateFile({ fileURL, previewURL = "" }: LegacyPost): LegacyFile | null {
  const urlMatch = FILE_URL.exec(fileURL);

  if (urlMatch !== null) {
    const [, folder, directory, name, rawExtension = ""] = urlMatch;
    return { directory, name, extension: folder === "images" ? rawExtension.toLowerCase() : "" };
  }
  const previewMatch = COMPRESSED_PREVIEW.exec(previewURL);

  if (previewMatch === null) {
    return null;
  }
  const [, directory, name] = previewMatch;
  return { directory, name, extension: "" };
}

function guessKind(tags: string): MediaKind {
  const tagList = tags.split(" ");

  if (VIDEO_TAGS.some(tag => tagList.includes(tag))) {
    return "video";
  }
  return GIF_TAGS.some(tag => tagList.includes(tag)) ? "gif" : "image";
}

function isLegacyPost(value: unknown): value is LegacyPost {
  const post = value as Partial<LegacyPost> | null;
  return typeof post?.id === "string" && typeof post.fileURL === "string" && typeof post.tags === "string";
}

function isLegacyTagCategory(value: unknown): value is LegacyTagCategory {
  const mapping = value as Partial<LegacyTagCategory> | null;
  return typeof mapping?.id === "string" && TAG_CATEGORIES.includes(mapping.category ?? "");
}
