import { Emitter } from "@/core/utils/reactive/emitter";
import { Occurrence } from "@/core/utils/reactive/occurrence";
import { ArenaFavorite } from "@/core/features/favorites/collection/arena_favorite";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesColumnarArena } from "@/core/features/favorites/collection/favorites_columnar_arena";
import { IdentifiedList } from "@/core/utils/collection/identified_list";
import { Post } from "@/core/domain/post/post";
import { StringInterner } from "@/core/utils/string/string_interner";
import { hasMedia } from "@/core/domain/media/media";

interface FavoriteOverwrite {
  readonly favorite: Favorite;
  readonly previousTags: ReadonlySet<string>;
}

export class FavoritesCollection {
  private readonly list = new IdentifiedList<ArenaFavorite>();
  private readonly arena: FavoritesColumnarArena;
  private readonly hydratedFavorites = new Emitter<Favorite>();

  constructor(stringInterner: StringInterner) {
    this.arena = new FavoritesColumnarArena(stringInterner);
  }

  public get hydrated(): Occurrence<Favorite> {
    return this.hydratedFavorites;
  }

  public get size(): number {
    return this.list.size;
  }

  public append(posts: Post[]): ArenaFavorite[] {
    const favorites = posts.map(post => new ArenaFavorite(post, this.arena));

    this.list.append(favorites);
    return favorites;
  }

  public prependAsNew(posts: Post[]): ArenaFavorite[] {
    const favorites = posts.map(post => this.list.get(post.id) ?? new ArenaFavorite(post, this.arena));

    this.list.prepend(favorites);
    favorites.forEach(favorite => this.arena.markNew(favorite.slot));
    return favorites;
  }

  public getAll(): ArenaFavorite[] {
    return this.list.getAll();
  }

  public slice(start: number, end: number): ArenaFavorite[] {
    return this.list.slice(start, end);
  }

  public getAllPostIds(): Set<string> {
    return this.list.getAllIds();
  }

  public overwrite(post: Post): FavoriteOverwrite | undefined {
    const favorite = this.list.get(post.id);

    if (favorite === undefined) {
      return undefined;
    }
    const previousTags = favorite.tags;
    const wasMediaAvailable = hasMedia(favorite.media);

    this.arena.write(favorite.slot, post);

    if (!wasMediaAvailable && hasMedia(favorite.media)) {
      this.hydratedFavorites.emit(favorite);
    }
    return { favorite, previousTags };
  }

  public compact(): void {
    this.arena.compact();
  }
}
