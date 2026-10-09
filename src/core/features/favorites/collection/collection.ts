import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesArenaFavorite } from "@/core/features/favorites/collection/arena_favorite";
import { FavoritesColumnarArena } from "@/core/features/favorites/collection/columnar_arena";
import { IdentifiedList } from "@/core/utils/collection/identified_list";
import { Post } from "@/core/domain/post/post";
import { TermUpdate } from "@/core/search/engines/search_engine";

export class FavoritesCollection {
  private readonly list = new IdentifiedList<FavoritesArenaFavorite>();
  private readonly arena = new FavoritesColumnarArena();
  private readonly updatedFavorites = new Emitter<Favorite>();

  public get updates(): Occurrence<Favorite> {
    return this.updatedFavorites;
  }

  public get size(): number {
    return this.list.size;
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

  public getAll(): FavoritesArenaFavorite[] {
    return this.list.getAll();
  }

  public slice(start: number, end: number): FavoritesArenaFavorite[] {
    return this.list.slice(start, end);
  }

  public getAllIds(): Set<string> {
    return this.list.getAllIds();
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
      this.updatedFavorites.emit(favorite);
    }
    return oldTerms.symmetricDifference(newTerms).size > 0 ? { doc: favorite, oldTerms, newTerms } : undefined;
  }

  public clearTagCache(): void {
    this.arena.clearTagCache();
  }

  public compact(): void {
    this.arena.compact();
  }
}
