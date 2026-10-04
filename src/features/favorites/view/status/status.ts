import { ProgressBar, buildProgressBar } from "@/lib/ui/widgets/progress_bar";
import { FavoritesEta } from "@/features/favorites/view/status/eta";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesToolbarSlots } from "@/types/favorites_ui";
import { LoadProgress } from "@/features/favorites/types/types";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

const TEMPORARY_STATUS_TIMEOUT = 1_000;

export class FavoritesStatus {
  private readonly scheduler: Scheduler;
  private readonly eta: FavoritesEta;
  private readonly resultsCountIndicator: HTMLElement;
  private readonly statusIndicator: HTMLElement;
  private readonly progressBar: ProgressBar;
  private totalFavoriteCount: number | null;
  private cancelStatusTimeout: () => void;

  constructor(slots: FavoritesToolbarSlots, toolbar: HTMLElement, scheduler: Scheduler) {
    this.scheduler = scheduler;
    this.totalFavoriteCount = null;
    this.cancelStatusTimeout = (): void => undefined;
    this.eta = new FavoritesEta(scheduler);
    this.resultsCountIndicator = slots.resultsCount;
    this.statusIndicator = slots.loadStatus;
    this.progressBar = buildProgressBar(FavoritesId.loadProgressBar);
    toolbar.append(this.progressBar.element);
  }

  public setStatus(text: string): void {
    this.cancelStatusTimeout();
    this.statusIndicator.textContent = text;
  }

  public setTemporaryStatus(text: string): void {
    this.setStatus(text);
    this.cancelStatusTimeout = this.scheduler.schedule(() => this.clearStatus(), TEMPORARY_STATUS_TIMEOUT);
  }

  public setResultsCount(value: number): void {
    this.resultsCountIndicator.textContent = `${value} ${value === 1 ? "Result" : "Results"}`;
  }

  public updateFetchStatus(completed: number, resultsCount: number): void {
    let statusText = `Fetching - ${completed}`;

    if (this.totalFavoriteCount !== null) {
      statusText = `${statusText} / ${this.totalFavoriteCount}`;
      const eta = this.eta.getEta(completed, this.totalFavoriteCount);

      if (eta !== null) {
        statusText = `${statusText} - ${eta}`;
      }
      this.progressBar.setProgress(completed, this.totalFavoriteCount);
      this.progressBar.setVisible(true);
    }
    this.setStatus(statusText);
    this.setResultsCount(resultsCount);
  }

  public setLoadProgress({ loaded, total }: LoadProgress): void {
    if (total > 0) {
      this.progressBar.setProgress(loaded, total);
      this.progressBar.setVisible(true);
      this.setStatus(`Loading favorites - ${loaded} / ${total}`);
    } else {
      this.setStatus("Loading favorites");
    }
  }

  public setExpectedTotalFavoriteCount(count: number | null): void {
    this.totalFavoriteCount = count;
  }

  public clearStatus(): void {
    this.statusIndicator.textContent = "";
    this.progressBar.setVisible(false);
  }
}
