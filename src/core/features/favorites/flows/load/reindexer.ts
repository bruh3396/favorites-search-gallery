import { CoalescingExecutor } from "@/core/utils/async/coalescing";
import { Favorite } from "@/core/features/favorites/types/favorite";
import { FavoritesDependencies } from "@/core/features/favorites/types/favorites";
import { FavoritesModel } from "@/core/features/favorites/model/model";
import { Post } from "@/core/domain/post/post";
import { TermUpdate } from "@/core/search/engines/search_engine";

const TERM_UPDATE_COALESCING = { flushSize: 50, flushTimeout: 1_500 };

export interface FavoritesReindexerDependencies extends Pick<FavoritesDependencies, "scheduler"> {
  model: FavoritesModel;
}

export class FavoritesReindexer {
  private readonly dependencies: FavoritesReindexerDependencies;
  private readonly termUpdater: CoalescingExecutor<TermUpdate<Favorite>>;

  constructor(dependencies: FavoritesReindexerDependencies) {
    this.dependencies = dependencies;
    this.termUpdater = new CoalescingExecutor(TERM_UPDATE_COALESCING, {
      execute: (updates): void => dependencies.model.updateIndex(updates),
      scheduler: dependencies.scheduler
    });
  }

  public reindex(post: Post): void {
    const termUpdate = this.dependencies.model.overwrite(post);

    if (termUpdate !== undefined) {
      this.termUpdater.schedule(termUpdate);
    }
  }
}
