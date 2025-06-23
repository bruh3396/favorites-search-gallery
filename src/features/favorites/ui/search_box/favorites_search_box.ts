import { awesompleteIsUnselected, awesompleteIsVisible, hideAwesomplete } from "../../../../utils/dom/awesomplete_utils";
import { Events } from "../../../../lib/global/events/events";
import { FavoritesMouseEvent } from "../../../../types/events/mouse_event";
import { ON_MOBILE_DEVICE } from "../../../../lib/global/flags/intrinsic_flags";
import { SearchHistory } from "./favorites_search_history";
import { createDesktopSearchBar } from "./favorites_desktop_search_box";
import { createMobileSearchBar } from "./favorites_mobile_search_box";
import { debounceAfterFirstCall } from "../../../../utils/misc/async";
import { openSearchPage } from "../../../../utils/dom/links";

let SEARCH_BOX: HTMLTextAreaElement | HTMLInputElement;
const PARENT_ID: string = "left-favorites-panel-top-row";
const ID: string = "favorites-search-box";
const SEARCH_HISTORY: SearchHistory = new SearchHistory(30);

function addEventListenersToSearchBox(): void {
  Events.caption.searchForTag.on((tag) => {
    SEARCH_BOX.value = tag;
    startSearch();
  });
  Events.searchBox.appendSearchBox.on((text) => {
    const initialSearchBoxValue = SEARCH_BOX.value;
    const optionalSpace = initialSearchBoxValue === "" ? "" : " ";
    const newSearchBoxValue = `${initialSearchBoxValue}${optionalSpace}${text}`;

    SEARCH_BOX.value = newSearchBoxValue;
    SEARCH_HISTORY.add(newSearchBoxValue);
    updateLastEditedSearchQuery();
  });
  Events.favorites.searchButtonClicked.on(onSearchButtonClicked);
  Events.favorites.clearButtonClicked.on(() => {
    SEARCH_BOX.value = "";
  });
  Events.favorites.searchBoxUpdated.on(() => {
    updateLastEditedSearchQuery();
  });
  SEARCH_BOX.addEventListener("keydown", (event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    if (event.key === "Enter") {
      if (!event.repeat && awesompleteIsUnselected(SEARCH_BOX)) {
        event.preventDefault();
        startSearch();
      }
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      if (!awesompleteIsVisible(SEARCH_BOX)) {
        event.preventDefault();
        SEARCH_HISTORY.navigate(event.key);
        SEARCH_BOX.value = SEARCH_HISTORY.selectedQuery;
      }
    }
  });
  updateLastEditedSearchQueryOnInput();
}

function updateLastEditedSearchQueryOnInput(): void {
  SEARCH_BOX.addEventListener("keyup", debounceAfterFirstCall((event: KeyboardEvent) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    if (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete") {
      updateLastEditedSearchQuery();
    }
  }, 500) as EventListener);
}

function updateLastEditedSearchQuery(): void {
  SEARCH_HISTORY.updateLastEditedSearchQuery(SEARCH_BOX.value);
}

function onSearchButtonClicked(event: MouseEvent): void {
  const mouseEvent = new FavoritesMouseEvent(event);

  if (mouseEvent.rightClick || mouseEvent.ctrlKey) {
    openSearchPage(SEARCH_BOX.value);
    return;
  }
  startSearch();
}

function startSearch(): void {
  SEARCH_HISTORY.add(SEARCH_BOX.value);
  updateLastEditedSearchQuery();
  hideAwesomplete(SEARCH_BOX);
  Events.favorites.searchStarted.emit(SEARCH_BOX.value);
}

export function setupFavoritesSearchBox(): void {
  SEARCH_BOX = ON_MOBILE_DEVICE ? createMobileSearchBar(ID, PARENT_ID, startSearch) : createDesktopSearchBar(ID, PARENT_ID, SEARCH_HISTORY.lastEditedQuery);
  addEventListenersToSearchBox();
}
