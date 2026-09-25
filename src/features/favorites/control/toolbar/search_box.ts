import { awesompleteIsUnselected, awesompleteIsVisible, hideAwesomplete } from "@/lib/ui/autocomplete/awesomplete";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { Events } from "@/app/context/events";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { FavoritesToolbarSlots } from "@/features/favorites/types/types";
import { SearchHistory } from "@/features/favorites/control/toolbar/search_history";
import { attachAutocomplete } from "@/lib/ui/autocomplete/autocomplete";
import { debounceLeading } from "@/lib/async/rate_limiting";
import { openPostList } from "@/lib/remote/fetchers/action";
import { queueMacroTask } from "@/lib/async/scheduling";
import { toggleDataset } from "@/utils/browser/dataset";

const INPUT_PERSIST_DELAY = 500;
const COLLAPSED_HEIGHT = 28;

export class SearchBox {
  private readonly id: string = FavoritesId.searchBox;
  private readonly history = new SearchHistory(30);
  private readonly searchBox: HTMLTextAreaElement;

  constructor(
    private readonly events: Events,
    private readonly slots: FavoritesToolbarSlots
  ) {
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

  public focus(): void {
    this.searchBox.focus();
  }

  public clear(): void {
    this.searchBox.value = "";
    this.history.setLastQuery("");
    this.refreshClearButton();
  }

  public handleSearchButtonClicked(event: MouseEvent): void {
    const mouseEvent = new EnhancedMouseEvent(event);

    if (mouseEvent.rightClick || mouseEvent.ctrlKey) {
      openPostList(this.searchBox.value);
      return;
    }
    this.startSearch();
  }

  private createSearchBox(): HTMLTextAreaElement {
    const searchBox = document.createElement("textarea");

    searchBox.id = this.id;
    searchBox.placeholder = "Search Favorites";
    searchBox.spellcheck = false;
    searchBox.value = this.history.lastEditedQuery;
    this.slots.searchButton.insertAdjacentElement("afterend", searchBox);
    attachAutocomplete(searchBox);
    return searchBox;
  }

  private startSearch(): void {
    this.history.add(this.searchBox.value);
    hideAwesomplete(this.searchBox);
    this.events.favorites.searchRequested.emit(this.searchBox.value);
  }

  private refreshClearButton(): void {
    toggleDataset(this.slots.searchActions.querySelector<HTMLElement>(`#${FavoritesId.clearButton}`), "hidden", this.searchBox.value === "");
  }

  private subscribeToEvents(): void {
    this.searchBox.addEventListener("input", () => this.refreshClearButton());
    this.searchBox.addEventListener("input", debounceLeading<Event>(() => this.history.setLastQuery(this.searchBox.value), INPUT_PERSIST_DELAY));
    this.subscribeToKeyboard();
    this.subscribeToGrowOnFocus();
    this.events.app.hotkeyPressed.on((key) => this.handleHotkey(key));
  }

  private handleHotkey(key: string): void {
    if (key === "/") {
      queueMacroTask(() => this.focus());
    }
  }

  private subscribeToGrowOnFocus(): void {
    this.searchBox.addEventListener("focus", () => this.growToFit());
    this.searchBox.addEventListener("input", () => {
      if (document.activeElement === this.searchBox) {
        this.growToFit();
      }
    });
    this.searchBox.addEventListener("blur", () => this.collapse());
  }

  private growToFit(): void {
    this.searchBox.style.height = `${COLLAPSED_HEIGHT}px`;
    const isExpanded = this.searchBox.scrollHeight > this.searchBox.clientHeight;

    if (isExpanded) {
      this.searchBox.style.height = `${this.searchBox.scrollHeight}px`;
    }
    this.setExpanded(isExpanded);
  }

  private collapse(): void {
    this.searchBox.style.height = `${COLLAPSED_HEIGHT}px`;
    this.setExpanded(false);
  }

  private setExpanded(expanded: boolean): void {
    toggleDataset(this.slots.searchField, "expanded", expanded);
  }

  private subscribeToKeyboard(): void {
    this.searchBox.addEventListener("keydown", ((event: KeyboardEvent) => {
      if (event.key === "Enter") {
        this.handleEnter(event);
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        this.handleHistoryNavigation(event);
      }
    }) as EventListener);
  }

  private handleEnter(event: KeyboardEvent): void {
    if (event.repeat || event.defaultPrevented || !awesompleteIsUnselected(this.searchBox)) {
      return;
    }
    event.preventDefault();
    this.startSearch();
  }

  private handleHistoryNavigation(event: KeyboardEvent): void {
    if (awesompleteIsVisible(this.searchBox)) {
      return;
    }
    this.history.navigate(event.key as "ArrowUp" | "ArrowDown");
    event.preventDefault();
    this.searchBox.value = this.history.selectedQuery;
    this.refreshClearButton();
    this.growToFit();
  }
}
