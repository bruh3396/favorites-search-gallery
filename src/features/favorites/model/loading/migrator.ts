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
import { toTagString } from "@/utils/pure/tag";

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

type MigrationTarget = {
  exists: () => Promise<boolean>;
  writeAll: (favorites: FavoriteItem[]) => Promise<void>;
};

const RATING_STRINGS: Record<number, string> = {
  [DiscreteRating.Explicit]: "explicit",
  [DiscreteRating.Questionable]: "questionable",
  [DiscreteRating.Safe]: "safe"
};

export class FavoritesMigrator {
  private readonly legacyFavoritesStoreName = `user${ON_FAVORITES_PAGE ? FAVORITES_PAGE_ID : USER_ID}`;
  private readonly legacyFavoritesStore = new Database<SerializedFavorite>("Favorites", this.legacyFavoritesStoreName);
  private readonly legacyExtensionsStore = new Database<MediaExtensionMapping>("ImageExtensions", "extensionMappings");

  public destroyLegacyStores(): void {
    indexedDB.deleteDatabase("Favorites");
    indexedDB.deleteDatabase("ImageExtensions");
  }

  public async migrateLegacyStores(target: MigrationTarget, onMigrating: () => void): Promise<void> {
    try {
      await this.migrate(target, onMigrating);
    } catch (error) {
      console.error(error);
    }
  }

  private async migrate(target: MigrationTarget, onMigrating: () => void): Promise<void> {
    if (!(await this.legacyFavoritesStore.exists(this.legacyFavoritesStoreName))) {
      return;
    }

    if (!(await target.exists())) {
      onMigrating();
      const legacyFavorites = await this.legacyFavoritesStore.readAll();
      const extensionsById = await this.readExtensions();
      const posts = legacyFavorites.map(record => migratePost(record, extensionsById.get(record.id)));

      await target.writeAll(posts.map(post => new FavoriteItem(post)));
      await PostStore.writeAll(posts);
    }

    if ((await this.deleteFavoritesStore()) === 0) {
      this.destroyLegacyStores();
    }
  }

  private deleteFavoritesStore(): Promise<number> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("Favorites");

      request.onsuccess = (): void => {
        const database = request.result;
        const version = database.version + 1;

        database.close();

        const upgrade = indexedDB.open("Favorites", version);

        upgrade.onupgradeneeded = (): void => {
          if (upgrade.result.objectStoreNames.contains(this.legacyFavoritesStoreName)) {
            upgrade.result.deleteObjectStore(this.legacyFavoritesStoreName);
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

  private async readExtensions(): Promise<Map<string, ImageExtension>> {
    if (!(await this.legacyExtensionsStore.exists("extensionMappings"))) {
      return new Map();
    }
    const mappings = await this.legacyExtensionsStore.readAll("extensionMappings");
    return new Map(mappings.map(mapping => [mapping.id, mapping.extension]));
  }
}

function migratePost(favorite: SerializedFavorite, imageExtension: ImageExtension | undefined): Post {
  const previewURL = decompressPreviewSource(favorite.src);
  const tagSet = new Set(typeof favorite.tags === "string" ? favorite.tags.split(" ") : favorite.tags);
  const extension = imageExtension ?? resolveAnimatedExtension(tagSet);
  return {
    id: favorite.id,
    width: favorite.metadata.width,
    height: favorite.metadata.height,
    score: favorite.metadata.score,
    rating: RATING_STRINGS[favorite.metadata.rating] ?? "explicit",
    change: favorite.metadata.change,
    tags: toTagString(tagSet),
    fileURL: extension === undefined ? "" : withExtension(thumbUrlToImageUrl(previewURL), extension),
    previewURL,
    duration: favorite.metadata.duration,
    deleted: favorite.deleted,
    extension,
    fetchedAt: extension === undefined ? undefined : Date.now()
  };
}

function resolveAnimatedExtension(tags: Set<string>): MediaExtension | undefined {
  switch (resolveMediaType(tags)) {
    case "video":
      return "mp4";
    case "gif":
      return tags.has("animated_png") ? "png" : "gif";
    default:
      return undefined;
  }
}
