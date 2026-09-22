import { Environment } from "@/app/context/environment";
import { Favorite } from "@/types/favorite";
import { FavoritesArena } from "@/features/favorites/types/favorites_arena";
import { FavoritesConcurrentFetcher } from "@/features/favorites/model/loading/retrieval/concurrent_fetcher";
import { FavoritesItem } from "@/features/favorites/types/favorites_item";
import { FavoritesSequentialFetcher } from "@/features/favorites/model/loading/retrieval/sequential_fetcher";
import { FavoritesStore } from "@/features/favorites/model/loading/retrieval/store";
import { Rule34NetworkConfig } from "@/config/rule34_network_config";
import { toTagSet } from "@/utils/pure/tag";

export class FavoritesLoader {
  private readonly favoritesPageId: string;
  private readonly store: FavoritesStore;
  private readonly arena: FavoritesArena;

  constructor(environment: Environment) {
    this.favoritesPageId = environment.favoritesPageId ?? "";
    const databaseKey = `user${environment.onFavoritesPage ? this.favoritesPageId : environment.userId}`;

    this.store = new FavoritesStore(databaseKey);
    this.arena = new FavoritesArena();
  }

  public readStoredFavorites(): Promise<FavoritesItem[]> {
    return this.store.readAll().then(posts => posts.map(post => new FavoritesItem(post, this.arena)));
  }

  public streamStoredFavorites(onBatch: (favorites: FavoritesItem[]) => void): Promise<void> {
    return this.store.streamAll(posts => onBatch(posts.map(post => new FavoritesItem(post, this.arena))));
  }

  public compressFavorites(): void {
    this.arena.compress();
  }

  public countStoredFavorites(): Promise<number> {
    return this.store.count();
  }

  public fetchAllFavorites(onFavoritesFound: (favorites: FavoritesItem[]) => void, firstPageFavorites?: HTMLElement[]): Promise<void> {
    return new FavoritesConcurrentFetcher((elements: HTMLElement[]): void => {
      onFavoritesFound(elements.map(element => new FavoritesItem(element, this.arena)));
    }, this.favoritesPageId, firstPageFavorites).fetchAllFavorites();
  }

  public fetchNewFavorites(existingIds: Set<string>, firstPageFavorites?: HTMLElement[]): Promise<FavoritesItem[]> {
    return new FavoritesSequentialFetcher(Rule34NetworkConfig.favoritesPageFetchDelay, Rule34NetworkConfig.favoritesPageFetchRetries, this.favoritesPageId)
      .fetchNewFavorites(existingIds, firstPageFavorites)
      .then(elements => elements.map(element => new FavoritesItem(element, this.arena)));
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
