import { Events } from "@/app/channels/events";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { SearchHistory } from "@/lib/storage/search_history";
import { debounceLeading } from "@/lib/async/debounce";
import { hideAwesomplete } from "@/lib/ui/autocomplete/awesomplete";

const HISTORY_DEPTH = 30;
const INPUT_PERSIST_DELAY = 500;

export abstract class AbstractFavoritesSearchBox {
  protected readonly id: string = FavoritesId.searchBox;
  protected readonly history = new SearchHistory(HISTORY_DEPTH);
  protected searchBox: HTMLTextAreaElement | HTMLInputElement;

  constructor(protected readonly parentId: string) {
    this.searchBox = this.createSearchBox();
    this.subscribeToEvents();
  }

  public append(text: string): void {
    const current = this.searchBox.value;
    const separator = current === "" ? "" : " ";
    const updated = `${current}${separator}${text}`;

    this.searchBox.value = updated;
    this.history.add(updated);
    this.history.setLastQuery(updated);
  }

  public search(query: string): void {
    this.searchBox.value = query;
    this.startSearch();
  }

  public clear(): void {
    this.searchBox.value = "";
    this.history.setLastQuery("");
  }

  protected startSearch(): void {
    const query = this.searchBox.value;

    this.history.add(query);
    this.history.setLastQuery(query);
    hideAwesomplete(this.searchBox);
    Events.favorites.searchStarted.emit(query);
  }

  private subscribeToEvents(): void {
    const persistInput = debounceLeading<Event>(() => this.history.setLastQuery(this.searchBox.value), INPUT_PERSIST_DELAY);

    this.searchBox.addEventListener("input", persistInput);
  }

  protected abstract createSearchBox(): HTMLTextAreaElement | HTMLInputElement;
}
