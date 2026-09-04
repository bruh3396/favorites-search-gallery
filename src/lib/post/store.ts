import { StoredPost, postToStoredPost, storedPostToPost } from "@/lib/post/stored_post";
import { postIsComplete, postIsStale } from "@/lib/post/status";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { KeyedDatabase } from "@/lib/storage/database";
import { Post } from "@/types/api";

const database = new KeyedDatabase<StoredPost>("Posts", "posts");
const databaseWriter = new CoalescingExecutor<StoredPost>(100, 1_000, database.write.bind(database));

export function write(post: Post): void {
  if (postIsComplete(post)) {
    databaseWriter.schedule(postToStoredPost(post));
  }
}

export function writeAll(posts: Post[]): Promise<void> {
  return database.write(posts.filter(postIsComplete).map(postToStoredPost));
}

export async function readMany(ids: string[]): Promise<Post[]> {
  return (await database.readMany(ids))
    .map(storedPostToPost)
    .filter(post => !postIsStale(post));
}
