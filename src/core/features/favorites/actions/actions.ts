import { AddFavoriteResult, RemoveFavoriteResult } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { ObservableRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/observable_remote_favorite_actions";
import { Signal } from "@/core/utils/reactive/signal";

export interface FavoritesActionsConfiguration {
  favoritedByDefault: boolean;
}

export interface FavoritesActionsDependencies {
  remoteFavoriteActions: ObservableRemoteFavoriteActions;
  localFavorites: LocalFavorites;
}

export class FavoritesActions {
  private readonly favorited = new Map<string, Signal<boolean>>();
  private readonly disposers: Array<() => void>;

  constructor(private readonly configuration: FavoritesActionsConfiguration, private readonly dependencies: FavoritesActionsDependencies) {
    const { remoteFavoriteActions, localFavorites } = dependencies;

    this.disposers = [
      remoteFavoriteActions.added.on(id => (this.getSignal(id).value = true)),
      remoteFavoriteActions.removed.on(id => (this.getSignal(id).value = false)),
      remoteFavoriteActions.removed.on(id => localFavorites.remove([id]))
    ];
  }

  public add(id: string): Promise<AddFavoriteResult> {
    return this.dependencies.remoteFavoriteActions.add(id);
  }

  public remove(id: string): Promise<RemoveFavoriteResult> {
    return this.dependencies.remoteFavoriteActions.remove(id);
  }

  public isFavorite(id: string): boolean {
    return this.getSignal(id).value;
  }

  public dispose(): void {
    for (const disposer of this.disposers) {
      disposer();
    }
  }

  private getSignal(id: string): Signal<boolean> {
    const existing = this.favorited.get(id);

    if (existing !== undefined) {
      return existing;
    }
    const cell = new Signal(this.configuration.favoritedByDefault);

    this.favorited.set(id, cell);
    return cell;
  }
}
