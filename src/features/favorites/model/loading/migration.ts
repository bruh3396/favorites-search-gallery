import * as PostStore from "@/lib/post/store";
import { FAVORITES_PAGE_ID, ON_FAVORITES_PAGE, USER_ID } from "@/lib/environment";
import { ImageExtension, MediaExtension, MediaExtensionMapping } from "@/types/media";
import { thumbUrlToImageUrl, withExtension } from "@/lib/media/url";
import { Database } from "@/lib/storage/database";
import { DiscreteRating } from "@/types/search";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { Post } from "@/types/api";
import { decompressPreviewSource } from "@/features/favorites/types/preview_source_codec";
import { resolveMediaType } from "@/lib/media/type";
import { toTagSet } from "@/utils/pure/tag";

type SerializedFavorite = {
  id: string;
  tags: string | Set<string>;
  src: string;
  deleted?: boolean;
  metadata: {
    width: number;
    height: number;
    score: number;
    rating: number;
    create: number;
    change: number;
    duration: number | undefined;
  };
};

const legacyFavoritesStoreName = `user${ON_FAVORITES_PAGE ? FAVORITES_PAGE_ID : USER_ID}`;
const legacyFavoritesStore = new Database<SerializedFavorite>("Favorites", legacyFavoritesStoreName);
const legacyExtensionsStore = new Database<MediaExtensionMapping>("ImageExtensions", "extensionMappings");

const RATING_STRINGS: Record<number, string> = {
  [DiscreteRating.Explicit]: "explicit",
  [DiscreteRating.Questionable]: "questionable",
  [DiscreteRating.Safe]: "safe"
};

export function destroyLegacyStores(): void {
  indexedDB.deleteDatabase("Favorites");
  indexedDB.deleteDatabase("ImageExtensions");
}

type FavoritesStore = {
  exists: () => Promise<boolean>;
  writeAll: (favorites: FavoriteItem[]) => Promise<void>;
};

export async function migrateLegacyStores(favoritesStore: FavoritesStore, onMigrating: () => void): Promise<void> {
  try {
    await migrate(favoritesStore, onMigrating);
  } catch (error) {
    console.error(error);
  }
}

async function migrate(favoritesStore: FavoritesStore, onMigrating: () => void): Promise<void> {
  if (!(await legacyFavoritesStore.exists(legacyFavoritesStoreName))) {
    return;
  }

  if (!(await favoritesStore.exists())) {
    onMigrating();
    const legacyFavorites = await legacyFavoritesStore.readAll();
    const extensionsById = await readExtensions();
    const posts = legacyFavorites.map(record => migratePost(record, extensionsById.get(record.id)));

    await favoritesStore.writeAll(posts.map(post => new FavoriteItem(post)));
    await PostStore.writeAll(posts);
  }

  if ((await deleteFavoritesStore()) === 0) {
    destroyLegacyStores();
  }
}

function deleteFavoritesStore(): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("Favorites");

    request.onsuccess = (): void => {
      const database = request.result;
      const version = database.version + 1;

      database.close();

      const upgrade = indexedDB.open("Favorites", version);

      upgrade.onupgradeneeded = (): void => {
        if (upgrade.result.objectStoreNames.contains(legacyFavoritesStoreName)) {
          upgrade.result.deleteObjectStore(legacyFavoritesStoreName);
        }
      };
      upgrade.onsuccess = (): void => {
        const remaining = upgrade.result.objectStoreNames.length;

        upgrade.result.close();
        resolve(remaining);
      };
      upgrade.onblocked = (): void => resolve(1);
      upgrade.onerror = (): void => reject(upgrade.error);
    };
    request.onerror = (): void => reject(request.error);
  });
}

async function readExtensions(): Promise<Map<string, ImageExtension>> {
  if (!(await legacyExtensionsStore.exists("extensionMappings"))) {
    return new Map();
  }
  const mappings = await legacyExtensionsStore.readAll("extensionMappings");
  return new Map(mappings.map(mapping => [mapping.id, mapping.extension]));
}

function migratePost(favorite: SerializedFavorite, imageExtension: ImageExtension | undefined): Post {
  const previewURL = decompressPreviewSource(favorite.src);
  const tags = typeof favorite.tags === "string" ? favorite.tags : [...favorite.tags].join(" ");
  const extension = imageExtension ?? resolveAnimatedExtension(tags);
  return {
    id: favorite.id,
    width: favorite.metadata.width,
    height: favorite.metadata.height,
    score: favorite.metadata.score,
    rating: RATING_STRINGS[favorite.metadata.rating] ?? "explicit",
    change: favorite.metadata.change,
    tags,
    fileURL: extension === undefined ? "" : withExtension(thumbUrlToImageUrl(previewURL), extension),
    previewURL,
    duration: favorite.metadata.duration,
    deleted: favorite.deleted,
    extension,
    fetchedAt: extension === undefined ? undefined : Date.now()
  };
}

function resolveAnimatedExtension(tags: string): MediaExtension | undefined {
  switch (resolveMediaType(tags)) {
    case "video":
      return "mp4";
    case "gif":
      return toTagSet(tags).has("animated_png") ? "png" : "gif";
    default:
      return undefined;
  }
}
