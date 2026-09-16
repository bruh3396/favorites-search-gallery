import { ContentDisplayOptions } from "@/types/ui";
import { Favorite } from "@/types/favorite";
import { FavoritesBottomEdgeObserver } from "@/features/favorites/flows/display/edge_observer";
import { FavoritesConfig } from "@/config/favorites_config";
import { FavoritesDisplay } from "@/features/favorites/types/types";
import { FavoritesView } from "@/features/favorites/view/view";
import { Shell } from "@/app/context/shell";

export class FavoritesInfiniteDisplay implements FavoritesDisplay {
  private readonly bottomObserver: FavoritesBottomEdgeObserver;
  private favorites: Favorite[] = [];
  private displayedCount = 0;

  constructor(private readonly view: FavoritesView, private readonly shell: Shell) {
    this.bottomObserver = new FavoritesBottomEdgeObserver(
      () => this.extendBelow(),
      () => [...this.view.bottomEdgeElements(), this.shell.scrollSentinelBottom]
    );
  }

  public async initialize(newFavorites: Favorite[], options?: ContentDisplayOptions): Promise<void> {
    this.favorites = newFavorites;
    this.displayedCount = 0;
    this.view.showSearchResults(this.takeNextBatch(), options);
    await this.shell.waitForContentThumbsToLoad();
    this.bottomObserver.refresh();
  }

  public sync(newFavorites: Favorite[]): void {
    const wasExhausted = !this.hasMore();

    this.favorites.push(...newFavorites);

    if (wasExhausted && this.hasMore()) {
      this.bottomObserver.refresh();
    }
  }

  public advance(): boolean {
    const batch = this.takeNextBatch();

    if (batch.length === 0) {
      return false;
    }
    this.view.addToBottom(batch);
    return true;
  }

  public goToPage(): void { }

  public teardown(): void {
    this.bottomObserver.disconnect();
  }

  private async extendBelow(): Promise<boolean> {
    if (!this.advance()) {
      return false;
    }
    await this.shell.waitForContentThumbsToLoad();
    return this.hasMore();
  }

  private takeNextBatch(): Favorite[] {
    const batch = this.favorites.slice(this.displayedCount, this.displayedCount + FavoritesConfig.infiniteScrollSliceSize);

    this.displayedCount += batch.length;
    return batch;
  }

  private hasMore(): boolean {
    return this.displayedCount < this.favorites.length;
  }
}
