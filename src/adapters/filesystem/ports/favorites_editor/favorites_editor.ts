import { AddFavoriteResult, FavoritesEditor, RemoveFavoriteResult } from "@/core/boundary/ports/favorites_editor";
import { FilesystemClient } from "@/adapters/filesystem/client/client";

export class FilesystemFavoritesEditor implements FavoritesEditor {
  constructor(private readonly filesystem: Pick<FilesystemClient, "deletePostFile">) { }

  // A file holds a whole post and adding only knows the id, so adding only succeeds.
  public add(): Promise<AddFavoriteResult> {
    return Promise.resolve("added");
  }

  public async remove(id: string): Promise<RemoveFavoriteResult> {
    await this.filesystem.deletePostFile(id);
    return "removed";
  }
}
