import { FavoriteAddResult } from "@/core/features/favorites/actions/favorite_add_result";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { Signal } from "@/core/utils/reactive/signal";

export interface FavoritesActionsConfiguration {
  readonly favoritedByDefault: boolean;
  readonly userLoggedIn: boolean;
}

export interface FavoritesActionsDependencies {
  remoteFavorites: Pick<RemoteFavorites, "add" | "remove">;
  localFavorites: Pick<LocalFavorites, "remove">;
  acceptsChanges: () => boolean;
}

export class FavoritesActions {
  private readonly favorited = new Map<string, Signal<boolean>>();

  constructor(private readonly configuration: FavoritesActionsConfiguration, private readonly dependencies: FavoritesActionsDependencies) { }

  public async add(postId: string): Promise<FavoriteAddResult> {
    if (!this.configuration.userLoggedIn) {
      return "loggedOut";
    }

    if (!this.dependencies.acceptsChanges()) {
      return "blocked";
    }
    const isFavorited = this.getSignal(postId);

    if (isFavorited.peek()) {
      return "added";
    }
    isFavorited.value = true;
    const remoteFavoriteAddResult = await this.dependencies.remoteFavorites.add(postId);

    if (remoteFavoriteAddResult !== "added") {
      isFavorited.value = false;
    }
    return remoteFavoriteAddResult;
  }

  public async remove(postId: string): Promise<boolean> {
    if (!this.dependencies.acceptsChanges()) {
      return false;
    }
    const isRemoved = await this.dependencies.remoteFavorites.remove(postId);

    if (isRemoved) {
      this.getSignal(postId).value = false;
      await this.dependencies.localFavorites.remove([postId]);
    }
    return isRemoved;
  }

  public isFavorited(postId: string): boolean {
    return this.getSignal(postId).value;
  }

  private getSignal(postId: string): Signal<boolean> {
    const existing = this.favorited.get(postId);

    if (existing !== undefined) {
      return existing;
    }
    const isFavorited = new Signal(this.configuration.favoritedByDefault);

    this.favorited.set(postId, isFavorited);
    return isFavorited;
  }
}
