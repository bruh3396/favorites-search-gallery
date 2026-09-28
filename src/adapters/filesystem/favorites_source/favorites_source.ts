import { FavoritesSource } from "@/core/boundary/ports";
import { FilesystemClient } from "@/adapters/filesystem/client/client";
import { Post } from "@/core/domain/post/post";

export class FilesystemFavoritesSource implements FavoritesSource {
  constructor(private readonly files: Pick<FilesystemClient, "readPostFiles" | "countPostFiles">) { }

  public async fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(await this.readNewestFirst());
  }

  public count(): Promise<number | null> {
    return this.files.countPostFiles();
  }

  public async fetchNew(existingIds: Set<string>): Promise<Post[]> {
    return (await this.readNewestFirst()).filter(post => !existingIds.has(post.id));
  }

  private async readNewestFirst(): Promise<Post[]> {
    const files = await this.files.readPostFiles();
    return files.sort((a, b) => b.modifiedAt - a.modifiedAt).map(file => file.post);
  }
}
