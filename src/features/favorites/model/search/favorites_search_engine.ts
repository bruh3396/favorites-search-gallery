import { BatchExecutor } from "../../../../lib/core/concurrency/batch_executor";
import { DO_NOTHING } from "../../../../lib/environment/constants";
import { FavoriteItem } from "../../type/favorite_item";
import { FavoritesSettings } from "../../../../config/favorites_settings";
import { InvertedIndex } from "../../../../lib/core/data_structures/inverted_index";
import { SearchEngine } from "../../../../lib/search/engine/search_engine";
import { SearchQuery } from "../../../../lib/search/query/search_query";
import { ThrottledQueue } from "../../../../lib/core/concurrency/throttled_queue";
import { sleep } from "../../../../lib/core/scheduling/promise";
import { splitIntoChunks } from "../../../../utils/collection/array";

const BATCH_SIZE = 750;
const BATCH_SLEEP_TIME = 0;

const INDEX = new InvertedIndex<FavoriteItem>(favorite => favorite.tags, !FavoritesSettings.buildIndexAsync);
const ENGINE = new SearchEngine(INDEX);

const batchExecutor: BatchExecutor<FavoriteItem> = new BatchExecutor<FavoriteItem>(BATCH_SIZE, 100, addBatch);
const addQueue: ThrottledQueue = new ThrottledQueue(BATCH_SLEEP_TIME);
const asyncItemsToAdd: Set<FavoriteItem> = new Set<FavoriteItem>();
const cachedAsyncItemsToAdd: FavoriteItem[] = [];
let asyncBuildStarted: boolean = false;

export const removeItem = INDEX.removeDoc.bind(INDEX);
export let addItem: (item: FavoriteItem) => void = INDEX.addDoc.bind(INDEX);
export let ready = false;

export function search(searchQuery: SearchQuery<FavoriteItem>, candidates: FavoriteItem[]): FavoriteItem[] {
  return ENGINE.search(searchQuery, candidates);
}

export function setup(): void {
  if (!FavoritesSettings.useSearchEngine) {
    addItem = DO_NOTHING;
    return;
  }

  if (FavoritesSettings.buildIndexAsync) {
    addItem = cacheAdditionsWhileFavoritesAreLoading;
    return;
  }
  ready = true;
}

export async function buildIndexAsync(): Promise<void> {
  if (!FavoritesSettings.useSearchEngine || asyncBuildStarted) {
    return;
  }
  asyncBuildStarted = true;
  await sleep(50);
  INDEX.maintainSortOrder(false);
  addItem = addAsynchronously;
  emptyAdditionsCache();
}

export function buildIndexSync(): void {
  addItem = INDEX.addDoc.bind(INDEX);
  ready = true;
}

function emptyAdditionsCache(): void {
  const chunks = splitIntoChunks(cachedAsyncItemsToAdd, BATCH_SIZE);

  for (const chunk of chunks) {
    for (const item of chunk) {
      asyncItemsToAdd.add(item);
    }
  }

  for (const chunk of chunks) {
    addBatch(chunk);
  }
}

function cacheAdditionsWhileFavoritesAreLoading(item: FavoriteItem): void {
  cachedAsyncItemsToAdd.push(item);
}

function addAsynchronously(item: FavoriteItem): void {
  ready = false;
  asyncItemsToAdd.add(item);
  batchExecutor.add(item);
}

async function addBatch(batch: FavoriteItem[]): Promise<void> {
  await addQueue.wait();

  for (const item of batch) {
    INDEX.addDoc(item);
    asyncItemsToAdd.delete(item);
  }
  ready = asyncItemsToAdd.size === 0;

  if (ready) {
    addItem = INDEX.addDoc.bind(INDEX);
    INDEX.maintainSortOrder(true);
    INDEX.getIndexedTerms();
  }
}
