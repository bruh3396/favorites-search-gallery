import { ArenaFavorite } from "@/features/favorites/model/collection/arena_favorite";
import { Collection } from "@/features/favorites/types/types";
import { FavoritesColumnarArena } from "@/features/favorites/model/collection/favorites_columnar_arena";
import { IdentifiedList } from "@/core/utils/collection/identified_list";
import { Post } from "@/core/domain/post/post";
import { RatingMask } from "@/types/search";

export class FavoritesCollection implements Collection {
  private readonly list = new IdentifiedList<ArenaFavorite>();
  private arena = new FavoritesColumnarArena();

  public setAll(posts: Post[]): ArenaFavorite[] {
    if (!this.arena.isEmpty) {
      this.arena = new FavoritesColumnarArena();
    }
    const favorites = this.admit(posts, true);

    this.list.setAll(favorites);
    return favorites;
  }

  public append(posts: Post[]): ArenaFavorite[] {
    const favorites = this.admit(posts, true);

    this.list.append(favorites);
    return favorites;
  }

  public appendDirty(posts: Post[]): ArenaFavorite[] {
    const favorites = this.admit(posts, false);

    this.list.append(favorites);
    return favorites;
  }

  public prependDirty(posts: Post[]): ArenaFavorite[] {
    const favorites = this.admit(posts, false);

    this.list.prepend(favorites);
    return favorites;
  }

  public get(id: string): ArenaFavorite | undefined {
    return this.list.get(id);
  }

  public getAll(): ArenaFavorite[] {
    return this.list.getAll();
  }

  public getAllIds(): Set<string> {
    return this.list.getAllIds();
  }

  public getTags(ids: string[]): Map<string, Set<string>> {
    return new Map(ids.flatMap(id => {
      const favorite = this.list.get(id);
      return favorite === undefined ? [] : [[id, favorite.tags]];
    }));
  }

  public write(post: Post): void {
    const favorite = this.list.get(post.id);

    if (favorite !== undefined) {
      this.arena.write(favorite.index, post);
    }
  }

  public markNew(ids: string[]): void {
    ids.forEach(id => this.arena.markNew(this.getIndex(id)));
  }

  public consumeTags(id: string): Set<string> {
    return this.arena.consumeTagSet(this.getIndex(id));
  }

  public getRating(id: string): RatingMask {
    return this.arena.rating(this.getIndex(id));
  }

  public compress(): void {
    this.arena.compress();
  }

  private admit(posts: Post[], tagsAreClean: boolean): ArenaFavorite[] {
    return posts.map(post => new ArenaFavorite(post, this.arena, tagsAreClean));
  }

  private getIndex(id: string): number {
    const favorite = this.list.get(id);

    if (favorite === undefined) {
      throw new Error(`favorite ${id} is not in the collection`);
    }
    return favorite.index;
  }
}
