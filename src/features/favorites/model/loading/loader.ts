import { CategorizedPost, Post } from "@/core/domain/post/post";
import { Collection, LoadProgress, PostLibrary, PulledFavorites, Searcher } from "@/features/favorites/types/types";
import { CoalescingExecutor } from "@/core/utils/async/coalescing";
import { Favorite } from "@/types/favorite";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { TermUpdate } from "@/lib/search/engines/search_engine";

const STREAM_BATCH_SIZE = 1_000;
const SEARCHER_UPDATE_COALESCING = { flushSize: 50, flushTimeout: 1_500 };

interface LoaderDependencies {
  remoteFavorites: Pick<RemoteFavorites, "fetchAll" | "findNew" | "findRemoved">;
  localFavorites: Pick<LocalFavorites, "getAll" | "prepend" | "remove">;
  localTagCategories: LocalTagCategories;
  postLibrary: PostLibrary;
  collection: Collection;
  searcher: Searcher;
  scheduler: Scheduler;
  onPlaceholderFilled: (favorite: Favorite) => void;
}

export class FavoritesLoader {
  private readonly remoteFavorites: Pick<RemoteFavorites, "fetchAll" | "findNew" | "findRemoved">;
  private readonly localFavorites: Pick<LocalFavorites, "getAll" | "prepend" | "remove">;
  private readonly localTagCategories: LocalTagCategories;
  private readonly postLibrary: PostLibrary;
  private readonly collection: Collection;
  private readonly searcher: Searcher;
  private readonly searcherUpdater: CoalescingExecutor<TermUpdate<Favorite>>;
  private readonly onPlaceholderFilled: (favorite: Favorite) => void;

  constructor(dependencies: LoaderDependencies) {
    this.onPlaceholderFilled = dependencies.onPlaceholderFilled;
    this.remoteFavorites = dependencies.remoteFavorites;
    this.localFavorites = dependencies.localFavorites;
    this.localTagCategories = dependencies.localTagCategories;
    this.postLibrary = dependencies.postLibrary;
    this.collection = dependencies.collection;
    this.searcher = dependencies.searcher;
    this.searcherUpdater = new CoalescingExecutor(SEARCHER_UPDATE_COALESCING, {
      execute: (updates): void => this.searcher.update(updates),
      scheduler: dependencies.scheduler
    });
  }

  public async streamLocalFavorites(onProgress: (progress: LoadProgress) => void): Promise<void> {
    const localIds = await this.localFavorites.getAll();
    const loaded: Post[] = [];

    onProgress({ loaded: 0, total: localIds.length });
    await this.postLibrary.streamAll(localIds, STREAM_BATCH_SIZE, posts => {
      this.collection.append(posts);
      loaded.push(...posts);
      onProgress({ loaded: loaded.length, total: localIds.length });
    });
    this.postLibrary.refreshAll(loaded);
  }

  public async fetchAllFavorites(onSearchResultsFound: (newSearchResults: Favorite[]) => void): Promise<void> {
    let adoptedPages = Promise.resolve();

    await this.remoteFavorites.fetchAll(posts => {
      adoptedPages = adoptedPages.then(() => this.appendAdoptedPosts(posts, onSearchResultsFound));
    });
    await adoptedPages;
  }

  public async pullNewFavorites(): Promise<PulledFavorites> {
    const localIds = await this.localFavorites.getAll();
    const newPosts = await this.remoteFavorites.findNew(localIds);
    const localIdSet = new Set(localIds);
    const addedPosts = newPosts.filter(post => !localIdSet.has(post.id));
    const addedFavorites = await this.prependAdoptedPosts(addedPosts);

    addedFavorites.forEach(favorite => favorite.markAsNew());
    await this.localFavorites.prepend(newPosts.map(post => post.id));
    return { addedFavorites, prependedCount: newPosts.length };
  }

  public async pruneRemovedFavorites(prependedCount: number): Promise<number> {
    const localIds = (await this.localFavorites.getAll()).slice(prependedCount);
    const removedIds = await this.remoteFavorites.findRemoved(localIds, prependedCount);

    await this.localFavorites.remove(removedIds);
    return removedIds.length;
  }

  public persistFavoritesMembership(): Promise<void> {
    return this.localFavorites.prepend([...this.collection.getAllIds()]);
  }

  public applyRefreshedPost({ post, tagCategories }: CategorizedPost): void {
    const favorite = this.collection.get(post.id);

    if (tagCategories.size > 0) {
      this.localTagCategories.setMany(tagCategories).catch(console.error);
    }

    if (favorite === undefined) {
      return;
    }
    const oldTags = new Set(favorite.tags);
    const wasPlaceholder = favorite.media.locator === "";

    favorite.enrich(post);

    if (oldTags.symmetricDifference(favorite.tags).size > 0) {
      this.searcherUpdater.schedule({ doc: favorite, oldTerms: oldTags, newTerms: favorite.tags });
    }

    if (wasPlaceholder && favorite.media.locator !== "") {
      this.onPlaceholderFilled(favorite);
    }
  }

  private async appendAdoptedPosts(posts: Post[], onSearchResultsFound: (newSearchResults: Favorite[]) => void): Promise<void> {
    const adoptedPosts = await this.postLibrary.adopt(posts);
    const favorites = this.collection.appendDirty(adoptedPosts);

    this.searcher.add(favorites);
    onSearchResultsFound(this.searcher.appendResults(favorites));
    this.postLibrary.refreshAll(adoptedPosts);
  }

  private async prependAdoptedPosts(posts: Post[]): Promise<Favorite[]> {
    if (posts.length === 0) {
      return [];
    }
    const adoptedPosts = await this.postLibrary.adopt(posts);
    const favorites = this.collection.prependDirty(adoptedPosts);

    this.searcher.add(favorites);
    this.postLibrary.refreshAll(adoptedPosts);
    return favorites;
  }
}
