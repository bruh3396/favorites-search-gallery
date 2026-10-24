import { IndexedDbClient, IndexedDbClientConfiguration } from "@/adapters/browser/indexed_db/client";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/local_posts";
import { Post } from "@/core/domain/post/post";
import { decodePost } from "@/adapters/frozen_cobalt/client/decoder";
import { CachePage, fetchCachePage } from "@/targets/lab/local_frozen_cobalt";
import { mintMedia } from "@/adapters/rule34_cdn/client/locator";

export const LAB_NAMESPACE = "fsg-lab";
export const LAB_OWNER_ID = "lab";
export const LAB_INDEXED_DB_CONFIGURATION: IndexedDbClientConfiguration = {
  databaseName: LAB_NAMESPACE,
  legacyDatabaseNames: null
};
const CORPUS_OWNER_ID = "corpus";
const RESET_FLAG = `${LAB_NAMESPACE}-reset`;
const WRITE_BATCH_SIZE = 10_000;

const indexedDb = new IndexedDbClient(LAB_INDEXED_DB_CONFIGURATION, mintMedia);
const localPosts = new IndexedDbLocalPosts(indexedDb);
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

export async function pickCorpusFile(): Promise<File | null> {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = ".ndjson";
  const file = await new Promise<File | undefined>(resolve => {
    input.onchange = (): void => resolve(input.files?.[0]);
    input.oncancel = (): void => resolve(undefined);
    input.click();
  });
  return file ?? null;
}

export async function importCorpus(file: File, onProgress: (count: number) => void): Promise<void> {
  const ids: string[] = [];
  let batch: Post[] = [];

  for await (const line of readLines(file)) {
    if (line.trim() !== "") {
      batch.push(JSON.parse(line) as Post);
    }

    if (batch.length === WRITE_BATCH_SIZE) {
      ids.push(...await writePosts(batch));
      batch = [];
      onProgress(ids.length);
    }
  }
  ids.push(...await writePosts(batch));
  await writeCorpusOrder(ids);
}

export async function pullCorpus(onProgress: (count: number) => void): Promise<void> {
  const ids: string[] = [];
  let nextPage: Promise<CachePage> | null = fetchCachePage(0);

  while (nextPage !== null) {
    const page: CachePage = await nextPage;

    nextPage = page.next === null ? null : fetchCachePage(page.next);
    const posts = page.posts.flatMap(post => {
      try {
        return [decodePost(post, mintMedia).post];
      } catch {
        return [];
      }
    });

    ids.push(...await writePosts(posts));
    onProgress(ids.length);
  }
  await writeCorpusOrder(ids.sort((a, b) => Number(b) - Number(a)));
}

export async function exportCorpus(): Promise<number> {
  const ids = await corpusOrder.getAll();
  const parts: string[] = [];

  for (let start = 0; start < ids.length; start += WRITE_BATCH_SIZE) {
    const chunk = ids.slice(start, start + WRITE_BATCH_SIZE);
    const postsById = new Map((await localPosts.getMany(chunk)).map(post => [post.id, post]));

    for (const id of chunk) {
      const post = postsById.get(id);

      if (post !== undefined) {
        parts.push(`${JSON.stringify(post)}\n`);
      }
    }
  }
  const link = document.createElement("a");

  link.href = URL.createObjectURL(new Blob(parts));
  link.download = `corpus_${parts.length}.ndjson`;
  link.click();
  return parts.length;
}

async function writePosts(posts: readonly Post[]): Promise<string[]> {
  await localPosts.setMany(posts);
  return posts.map(post => post.id);
}

async function writeCorpusOrder(ids: readonly string[]): Promise<void> {
  await corpusOrder.setAll(ids);
  await labFavorites.setAll(ids);
}

async function *readLines(file: File): AsyncGenerator<string> {
  const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
  let rest = "";

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }
    const lines = (rest + value).split("\n");

    rest = lines.pop() ?? "";
    yield* lines;
  }
  yield rest;
}
