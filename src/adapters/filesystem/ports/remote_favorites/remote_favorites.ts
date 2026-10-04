import { FilesystemClient } from "@/adapters/filesystem/client/client";
import { Post } from "@/core/domain/post/post";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";

export class FilesystemRemoteFavorites implements RemoteFavorites {
  constructor(private readonly filesystem: Pick<FilesystemClient, "readPostFiles" | "countPostFiles">) { }

  public fetchCount(): Promise<number | null> {
    return this.filesystem.countPostFiles();
  }

  public async fetchAll(onFavoritesFound: (posts: Post[]) => void): Promise<void> {
    onFavoritesFound(await this.readNewestFirst());
  }

  public async findNew(localIds: readonly string[]): Promise<Post[]> {
    return takeAboveLocalOrder(await this.readNewestFirst(), localIds);
  }

  public async findRemoved(localIds: readonly string[]): Promise<string[]> {
    const remoteIds = new Set((await this.filesystem.readPostFiles()).map(file => file.post.id));
    return localIds.filter(id => !remoteIds.has(id));
  }

  private async readNewestFirst(): Promise<Post[]> {
    const files = await this.filesystem.readPostFiles();
    return files.sort((a, b) => b.modifiedAt - a.modifiedAt).map(file => file.post);
  }
}

function takeAboveLocalOrder(remoteFavorites: Post[], localIds: readonly string[]): Post[] {
  const localIndexById = new Map(localIds.map((id, index) => [id, index]));
  let remoteStart = remoteFavorites.length;
  let nextLocalIndex = Infinity;

  for (let remoteIndex = remoteFavorites.length - 1; remoteIndex >= 0; remoteIndex -= 1) {
    const localIndex = localIndexById.get(remoteFavorites[remoteIndex].id);

    if (localIndex === undefined || localIndex >= nextLocalIndex) {
      break;
    }
    nextLocalIndex = localIndex;
    remoteStart = remoteIndex;
  }
  return remoteFavorites.slice(0, remoteStart);
}
