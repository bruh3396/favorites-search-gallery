import { FavoritesColumnarArena } from "@/features/favorites/model/collection/favorites_columnar_arena";
import { FavoritesItem } from "@/features/favorites/model/collection/favorites_item";
import { IdentifiedList } from "@/lib/collection/identified_list";
import { Post } from "@/types/api";

export class FavoritesCollection {
  private readonly list = new IdentifiedList<FavoritesItem>();
  private readonly arena = new FavoritesColumnarArena();

  public setAll(posts: Post[]): FavoritesItem[] {
    const favorites = this.admit(posts, true);

    this.list.setAll(favorites);
    return favorites;
  }

  public append(posts: Post[]): FavoritesItem[] {
    const favorites = this.admit(posts, true);

    this.list.append(favorites);
    return favorites;
  }

  public appendDirty(posts: Post[]): FavoritesItem[] {
    const favorites = this.admit(posts, false);

    this.list.append(favorites);
    return favorites;
  }

  public prependDirty(posts: Post[]): FavoritesItem[] {
    const favorites = this.admit(posts, false);

    this.list.prepend(favorites);
    return favorites;
  }

  public get(id: string): FavoritesItem | undefined {
    return this.list.get(id);
  }

  public getAll(): FavoritesItem[] {
    return this.list.getAll();
  }

  public getAllIds(): Set<string> {
    return this.list.getAllIds();
  }

  public compress(): void {
    this.arena.compress();
  }

  private admit(posts: Post[], tagsAreClean: boolean): FavoritesItem[] {
    return posts.map(post => new FavoritesItem(post, this.arena, tagsAreClean));
  }
}
