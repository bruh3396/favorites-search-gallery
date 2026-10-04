import { capitalize, pluralSuffix } from "@/utils/pure/string";
import { FavoritesFlow } from "@/features/favorites/flows/flow";
import { PulledFavorites } from "@/features/favorites/types/types";

const SYNC_STATUS = "Syncing with Rule34";

export class FavoritesReloadFlow extends FavoritesFlow {
  public async reloadFavorites(): Promise<void> {
    await this.loadLocalFavorites();
    this.view.setStatus(SYNC_STATUS);
    let pulledFavorites: PulledFavorites;

    try {
      pulledFavorites = await this.model.pullNewFavorites();
    } finally {
      await this.indexAllFavorites();
      this.flows.search.showAllFavorites();
    }
    this.view.setStatus(SYNC_STATUS);
    const removedCount = await this.model.pruneRemovedFavorites(pulledFavorites.prependedCount);

    this.showSyncResult(pulledFavorites.addedFavorites.length, removedCount);
  }

  private async loadLocalFavorites(): Promise<void> {
    await this.model.streamLocalFavorites(progress => this.view.setLoadProgress(progress));
    this.view.clearStatus();
  }

  private async indexAllFavorites(): Promise<void> {
    this.view.setStatus("Indexing");
    await this.view.waitForNextPaint();
    this.model.indexAllFavorites();
    this.view.clearStatus();
  }

  private showSyncResult(addedCount: number, removedCount: number): void {
    const changes: string[] = [];

    if (addedCount > 0) {
      changes.push(`saved ${addedCount} new favorite${pluralSuffix(addedCount)}`);
    }

    if (removedCount > 0) {
      changes.push(`removed ${removedCount} unfavorited post${pluralSuffix(removedCount)}, reload to see the change`);
    }

    if (changes.length === 0) {
      this.view.clearStatus();
      return;
    }
    this.view.setTemporaryStatus(capitalize(changes.join(", ")));
  }
}
