import { Post, postHasDimensions, postIsStale } from "@/core/domain/post/post";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { KeyedDatabase } from "@/lib/storage/database";

const database = new KeyedDatabase<Post>("Posts", "posts");
const databaseWriter = new CoalescingExecutor<Post>(25, 2_000, database.write.bind(database));

export function write(post: Post): void {
  if (postHasDimensions(post)) {
    databaseWriter.schedule(post);
  }
}

export function writeAll(posts: Post[]): Promise<void> {
  return database.write(posts.filter(postHasDimensions));
}

export function readMany(ids: string[]): Promise<Post[]> {
  return database.readMany(ids).then(posts => posts.filter(post => !postIsStale(post)));
}
