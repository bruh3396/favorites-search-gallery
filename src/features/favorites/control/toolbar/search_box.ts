import { awesompleteIsUnselected, awesompleteIsVisible, hideAwesomplete } from "@/lib/ui/autocomplete/awesomplete";
import { EnhancedMouseEvent } from "@/lib/event/input";
import { Events } from "@/app/context/events";
import { FavoritesId } from "@/features/favorites/types/selectors";
import { FavoritesSearchHistory } from "@/features/favorites/control/toolbar/search_history";
import { FavoritesToolbarSlots } from "@/types/favorites_ui";
import { KeyValueStorage } from "@/features/favorites/types/types";
import { attachAutocomplete } from "@/lib/ui/autocomplete/autocomplete";
import { buildButton } from "@/lib/ui/widgets/button";
import { queueMacroTask } from "@/lib/async/scheduling";
import { toggleDataset } from "@/utils/browser/dataset";

const HISTORY_DEPTH = 30;
const COLLAPSED_HEIGHT = 28;

export class FavoritesSearchBox {
  private readonly events: Events;
  private readonly slots: FavoritesToolbarSlots;
  private readonly history: FavoritesSearchHistory;
  private readonly clearButton: HTMLButtonElement;
  private readonly searchBox: HTMLTextAreaElement;

  constructor(events: Events, slots: FavoritesToolbarSlots, storage: KeyValueStorage) {
    this.events = events;
    this.slots = slots;
    this.history = new FavoritesSearchHistory(HISTORY_DEPTH, storage);
    this.clearButton = this.createClearButton();
    this.searchBox = this.createSearchBox();
    this.subscribeToEvents();
    this.refreshClearButton();
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
      this.events.favorites.postListRequested.emit(this.searchBox.value);
      return;
    }
    this.startSearch();
  }

  private createClearButton(): HTMLButtonElement {
    const clearButton = buildButton({
      id: FavoritesId.clearButton,
      icon: "clear",
      event: this.events.favorites.clearButtonClicked
    });

    this.slots.searchActions.insertAdjacentElement("afterbegin", clearButton);
    return clearButton;
  }

  private createSearchBox(): HTMLTextAreaElement {
    const searchBox = document.createElement("textarea");

    searchBox.id = FavoritesId.searchBox;
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
    toggleDataset(this.clearButton, "hidden", this.searchBox.value === "");
  }

  private subscribeToEvents(): void {
    this.searchBox.addEventListener("input", () => this.refreshClearButton());
    this.searchBox.addEventListener("input", () => this.history.editLastQuery(this.searchBox.value));
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
