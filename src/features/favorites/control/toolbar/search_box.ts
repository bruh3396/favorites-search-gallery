import { awesompleteIsUnselected, awesompleteIsVisible, markAsNeedingAutocomplete } from "@/lib/ui/autocomplete/awesomplete";
import { AbstractFavoritesSearchBox } from "@/features/favorites/control/toolbar/abstract_search_box";
import { EnhancedMouseEvent } from "@/lib/input/mouse_event";
import { FavoritesId } from "@/features/favorites/types/scaffold";
import { openPostList } from "@/lib/remote/rule34/posts/navigation";

export class FavoritesDesktopSearchBox extends AbstractFavoritesSearchBox {
  public handleSearchButtonClicked(event: MouseEvent): void {
    const mouseEvent = new EnhancedMouseEvent(event);

    if (mouseEvent.rightClick || mouseEvent.ctrlKey) {
      openPostList(this.searchBox.value);
      return;
    }
    this.startSearch();
  }

  protected override createSearchBox(): HTMLTextAreaElement | HTMLInputElement {
    this.searchBox = document.createElement("textarea");
    this.searchBox.id = this.id;
    this.searchBox.placeholder = "Search Favorites";
    this.searchBox.spellcheck = false;
    this.searchBox.value = this.history.lastEditedQuery;
    markAsNeedingAutocomplete(this.searchBox);
    const searchButtonSlot = document.getElementById(FavoritesId.searchButton);

    if (searchButtonSlot === null) {
      document.getElementById(this.parentId)?.insertAdjacentElement("beforeend", this.searchBox);
    } else {
      searchButtonSlot.insertAdjacentElement("afterend", this.searchBox);
    }
    this.subscribeToKeyboard();
    return this.searchBox;
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
    this.refreshClearButton();
  }
}
