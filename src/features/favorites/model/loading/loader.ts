import { CategorizedPost, Post } from "@/core/domain/post/post";
import { Collection, PostLibrary, Searcher } from "@/features/favorites/types/types";
import { CoalescingExecutor } from "@/core/utils/async/coalescing";
import { Favorite } from "@/types/favorite";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { TermUpdate } from "@/lib/search/engines/search_engine";

const STREAM_BATCH_SIZE = 1_000;
const SEARCHER_UPDATE_BATCH_SIZE = 50;
const SEARCHER_UPDATE_DELAY = 1_500;

interface LoaderDependencies {
  remoteFavorites: Pick<RemoteFavorites, "fetchAllExcept">;
  localFavorites: Pick<LocalFavorites, "getAll" | "prepend">;
  localTagCategories: LocalTagCategories;
  postLibrary: PostLibrary;
  collection: Collection;
  searcher: Searcher;
  scheduler: Scheduler;
}

export class FavoritesLoader {
  private readonly remoteFavorites: Pick<RemoteFavorites, "fetchAllExcept">;
  private readonly localFavorites: Pick<LocalFavorites, "getAll" | "prepend">;
  private readonly localTagCategories: LocalTagCategories;
  private readonly postLibrary: PostLibrary;
  private readonly collection: Collection;
  private readonly searcher: Searcher;
  private readonly searcherUpdater: CoalescingExecutor<TermUpdate<Favorite>>;

  constructor(dependencies: LoaderDependencies) {
    this.remoteFavorites = dependencies.remoteFavorites;
    this.localFavorites = dependencies.localFavorites;
    this.localTagCategories = dependencies.localTagCategories;
    this.postLibrary = dependencies.postLibrary;
    this.collection = dependencies.collection;
    this.searcher = dependencies.searcher;
    this.searcherUpdater = new CoalescingExecutor(SEARCHER_UPDATE_BATCH_SIZE, SEARCHER_UPDATE_DELAY, updates => this.searcher.update(updates), dependencies.scheduler);
  }

  public async streamStored(onProgress: (posts: Post[]) => void): Promise<void> {
    const loaded: Post[] = [];

    await this.postLibrary.streamAll(await this.localFavorites.getAll(), STREAM_BATCH_SIZE, posts => {
      this.collection.append(posts);
      loaded.push(...posts);
      onProgress(posts);
    });
    this.postLibrary.refreshAll(loaded);
  }

  public async fetchAll(onSearchResultsFound: (newSearchResults: Favorite[]) => void): Promise<void> {
    const stored: Promise<void>[] = [];

    await this.remoteFavorites.fetchAllExcept(new Set(), posts => {
      const favorites = this.collection.appendDirty(posts);

      this.searcher.add(favorites);
      stored.push(this.postLibrary.storeMissing(posts).then(() => {
        this.postLibrary.refreshAll(posts);
      }));
      onSearchResultsFound(this.searcher.appendResults(favorites));
    });
    await Promise.all(stored);
  }

  public async fetchNew(): Promise<Favorite[]> {
    const posts: Post[] = [];

    await this.remoteFavorites.fetchAllExcept(this.collection.getAllIds(), found => posts.push(...found));

    if (posts.length === 0) {
      return [];
    }
    const newFavorites = this.collection.prependDirty(posts);

    this.searcher.add(newFavorites);
    await this.postLibrary.storeMissing(posts);
    this.postLibrary.refreshAll(posts);
    return newFavorites;
  }

  public storeMembership(favorites: Favorite[]): Promise<void> {
    return this.localFavorites.prepend(favorites.map(favorite => favorite.id));
  }

  public applyRefreshed({ post, tagCategories }: CategorizedPost): void {
    const favorite = this.collection.get(post.id);

    if (tagCategories.size > 0) {
      this.localTagCategories.setMany(tagCategories).catch(console.error);
    }

    if (favorite === undefined) {
      return;
    }
    const oldTags = new Set(favorite.tags);

    favorite.enrich(post);

    if (oldTags.symmetricDifference(favorite.tags).size > 0) {
      this.searcherUpdater.schedule({ doc: favorite, oldTerms: oldTags, newTerms: favorite.tags });
    }
  }
}
