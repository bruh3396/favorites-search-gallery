import { ProgressBar, buildProgressBar } from "@/lib/ui/widgets/progress_bar";
import { FavoritesEta } from "@/features/favorites/view/status/eta";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { Shell } from "@/app/context/shell";
import { Timeout } from "@/types/async";

const TEMPORARY_STATUS_TIMEOUT = 1_000;

export class FavoritesStatus {
  private readonly eta = new FavoritesEta();
  private resultsCountIndicator: HTMLElement;
  private statusIndicator: HTMLElement;
  private progressBar: ProgressBar;
  private totalFavoritesCount: number | null = null;
  private statusTimeout: Timeout | undefined;

  constructor(private readonly shell: Shell) {
    this.resultsCountIndicator = document.createElement("label");
    this.statusIndicator = document.createElement("label");
    this.progressBar = buildProgressBar(FavoritesId.loadProgressBar);
  }

  public setup(): void {
    this.resultsCountIndicator = this.shell.root.querySelector(`#${FavoritesId.resultsCount}`) ?? this.resultsCountIndicator;
    this.statusIndicator = this.shell.root.querySelector(`#${FavoritesId.loadStatus}`) ?? this.statusIndicator;
    this.shell.root.querySelector(`#${FavoritesId.toolbar}`)?.append(this.progressBar.element);
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
