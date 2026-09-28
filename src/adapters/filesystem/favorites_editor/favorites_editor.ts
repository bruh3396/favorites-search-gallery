import { AddFavoriteStatus, FavoritesEditor, RemoveFavoriteStatus } from "@/core/boundary/ports";
import { join } from "node:path";
import { rm } from "node:fs/promises";

export class FileSystemFavoritesEditor implements FavoritesEditor {
  constructor(private readonly directory: string) { }

  // A file holds a whole post and adding only knows the id, so adding only succeeds.
  public add(): Promise<AddFavoriteStatus> {
    return Promise.resolve("success");
  }

  public async remove(id: string): Promise<RemoveFavoriteStatus> {
    await rm(join(this.directory, `${id}.json`), { force: true });
    return "success";
  }
}
