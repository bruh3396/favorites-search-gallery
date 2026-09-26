import { CoalescingExecutor } from "@/lib/async/coalescing";
import { DatabaseLike } from "@/lib/storage/database";
import { Post } from "@/types/api";
import { Store } from "@/features/favorites/types/types";
import { toTagSet } from "@/utils/pure/tag";

export class FavoritesStore implements Store {
  private readonly database: DatabaseLike<Post>;
  private readonly databaseUpdater: CoalescingExecutor<Post>;
  private isDatabaseEmpty = true;

  constructor(database: DatabaseLike<Post>) {
    this.database = database;
    this.databaseUpdater = new CoalescingExecutor<Post>(100, 1_000, this.database.update.bind(this.database));
  }

  public async readAll(): Promise<Post[]> {
    const records = (await this.database.exists()) ? (await this.database.readAll()) : [];

    this.isDatabaseEmpty = records.length === 0;
    return records;
  }

  public async streamAll(onBatch: (posts: Post[]) => void): Promise<void> {
    if (!(await this.database.exists())) {
      this.isDatabaseEmpty = true;
      return;
    }
    let hasStreamedAny = false;

    await this.database.readAllStreamed((posts) => {
      hasStreamedAny = true;
      onBatch(posts);
    }, 1_000);
    this.isDatabaseEmpty = !hasStreamedAny;
  }

  public async readMany(ids: string[]): Promise<Post[]> {
    return (await this.database.exists()) ? this.database.readMany(ids) : [];
  }

  public async readTags(ids: string[]): Promise<Map<string, Set<string>>> {
    const posts = await this.readMany(ids);
    return new Map(posts.map(post => [post.id, toTagSet(post.tags)]));
  }

  public async readIds(): Promise<string[]> {
    return (await this.database.exists()) ? this.database.readAllIds() : [];
  }

  public async writeAll(posts: Post[]): Promise<void> {
    await this.database.write([...posts].reverse());
    this.isDatabaseEmpty = false;
  }

  public overwrite(post: Post): void {
    if (!this.isDatabaseEmpty) {
      this.databaseUpdater.schedule(post);
    }
  }

  public delete(id: string): Promise<void> {
    return this.database.delete([id]);
  }

  public exists(): Promise<boolean> {
    return this.database.exists();
  }

  public async count(): Promise<number> {
    return (await this.database.exists()) ? this.database.count() : 0;
  }

  public async hasAny(): Promise<boolean> {
    return (await this.database.exists()) && (await this.database.count()) > 0;
  }

  public destroy(): Promise<void> {
    return this.database.destroy();
  }
}
