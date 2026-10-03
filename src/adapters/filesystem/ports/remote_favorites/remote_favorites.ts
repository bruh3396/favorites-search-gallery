import { AddFavoriteResult, RemoteFavorites, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorites";
import { FilesystemClient } from "@/adapters/filesystem/client/client";
import { Post } from "@/core/domain/post/post";

export class FilesystemRemoteFavorites implements RemoteFavorites {
  constructor(private readonly filesystem: Pick<FilesystemClient, "readPostFiles" | "countPostFiles" | "deletePostFile">) { }

  public fetchCount(): Promise<number | null> {
    return this.filesystem.countPostFiles();
  }

  public async fetchAllExcept(knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound((await this.readNewestFirst()).filter(post => !knownIds.has(post.id)));
  }

  public async findRemoved(storedIds: readonly string[]): Promise<string[] | null> {
    const listedIds = new Set((await this.filesystem.readPostFiles()).map(file => file.post.id));
    return storedIds.filter(id => !listedIds.has(id));
  }

  // A file holds a whole post and adding only knows the id, so adding only succeeds.
  public add(): Promise<AddFavoriteResult> {
    return Promise.resolve("added");
  }

  public async remove(id: string): Promise<RemoveFavoriteResult> {
    await this.filesystem.deletePostFile(id);
    return "removed";
  }

  private async readNewestFirst(): Promise<Post[]> {
    const files = await this.filesystem.readPostFiles();
    return files.sort((a, b) => b.modifiedAt - a.modifiedAt).map(file => file.post);
  }
}
