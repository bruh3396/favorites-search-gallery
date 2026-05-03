import { AbstractFavoritesSearchBox } from "./favorites_abstract_search_box";
import { Events } from "../../../../lib/communication/events";
import { TOOLBAR_HTML } from "../../../../assets/html";
import { setupMobileStickyMenu } from "../../view/shell/favorites_mobile_sticky_menu";
import { setupMobileSymbolRow } from "./favorites_mobile_symbol_row";

export class FavoritesMobileSearchBox extends AbstractFavoritesSearchBox {
  protected override createSearchBox(): HTMLTextAreaElement | HTMLInputElement {
    document.getElementById(this.parentId)?.insertAdjacentHTML("afterend", TOOLBAR_HTML);
    const searchBox = document.getElementById(this.id);
    const searchButton = document.getElementById("search-button");
    const clearButton = document.querySelector(".search-clear-container");
    const resetButton = document.getElementById("reset-button");
    const optionsCheckbox = document.getElementById("options-checkbox");

    if (!(searchBox instanceof HTMLInputElement) || searchButton === null || !(clearButton instanceof HTMLElement) || !(resetButton instanceof HTMLElement)) {
      return document.createElement("textarea");
    }
    searchButton.onclick = this.startSearch;
    resetButton.onclick = (event): void => Events.favorites.resetButtonClicked.emit(event);
    this.wireClearButton(clearButton);

    if (optionsCheckbox instanceof HTMLInputElement) {
      setupMobileStickyMenu(optionsCheckbox);
    }
    setupMobileSymbolRow(searchBox);
    return searchBox;
  }

  private wireClearButton(clearButton: HTMLElement): void {
    this.searchBox.addEventListener("input", () => {
      clearButton.style.visibility = this.searchBox.value === "" ? "hidden" : "visible";
    });
    clearButton.onclick = (): void => {
      this.searchBox.value = "";
      this.searchBox.dispatchEvent(new Event("input"));
    };
  }

}
