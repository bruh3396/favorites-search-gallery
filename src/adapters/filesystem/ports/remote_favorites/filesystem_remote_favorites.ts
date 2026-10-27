import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { FilesystemClient } from "@/adapters/filesystem/client/filesystem_client";
import { Post } from "@/core/domain/post/post";

export class FilesystemRemoteFavorites implements RemoteFavorites {
  constructor(private readonly filesystem: Pick<FilesystemClient, "readPostFiles" | "countPostFiles" | "deletePostFile">) { }

  public fetchCount(): Promise<number | null> {
    return this.filesystem.countPostFiles();
  }

  public async fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(await this.readNewestFirst());
  }

  public async findNew(localPostIds: readonly string[]): Promise<Post[]> {
    return takeAboveLocalOrder(await this.readNewestFirst(), localPostIds);
  }

  public async findMissing(localPostIds: readonly string[]): Promise<string[]> {
    const remotePostIds = new Set((await this.filesystem.readPostFiles()).map(file => file.post.id));
    return localPostIds.filter(id => !remotePostIds.has(id));
  }

  public add(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public async remove(postId: string): Promise<boolean> {
    await this.filesystem.deletePostFile(postId);
    return true;
  }

  private async readNewestFirst(): Promise<Post[]> {
    const files = await this.filesystem.readPostFiles();
    return files.sort((a, b) => b.modifiedAt - a.modifiedAt).map(file => file.post);
  }
}

function takeAboveLocalOrder(remoteFavorites: Post[], localPostIds: readonly string[]): Post[] {
  const localIndexByPostId = new Map(localPostIds.map((id, index) => [id, index]));
  let remoteStart = remoteFavorites.length;
  let nextLocalIndex = Infinity;

  for (let remoteIndex = remoteFavorites.length - 1; remoteIndex >= 0; remoteIndex -= 1) {
    const localIndex = localIndexByPostId.get(remoteFavorites[remoteIndex].id);

    if (localIndex === undefined || localIndex >= nextLocalIndex) {
      break;
    }
    nextLocalIndex = localIndex;
    remoteStart = remoteIndex;
  }
  return remoteFavorites.slice(0, remoteStart);
}
