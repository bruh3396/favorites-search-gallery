import { AddFavoriteStatus, FavoritesEditor, RemoveFavoriteStatus } from "@/core/boundary/ports";
import { FilesystemClient } from "@/adapters/filesystem/client/client";

export class FilesystemFavoritesEditor implements FavoritesEditor {
  constructor(private readonly files: Pick<FilesystemClient, "deletePostFile">) { }

  // A file holds a whole post and adding only knows the id, so adding only succeeds.
  public add(): Promise<AddFavoriteStatus> {
    return Promise.resolve("success");
  }

  public async remove(id: string): Promise<RemoveFavoriteStatus> {
    await this.files.deletePostFile(id);
    return "success";
  }
}
