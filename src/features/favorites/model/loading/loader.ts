import * as FavoritesSequentialFetcher from "@/features/favorites/model/loading/sequential_fetcher";
import { Favorite } from "@/types/favorite";
import { FavoriteItem } from "@/features/favorites/types/favorite_item";
import { FavoritesConcurrentFetcher } from "@/features/favorites/model/loading/concurrent_fetcher";
import { FavoritesMigrator } from "@/features/favorites/model/loading/migrator";
import { FavoritesStore } from "@/features/favorites/model/loading/store";
import { toTagSet } from "@/utils/pure/tag";

export class FavoritesLoader {
  private readonly store = new FavoritesStore();
  private readonly migrator = new FavoritesMigrator();

  public readStoredFavorites(): Promise<FavoriteItem[]> {
    return this.store.readAll().then(posts => posts.map(post => new FavoriteItem(post)));
  }

  public streamStoredFavorites(onBatch: (favorites: FavoriteItem[]) => void): Promise<void> {
    return this.store.streamAll(posts => onBatch(posts.map(post => new FavoriteItem(post))));
  }

  public countStoredFavorites(): Promise<number> {
    return this.store.count();
  }

  public fetchAllFavorites(onFavoritesFound: (favorites: FavoriteItem[]) => void, firstPageFavorites?: HTMLElement[]): Promise<void> {
    return new FavoritesConcurrentFetcher((elements: HTMLElement[]): void => {
      onFavoritesFound(elements.map(element => new FavoriteItem(element)));
    }, firstPageFavorites).fetchAllFavorites();
  }

  public fetchNewFavorites(existingIds: Set<string>, firstPageFavorites?: HTMLElement[]): Promise<FavoriteItem[]> {
    return FavoritesSequentialFetcher.fetchNewFavorites(existingIds, firstPageFavorites)
      .then(elements => elements.map(element => new FavoriteItem(element)));
  }

  public migrateLegacyStores(onMigrating: () => void): Promise<void> {
    return this.migrator.migrateLegacyStores({
      exists: () => this.store.exists(),
      writeAll: (favorites: FavoriteItem[]) => this.store.writeAll(favorites)
    }, onMigrating);
  }

  public destroyLegacyStores(): void {
    this.migrator.destroyLegacyStores();
  }

  public storeFavorites(favorites: Favorite[]): Promise<void> {
    return this.store.writeAll(favorites);
  }

  public updateStoredFavorite(favorite: Favorite): void {
    this.store.update(favorite);
  }

  public deleteStoredFavorite(id: string): Promise<void> {
    return this.store.deleteId(id);
  }

  public hasStoredFavorites(): Promise<boolean> {
    return this.store.hasAny();
  }

  public loadFavoriteIds(): Promise<string[]> {
    return this.store.readIds();
  }

  public async getTagsForIds(ids: string[]): Promise<Map<string, Set<string>>> {
    const posts = await this.store.readMany(ids);
    return new Map(posts.map(post => [post.id, toTagSet(post.tags)]));
  }

  public destroyStore(): Promise<void> {
    return this.store.destroy();
  }
}
