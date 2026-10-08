import { CoalescingExecutor } from "@/core/utils/async/coalescing";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/index";
import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { TermUpdate } from "@/core/search/engines/search_engine";

const TERM_UPDATE_COALESCING = { flushSize: 50, flushTimeout: 1_500 };

export interface FavoritesReindexerDependencies {
  scheduler: Scheduler;
  collection: Pick<FavoritesCollection, "overwrite">;
  index: Pick<FavoritesSearchIndex, "update">;
}

export class FavoritesReindexer {
  private readonly dependencies: FavoritesReindexerDependencies;
  private readonly termUpdater: CoalescingExecutor<TermUpdate<Favorite>>;

  constructor(dependencies: FavoritesReindexerDependencies) {
    this.dependencies = dependencies;
    this.termUpdater = new CoalescingExecutor(TERM_UPDATE_COALESCING, {
      execute: (updates): void => dependencies.index.update(updates),
      scheduler: dependencies.scheduler
    });
  }

  public reindex(post: Post): void {
    const termUpdate = this.dependencies.collection.overwrite(post);

    if (termUpdate !== undefined) {
      this.termUpdater.schedule(termUpdate);
    }
  }
}
