import { AddFavoriteResult, RemoteFavoriteActions, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";

export class ObservableRemoteFavoriteActions implements RemoteFavoriteActions {
  private readonly addedIds = new Emitter<string>();
  private readonly removedIds = new Emitter<string>();

  constructor(private readonly remoteFavoriteActions: RemoteFavoriteActions) { }

  public get added(): Occurrence<string> {
    return this.addedIds;
  }

  public get removed(): Occurrence<string> {
    return this.removedIds;
  }

  public async add(id: string): Promise<AddFavoriteResult> {
    const result = await this.remoteFavoriteActions.add(id);

    if (result === "added" || result === "alreadyAdded") {
      this.addedIds.emit(id);
    }
    return result;
  }

  public async remove(id: string): Promise<RemoveFavoriteResult> {
    const result = await this.remoteFavoriteActions.remove(id);

    if (result === "removed") {
      this.removedIds.emit(id);
    }
    return result;
  }
}
