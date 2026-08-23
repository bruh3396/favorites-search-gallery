import { Events } from "@/app/channels/events";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { SearchHistory } from "@/features/favorites/control/toolbar/search_history";
import { debounceLeading } from "@/lib/async/rate_limiting";
import { hideAwesomplete } from "@/lib/ui/autocomplete/awesomplete";
import { toggleDataset } from "@/utils/browser/dataset";

const HISTORY_DEPTH = 30;
const INPUT_PERSIST_DELAY = 500;

export abstract class AbstractFavoritesSearchBox {
  protected readonly id: string = FavoritesId.searchBox;
  protected readonly history = new SearchHistory(HISTORY_DEPTH);
  protected searchBox: HTMLTextAreaElement | HTMLInputElement;

  constructor(protected readonly parentId: string) {
    this.searchBox = this.createSearchBox();
    this.subscribeToEvents();
    queueMicrotask(() => this.refreshClearButton());
  }

  public append(text: string): void {
    this.searchBox.value = `${this.searchBox.value}${this.searchBox.value === "" ? "" : " "}${text}`;
    this.history.add(this.searchBox.value);
    this.refreshClearButton();
  }

  public search(query: string): void {
    this.searchBox.value = query;
    this.refreshClearButton();
    this.startSearch();
  }

  public clear(): void {
    this.searchBox.value = "";
    this.history.setLastQuery("");
    this.refreshClearButton();
  }

  protected startSearch(): void {
    this.history.add(this.searchBox.value);
    hideAwesomplete(this.searchBox);
    Events.favorites.searchRequested.emit(this.searchBox.value);
  }

  protected refreshClearButton(): void {
    toggleDataset(document.getElementById(FavoritesId.clearButton), "hidden", this.searchBox.value === "");
  }

  private subscribeToEvents(): void {
    this.searchBox.addEventListener("input", () => this.refreshClearButton());
    this.searchBox.addEventListener("input", debounceLeading<Event>(() => this.history.setLastQuery(this.searchBox.value), INPUT_PERSIST_DELAY));
  }

  protected abstract createSearchBox(): HTMLTextAreaElement | HTMLInputElement;
}
