import { postIsComplete, postIsStale } from "@/lib/post/status";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { KeyedDatabase } from "@/lib/storage/database";
import { Post } from "@/types/api";

const database = new KeyedDatabase<Post>("Posts", "posts");
const databaseWriter = new CoalescingExecutor<Post>(25, 2_000, database.write.bind(database));

export function write(post: Post): void {
  if (postIsComplete(post)) {
    databaseWriter.schedule(post);
  }
}

export function writeAll(posts: Post[]): Promise<void> {
  return database.write(posts.filter(postIsComplete));
}

export function readMany(ids: string[]): Promise<Post[]> {
  return database.readMany(ids).then(posts => posts.filter(post => !postIsStale(post)));
}
