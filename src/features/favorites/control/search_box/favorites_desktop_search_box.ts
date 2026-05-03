import { awesompleteIsUnselected, awesompleteIsVisible } from "../../../../lib/ui/awesomplete";
import { AbstractFavoritesSearchBox } from "./favorites_abstract_search_box";
import { EnhancedMouseEvent } from "../../../../lib/dom/input_types";
import { Events } from "../../../../lib/communication/events";
import { Preferences } from "../../../../lib/preferences/preferences";
import { openSearchPage } from "../../../../lib/navigator";

export class FavoritesDesktopSearchBox extends AbstractFavoritesSearchBox {
  protected override createSearchBox(): HTMLTextAreaElement | HTMLInputElement {
    const searchBox = document.createElement("textarea");

    this.searchBox = searchBox;

    searchBox.id = this.id;
    searchBox.placeholder = "Search Favorites";
    searchBox.spellcheck = false;
    searchBox.value = this.history.lastEditedQuery;
    searchBox.style.height = `${Preferences.desktopSearchBoxHeight.value}px`;

    document.getElementById(this.parentId)?.insertAdjacentElement("beforeend", searchBox);
    this.observeHeight();
    this.subscribePlatformEvents();
    return searchBox;
  }

  private subscribePlatformEvents(): void {
    Events.favorites.searchButtonClicked.on((event) => this.handleSearchButtonClicked(event));
    Events.favorites.clearButtonClicked.on(this.clear.bind(this));
    Events.caption.searchForTag.on((tag) => {
      this.searchBox.value = tag;
      this.startSearch();
    });
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

  private observeHeight(): void {
    const observer = new ResizeObserver((entries) => {
      const newHeight = entries[0].contentRect.height;

      if (Preferences.desktopSearchBoxHeight.value !== newHeight) {
        Preferences.desktopSearchBoxHeight.set(newHeight);
      }
    });

    observer.observe(this.searchBox);
  }

  private handleEnter(event: KeyboardEvent): void {
    if (event.repeat || !awesompleteIsUnselected(this.searchBox)) {
      return;
    }
    event.preventDefault();
    this.startSearch();
  }

  private handleHistoryNavigation(event: KeyboardEvent): void {
    if (awesompleteIsVisible(this.searchBox)) {
      return;
    }
    event.preventDefault();
    this.history.navigate(event.key as "ArrowUp" | "ArrowDown");
    this.searchBox.value = this.history.selectedQuery;
  }

  private handleSearchButtonClicked(event: MouseEvent): void {
    const mouseEvent = new EnhancedMouseEvent(event);

    if (mouseEvent.rightClick || mouseEvent.ctrlKey) {
      openSearchPage(this.searchBox.value);
      return;
    }
    this.startSearch();
  }
}
