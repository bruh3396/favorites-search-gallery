import { IndexedDbClient, IndexedDbClientConfiguration } from "@/adapters/browser/indexed_db/client";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/local_posts";
import { Post } from "@/core/domain/post/post";
import { mintMedia } from "@/adapters/rule34_cdn/client/locator";

interface Corpus {
  readonly posts: readonly Post[];
}

export const LAB_NAMESPACE = "fsg-lab";
export const LAB_OWNER_ID = "lab";
export const LAB_INDEXED_DB_CONFIGURATION: IndexedDbClientConfiguration = {
  databaseName: LAB_NAMESPACE,
  legacyDatabaseNames: null
};
const CORPUS_OWNER_ID = "corpus";
const RESET_FLAG = `${LAB_NAMESPACE}-reset`;

const indexedDb = new IndexedDbClient(LAB_INDEXED_DB_CONFIGURATION, mintMedia);
const labFavorites = new IndexedDbLocalFavorites({ ownerId: LAB_OWNER_ID }, indexedDb);
const corpusOrder = new IndexedDbLocalFavorites({ ownerId: CORPUS_OWNER_ID }, indexedDb);

export async function readCorpusSize(): Promise<number> {
  return (await corpusOrder.getAll()).length;
}

export async function readFavoriteCount(): Promise<number> {
  return (await labFavorites.getAll()).length;
}

export async function setFavoriteCount(count: number): Promise<void> {
  await labFavorites.setAll((await corpusOrder.getAll()).slice(0, count));
}

export function requestReset(): void {
  sessionStorage.setItem(RESET_FLAG, "1");
  location.reload();
}

export async function applyPendingReset(): Promise<void> {
  if (sessionStorage.getItem(RESET_FLAG) === null) {
    return;
  }
  sessionStorage.removeItem(RESET_FLAG);
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(LAB_NAMESPACE);

    request.onsuccess = resolve;
    request.onerror = (): void => reject(request.error);
  });
}

export async function pickCorpus(): Promise<Corpus | null> {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = ".json";
  const file = await new Promise<File | undefined>(resolve => {
    input.onchange = (): void => resolve(input.files?.[0]);
    input.click();
  });
  return file === undefined ? null : JSON.parse(await file.text()) as Corpus;
}

export async function writeCorpus({ posts }: Corpus): Promise<void> {
  const ids = posts.map(post => post.id);

  await new IndexedDbLocalPosts(indexedDb).setMany(posts);
  await corpusOrder.setAll(ids);
  await labFavorites.setAll(ids);
}
