import { Events } from "../../../../lib/communication/events";
import { SearchHistory } from "./favorites_search_history";
import { debounceLeading } from "../../../../lib/core/scheduling/rate_limiting";
import { hideAwesomplete } from "../../../../lib/ui/awesomplete";

const HISTORY_DEPTH = 30;
const INPUT_PERSIST_DELAY = 500;

export abstract class AbstractFavoritesSearchBox {
  protected readonly id: string = "favorites-search-box";
  protected readonly history = new SearchHistory(HISTORY_DEPTH);
  protected searchBox: HTMLTextAreaElement | HTMLInputElement;

  constructor(protected readonly parentId: string) {
    this.searchBox = this.createSearchBox();
    this.subscribeToEvents();
  }

  protected startSearch(): void {
    const query = this.searchBox.value;

    this.history.add(query);
    this.history.setLastQuery(query);
    hideAwesomplete(this.searchBox);
    Events.favorites.searchStarted.emit(query);
  }

  protected clear(): void {
    this.searchBox.value = "";
  }

  private subscribeToEvents(): void {
    const persistInput = debounceLeading<Event>(() => this.history.setLastQuery(this.searchBox.value), INPUT_PERSIST_DELAY);

    this.searchBox.addEventListener("input", persistInput);
    Events.searchBox.append.on((text) => this.appendText(text));
  }

  private appendText(text: string): void {
    const current = this.searchBox.value;
    const separator = current === "" ? "" : " ";
    const updated = `${current}${separator}${text}`;

    this.searchBox.value = updated;
    this.history.add(updated);
    this.history.setLastQuery(updated);
  }

  protected abstract createSearchBox(): HTMLTextAreaElement | HTMLInputElement;
}
