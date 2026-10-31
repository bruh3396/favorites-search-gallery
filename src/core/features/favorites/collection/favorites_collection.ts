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
  private readonly favorites = new IdentifiedList<ArenaFavorite>();
  private readonly columnarArena: FavoritesColumnarArena;
  readonly #hydrated = new Emitter<Favorite>();

  constructor(stringInterner: StringInterner) {
    this.columnarArena = new FavoritesColumnarArena(stringInterner);
  }

  public get hydrated(): Occurrence<Favorite> {
    return this.#hydrated;
  }

  public get size(): number {
    return this.favorites.size;
  }

  public append(posts: Post[]): ArenaFavorite[] {
    const arenaFavorites = posts.map(post => new ArenaFavorite(post, this.columnarArena));

    this.favorites.append(arenaFavorites);
    return arenaFavorites;
  }

  public prependAsNew(posts: Post[]): ArenaFavorite[] {
    const arenaFavorites = posts.map(post => this.favorites.get(post.id) ?? new ArenaFavorite(post, this.columnarArena));

    this.favorites.prepend(arenaFavorites);
    arenaFavorites.forEach(arenaFavorite => this.columnarArena.markNew(arenaFavorite.slot));
    return arenaFavorites;
  }

  public getAll(): ArenaFavorite[] {
    return this.favorites.getAll();
  }

  public slice(start: number, end: number): ArenaFavorite[] {
    return this.favorites.slice(start, end);
  }

  public getAllPostIds(): Set<string> {
    return this.favorites.getAllIds();
  }

  public overwrite(post: Post): FavoriteOverwrite | undefined {
    const arenaFavorite = this.favorites.get(post.id);

    if (arenaFavorite === undefined) {
      return undefined;
    }
    const previousTags = arenaFavorite.tags;
    const wasMediaAvailable = hasMedia(arenaFavorite.media);

    this.columnarArena.write(arenaFavorite.slot, post);

    if (!wasMediaAvailable && hasMedia(arenaFavorite.media)) {
      this.#hydrated.emit(arenaFavorite);
    }
    return { favorite: arenaFavorite, previousTags };
  }

  public compact(): void {
    this.columnarArena.compact();
  }
}
