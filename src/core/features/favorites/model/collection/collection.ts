import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { Post, Rating } from "@/core/domain/post/post";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesArenaFavorite } from "@/core/features/favorites/model/collection/arena_favorite";
import { FavoritesColumnarArena } from "@/core/features/favorites/model/collection/columnar_arena";
import { IdentifiedList } from "@/core/utils/collection/identified_list";
import { TermUpdate } from "@/core/search/engines/search_engine";

export class FavoritesCollection {
  private readonly list = new IdentifiedList<FavoritesArenaFavorite>();
  private readonly arena = new FavoritesColumnarArena();
  private readonly hydratedFavorites = new Emitter<Favorite>();

  public get hydrated(): Occurrence<Favorite> {
    return this.hydratedFavorites;
  }

  public append(posts: Post[]): FavoritesArenaFavorite[] {
    const favorites = posts.map(post => new FavoritesArenaFavorite(post, this.arena));

    this.list.append(favorites);
    return favorites;
  }

  public prependAsNew(posts: Post[]): FavoritesArenaFavorite[] {
    const favorites = posts.map(post => this.list.get(post.id) ?? new FavoritesArenaFavorite(post, this.arena));

    this.list.prepend(favorites);
    favorites.forEach(favorite => this.arena.markNew(favorite.slot));
    return favorites;
  }

  public findFavorite(id: string): FavoritesArenaFavorite | undefined {
    return this.list.get(id);
  }

  public findPost(id: string): Post | undefined {
    const favorite = this.list.get(id);
    return favorite === undefined ? undefined : this.arena.getPost(favorite.slot);
  }

  public getAll(): FavoritesArenaFavorite[] {
    return this.list.getAll();
  }

  public getAllIds(): Set<string> {
    return this.list.getAllIds();
  }

  public getRating(id: string): Rating {
    return this.arena.getRating(this.getSlot(id));
  }

  public overwrite(post: Post): TermUpdate<Favorite> | undefined {
    const favorite = this.list.get(post.id);

    if (favorite === undefined) {
      return undefined;
    }
    const oldTerms = favorite.tags;
    const wasPlaceholder = favorite.media.locator === "";

    this.arena.write(favorite.slot, post);
    const newTerms = favorite.tags;

    if (wasPlaceholder && favorite.media.locator !== "") {
      this.hydratedFavorites.emit(favorite);
    }
    return oldTerms.symmetricDifference(newTerms).size > 0 ? { doc: favorite, oldTerms, newTerms } : undefined;
  }

  public clearTagCache(): void {
    this.arena.clearTagCache();
  }

  public compact(): void {
    this.arena.compact();
  }

  private getSlot(id: string): number {
    const favorite = this.list.get(id);

    if (favorite === undefined) {
      throw new Error(`favorite ${id} is not in the collection`);
    }
    return favorite.slot;
  }
}
