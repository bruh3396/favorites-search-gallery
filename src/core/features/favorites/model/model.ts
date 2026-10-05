import { Post, Rating } from "@/core/domain/post/post";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesCollection } from "@/core/features/favorites/model/collection/collection";
import { FavoritesResults } from "@/core/features/favorites/model/results/results";
import { FavoritesSearcher } from "@/core/features/favorites/model/search/searcher";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Readable } from "@/core/utils/reactive/signal";
import { ResultsState } from "@/core/features/favorites/types/results";
import { SearchCriteria } from "@/core/features/favorites/types/search";
import { TermUpdate } from "@/core/search/engines/search_engine";

export class FavoritesModel {
  private readonly collection = new FavoritesCollection();
  private readonly searchResults = new FavoritesResults();
  private readonly searcher = new FavoritesSearcher({ ratingFor: (favorite: Favorite): Rating => this.collection.getRating(favorite.id) });

  public get results(): Readable<ResultsState> {
    return this.searchResults.state;
  }

  public get filled(): Occurrence<Favorite> {
    return this.collection.filled;
  }

  public append(posts: Post[]): Favorite[] {
    return this.collection.append(posts);
  }

  public prependAsNew(posts: Post[]): Favorite[] {
    return this.collection.prependAsNew(posts);
  }

  public find(id: string): Favorite | undefined {
    return this.collection.find(id);
  }

  public findPost(id: string): Post | undefined {
    return this.collection.findPost(id);
  }

  public getAll(): Favorite[] {
    return this.collection.getAll();
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

  public indexAll(): void {
    this.searcher.index(this.collection.getAll());
    this.collection.clearTagCache();
  }

  public addToIndex(favorites: Favorite[]): void {
    this.searcher.add(favorites);
    this.collection.clearTagCache();
  }

  public updateIndex(updates: readonly TermUpdate<Favorite>[]): void {
    this.searcher.update(updates);
  }

  public search(criteria: SearchCriteria): void {
    this.searchResults.replace(this.searcher.search(this.collection.getAll(), criteria));
  }

  public appendMatches(favorites: Favorite[], criteria: SearchCriteria): void {
    this.searchResults.append(this.searcher.match(favorites, criteria));
  }

  public invert(criteria: SearchCriteria): void {
    this.searchResults.replace(this.searcher.invert(this.searchResults.state.peek().matches, criteria));
  }

  public shuffle(seed: number): void {
    this.searchResults.replace(this.searcher.shuffle(this.searchResults.state.peek().matches, seed));
  }

  public setPage(pageNumber: number): void {
    this.searchResults.setPage(pageNumber);
  }
}
