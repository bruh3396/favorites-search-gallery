import { ProgressBar, buildProgressBar } from "@/lib/ui/widgets/progress_bar";
import { FavoritesEta } from "@/features/favorites/view/status/eta";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesToolbarSlots } from "@/types/favorites_ui";
import { Timeout } from "@/types/async";

const TEMPORARY_STATUS_TIMEOUT = 1_000;

export class FavoritesStatus {
  private readonly eta: FavoritesEta;
  private readonly resultsCountIndicator: HTMLElement;
  private readonly statusIndicator: HTMLElement;
  private readonly progressBar: ProgressBar;
  private totalFavoritesCount: number | null;
  private statusTimeout: Timeout | undefined;

  constructor(slots: FavoritesToolbarSlots, toolbar: HTMLElement) {
    this.totalFavoritesCount = null;
    this.statusTimeout = undefined;
    this.eta = new FavoritesEta();
    this.resultsCountIndicator = slots.resultsCount;
    this.statusIndicator = slots.loadStatus;
    this.progressBar = buildProgressBar(FavoritesId.loadProgressBar);
    toolbar.append(this.progressBar.element);
  }

  public setStatus(text: string): void {
    clearTimeout(this.statusTimeout);
    this.statusIndicator.textContent = text;
  }

  public setTemporaryStatus(text: string): void {
    this.setStatus(text);
    clearTimeout(this.statusTimeout);
    this.statusTimeout = setTimeout(() => this.clearStatus(), TEMPORARY_STATUS_TIMEOUT);
  }

  public setResultsCount(value: number): void {
    this.resultsCountIndicator.textContent = `${value} ${value === 1 ? "Result" : "Results"}`;
  }

  public updateFetchStatus(completed: number, resultsCount: number): void {
    let statusText = `Fetching - ${completed}`;

    if (this.totalFavoritesCount !== null) {
      statusText = `${statusText} / ${this.totalFavoritesCount}`;
      const eta = this.eta.getEta(completed, this.totalFavoritesCount);

      if (eta !== null) {
        statusText = `${statusText} - ${eta}`;
      }
      this.progressBar.setProgress(completed, this.totalFavoritesCount);
      this.progressBar.setVisible(true);
    }
    this.setStatus(statusText);
    this.setResultsCount(resultsCount);
  }

  public setLoadProgress(loaded: number, total: number): void {
    if (total > 0) {
      this.progressBar.setProgress(loaded, total);
      this.progressBar.setVisible(true);
      this.setStatus(`Loading favorites - ${loaded} / ${total}`);
    } else {
      this.setStatus("Loading favorites");
    }
  }

  public setExpectedTotalFavoritesCount(count: number | null): void {
    this.totalFavoritesCount = count;
  }

  public clearStatus(): void {
    this.statusIndicator.textContent = "";
    this.progressBar.setVisible(false);
  }
}
