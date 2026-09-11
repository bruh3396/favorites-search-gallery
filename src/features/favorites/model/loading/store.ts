import { FAVORITES_PAGE_ID, ON_FAVORITES_PAGE, USER_ID } from "@/lib/environment";
import { CoalescingExecutor } from "@/lib/async/coalescing";
import { Database } from "@/lib/storage/database";
import { Favorite } from "@/types/favorite";
import { Post } from "@/types/api";

export class FavoritesStore {
  private readonly database = new Database<Post>("FavoritesV2", `user${ON_FAVORITES_PAGE ? FAVORITES_PAGE_ID : USER_ID}`);
  private readonly databaseUpdater = new CoalescingExecutor<Post>(100, 1_000, this.database.update.bind(this.database));
  private isDatabaseEmpty = true;

  public async writeAll(favorites: Favorite[]): Promise<void> {
    await this.database.write([...favorites].reverse().map(favorite => favorite.post));
    this.isDatabaseEmpty = false;
  }

  public update(favorite: Favorite): void {
    if (!this.isDatabaseEmpty) {
      this.databaseUpdater.schedule(favorite.post);
    }
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

  public async count(): Promise<number> {
    return (await this.database.exists()) ? this.database.count() : 0;
  }

  public exists(): Promise<boolean> {
    return this.database.exists();
  }

  public async readIds(): Promise<string[]> {
    return (await this.database.exists()) ? this.database.readAllIds() : [];
  }

  public async readMany(ids: string[]): Promise<Post[]> {
    return (await this.database.exists()) ? this.database.readMany(ids) : [];
  }

  public async hasAny(): Promise<boolean> {
    return (await this.database.exists()) && (await this.database.count()) > 0;
  }

  public deleteId(id: string): Promise<void> {
    return this.database.delete([id]);
  }

  public destroy(): Promise<void> {
    return this.database.destroy();
  }
}
