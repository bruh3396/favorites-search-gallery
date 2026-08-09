import { awesompleteIsUnselected, awesompleteIsVisible } from "@/lib/ui/autocomplete/awesomplete";
import { AbstractFavoritesSearchBox } from "@/features/favorites/control/abstract_search_box";
import { EnhancedMouseEvent } from "@/types/input";
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
    const searchBox = document.createElement("textarea");

    this.searchBox = searchBox;

    searchBox.id = this.id;
    searchBox.placeholder = "Search Favorites";
    searchBox.spellcheck = false;
    searchBox.value = this.history.lastEditedQuery;

    const searchButtonSlot = document.getElementById(FavoritesId.searchButton);

    if (searchButtonSlot === null) {
      document.getElementById(this.parentId)?.insertAdjacentElement("beforeend", searchBox);
    } else {
      searchButtonSlot.insertAdjacentElement("afterend", searchBox);
    }
    this.subscribeToKeyboard();
    return searchBox;
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
  }
}
