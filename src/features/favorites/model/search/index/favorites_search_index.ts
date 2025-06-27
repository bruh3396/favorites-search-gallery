import { BatchExecutor } from "../../../../../lib/components/batch_executor";
import { DO_NOTHING } from "../../../../../config/constants";
import { FavoriteItem } from "../../../types/favorite/favorite_item";
import { FavoritesSettings } from "../../../../../config/favorites_settings";
import { InvertedSearchIndex } from "./inverted_search_index";
import { ThrottledQueue } from "../../../../../lib/components/throttled_queue";
import { sleep } from "../../../../../utils/misc/async";
import { splitIntoChunks } from "../../../../../utils/collection/array";

const BATCH_SIZE = 750;
const BATCH_SLEEP_TIME = 0;

class FavoritesSearchIndex extends InvertedSearchIndex<FavoriteItem> {
  public ready: boolean = false;
  private asyncBuildStarted: boolean = false;
  private batchExecutor: BatchExecutor<FavoriteItem> = new BatchExecutor<FavoriteItem>(BATCH_SIZE, 100, this.addBatch.bind(this));
  private addQueue: ThrottledQueue = new ThrottledQueue(BATCH_SLEEP_TIME);
  private asyncItemsToAdd: Set<FavoriteItem> = new Set<FavoriteItem>();
  private cachedAsyncItemsToAdd: FavoriteItem[] = [];

  constructor() {
    super();

    if (!FavoritesSettings.useSearchIndex) {
      this.add = DO_NOTHING;
      return;
    }

    if (FavoritesSettings.buildIndexAsynchronously) {
      this.add = this.cacheAdditionsWhileFavoritesAreLoading;
      return;
    }
    this.ready = true;
  }

  public async buildIndexAsynchronously(): Promise<void> {
    if (!FavoritesSettings.useSearchIndex || this.asyncBuildStarted) {
      return;
    }
    this.asyncBuildStarted = true;
    await sleep(50);
    this.keepIndexedTagsSorted(false);
    this.add = this.addAsynchronously;
    this.emptyAdditionsCache();
  }

  public buildIndexSynchronously(): void {
    this.add = super.add;
    this.ready = true;
  }

  private emptyAdditionsCache(): void {
    const chunks = splitIntoChunks(this.cachedAsyncItemsToAdd, BATCH_SIZE);

    for (const chunk of chunks) {
      for (const item of chunk) {
        this.asyncItemsToAdd.add(item);
      }
    }

    for (const chunk of chunks) {
      this.addBatch(chunk);
    }
  }

  private cacheAdditionsWhileFavoritesAreLoading(item: FavoriteItem): void {
    this.cachedAsyncItemsToAdd.push(item);
  }

  private addAsynchronously(item: FavoriteItem): void {
    this.ready = false;
    this.asyncItemsToAdd.add(item);
    this.batchExecutor.add(item);
  }

  private async addBatch(batch: FavoriteItem[]): Promise<void> {
    await this.addQueue.wait();

    for (const item of batch) {
      super.add(item);
      this.asyncItemsToAdd.delete(item);
    }
    this.ready = this.asyncItemsToAdd.size === 0;

    if (this.ready) {
      this.keepIndexedTagsSorted(true);
      this.sortTags();
    }
  }
}

export const FAVORITES_SEARCH_INDEX: FavoritesSearchIndex = new FavoritesSearchIndex();
