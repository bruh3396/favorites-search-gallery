import { FavoritesSource } from "@/core/boundary/ports/favorites_source";
import { FilesystemClient } from "@/adapters/filesystem/client/client";
import { Post } from "@/core/domain/post/post";

export class FilesystemFavoritesSource implements FavoritesSource {
  constructor(private readonly filesystem: Pick<FilesystemClient, "readPostFiles" | "countPostFiles">) { }

  public fetchCount(): Promise<number | null> {
    return this.filesystem.countPostFiles();
  }

  public async fetchMissing(knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound((await this.readNewestFirst()).filter(post => !knownIds.has(post.id)));
  }

  private async readNewestFirst(): Promise<Post[]> {
    const files = await this.filesystem.readPostFiles();
    return files.sort((a, b) => b.modifiedAt - a.modifiedAt).map(file => file.post);
  }
}
