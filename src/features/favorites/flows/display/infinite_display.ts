import { Display } from "@/features/favorites/types/types";
import { Favorite } from "@/types/favorite";
import { FavoritesBottomEdgeObserver } from "@/features/favorites/flows/display/edge_observer";
import { FavoritesView } from "@/features/favorites/view/view";
import { Shell } from "@/app/context/shell";

const BATCH_SIZE = 25;

export class FavoritesInfiniteDisplay implements Display {
  private readonly bottomObserver: FavoritesBottomEdgeObserver;
  private favorites: Favorite[] = [];
  private displayedCount = 0;

  constructor(private readonly view: FavoritesView, private readonly shell: Shell) {
    this.bottomObserver = new FavoritesBottomEdgeObserver(
      () => this.extendBelow(),
      () => [...this.view.bottomEdgeElements(), this.shell.scrollSentinelBottom]
    );
  }

  public async initialize(newFavorites: Favorite[]): Promise<void> {
    this.favorites = newFavorites;
    this.displayedCount = 0;
    this.view.showSearchResults(this.takeNextBatch());
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
    const batch = this.favorites.slice(this.displayedCount, this.displayedCount + BATCH_SIZE);

    this.displayedCount += batch.length;
    return batch;
  }

  private hasMore(): boolean {
    return this.displayedCount < this.favorites.length;
  }
}
