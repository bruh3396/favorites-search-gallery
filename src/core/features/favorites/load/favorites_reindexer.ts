import { CoalescingExecutor } from "@/core/utils/async/coalescing_executor";
import { Favorite } from "@/core/features/favorites/favorite";
import { FavoritesCollection } from "@/core/features/favorites/collection/favorites_collection";
import { FavoritesSearchIndex } from "@/core/features/favorites/search/favorites_search_index";
import { Post } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { TermUpdate } from "@/core/domain/search/engines/term_update";

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
    const overwrite = this.dependencies.collection.overwrite(post);

    if (overwrite === undefined) {
      return;
    }
    const { favorite, previousTags } = overwrite;
    const tags = favorite.tags;

    if (previousTags.symmetricDifference(tags).size > 0) {
      this.termUpdater.schedule({ doc: favorite, oldTerms: previousTags, newTerms: tags });
    }
  }
}
