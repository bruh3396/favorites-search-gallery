import { PaginationResult, PaginationSettings } from "@/core/features/favorites/types/pagination";
import { Readable, Signal, computed } from "@/core/utils/reactive/signal";
import { BitSearchEngine } from "@/core/search/engines/bit/bit_search_engine";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesCollection } from "@/core/features/favorites/model/collection/collection";
import { FavoritesSearcher } from "@/core/features/favorites/model/search/searcher";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Post } from "@/core/domain/post/post";
import { SearchRequest } from "@/core/features/favorites/types/search";
import { TermUpdate } from "@/core/search/engines/search_engine";
import { clamp } from "@/core/utils/number/number";
import { paginate } from "@/core/features/favorites/model/pagination/pagination";

export interface FavoritesModelConfiguration {
  favoritedByDefault: boolean;
}

export interface FavoritesModelDependencies {
  request: Readable<SearchRequest>;
  paginationSettings: Readable<PaginationSettings>;
}

export class FavoritesModel {
  private readonly collection: FavoritesCollection;
  private readonly engine: BitSearchEngine<Favorite>;
  private readonly searcher: FavoritesSearcher;
  private readonly favorited: Signal<ReadonlyMap<string, boolean>>;
  private readonly currentResults: Signal<Favorite[]>;
  private readonly pageNumber: Signal<number>;
  private readonly currentPagination: Readable<PaginationResult>;

  constructor(
    private readonly configuration: FavoritesModelConfiguration,
    private readonly dependencies: FavoritesModelDependencies
  ) {
    this.collection = new FavoritesCollection();
    this.engine = new BitSearchEngine<Favorite>(favorite => favorite.tags, (favorite, metric) => favorite.getMetric(metric));
    this.favorited = new Signal<ReadonlyMap<string, boolean>>(new Map());
    this.pageNumber = new Signal(1);
    this.searcher = new FavoritesSearcher({
      engine: this.engine, getRatingBit: (favorite): number => this.collection.getRatingBit(favorite)
    });
    this.currentResults = new Signal<Favorite[]>([]);
    this.currentPagination = computed(() => paginate(dependencies.paginationSettings.value, {
      pageNumber: this.pageNumber.value, results: this.currentResults.value
    }));
  }

  public get searchResults(): Readable<Favorite[]> {
    return this.currentResults;
  }

  public get paginationResult(): Readable<PaginationResult> {
    return this.currentPagination;
  }

  public get hydrated(): Occurrence<Favorite> {
    return this.collection.hydrated;
  }

  public append(posts: Post[]): Favorite[] {
    return this.collection.append(posts);
  }

  public prependAsNew(posts: Post[]): Favorite[] {
    return this.collection.prependAsNew(posts);
  }

  public getAllIds(): Set<string> {
    return this.collection.getAllIds();
  }

  public overwrite(post: Post): TermUpdate<Favorite> | undefined {
    return this.collection.overwrite(post);
  }

  public compact(): void {
    this.collection.compact();
  }

  public rebuild(): void {
    this.engine.rebuild(this.collection.getAll());
    this.collection.clearTagCache();
  }

  public add(favorites: Favorite[]): void {
    this.engine.add(favorites);
    this.collection.clearTagCache();
    // eslint-disable-next-line unicorn/prefer-spread
    this.currentResults.value = this.currentResults.peek().concat(this.searcher.match(this.dependencies.request.peek(), favorites));
  }

  public update(updates: readonly TermUpdate<Favorite>[]): void {
    this.engine.update(updates);
  }

  public search(): void {
    this.currentResults.value = this.searcher.search(this.dependencies.request.peek());
  }

  public goToPage(pageNumber: number): void {
    this.pageNumber.value = clamp(pageNumber, 1, this.currentPagination.peek().totalPages);
  }

  public isFavorited(id: string): boolean {
    return this.favorited.value.get(id) ?? this.configuration.favoritedByDefault;
  }

  public recordAddition(id: string): void {
    this.favorited.value = new Map(this.favorited.peek()).set(id, true);
  }

  public recordRemoval(id: string): void {
    this.favorited.value = new Map(this.favorited.peek()).set(id, false);
  }
}
