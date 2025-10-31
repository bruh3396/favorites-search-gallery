import * as ICONS from "../../assets/icons";
import { insertHTMLAndExtractStyle, insertStyleHTML } from "../../utils/dom/style";
import { Events } from "../../lib/global/events/events";
import { Favorite } from "../../types/favorite_types";
import { Preferences } from "../../lib/global/preferences/preferences";
import { SAVED_SEARCHES_DISABLED } from "../../lib/global/flags/derived_flags";
import { SAVED_SEARCHES_HTML } from "../../assets/html";
import { awesompleteIsUnselected } from "../../utils/dom/awesomplete";
import { getAllThumbs } from "../../utils/dom/dom";
import { getSavedSearches } from "../../utils/dom/saved_searches";
import { shuffleArray } from "../../utils/collection/array";
import { sleep } from "../../utils/misc/async";

let textarea: HTMLTextAreaElement;
let savedSearchesList: HTMLElement;
let stopEditingButton: HTMLElement;
let saveButton: HTMLElement;
let importButton: HTMLElement;
let exportButton: HTMLElement;
let saveSearchResultsButton: HTMLElement;
let latestSearchResults: Favorite[] = [];

export function setupSavedSearches(): void {
  if (SAVED_SEARCHES_DISABLED) {
    return;
  }
  insertHTML();
  extractHTMLElements();
  addEventListeners();
  loadSavedSearches();
  toggleSavedSearchesVisibility(Preferences.savedSearchesVisible.value);
}

function insertHTML(): void {
  insertHTMLAndExtractStyle(document.getElementById("right-favorites-panel") || document.createElement("div"), "beforeend", SAVED_SEARCHES_HTML);
}

function extractHTMLElements(): void {
  saveButton = document.getElementById("save-custom-search-button") as HTMLElement;
  textarea = document.getElementById("saved-searches-input") as HTMLTextAreaElement;
  savedSearchesList = document.getElementById("saved-search-list") as HTMLElement;
  stopEditingButton = document.getElementById("stop-editing-saved-search-button") as HTMLElement;
  importButton = document.getElementById("import-saved-search-button") as HTMLElement;
  exportButton = document.getElementById("export-saved-search-button") as HTMLElement;
  saveSearchResultsButton = document.getElementById("save-results-button") as HTMLElement;
}

function addEventListeners(): void {
  saveButton.onclick = (): void => {
    saveSearch(textarea.value.trim());
    storeSavedSearches();
  };
  textarea.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Enter":
        if (awesompleteIsUnselected(textarea)) {
          event.preventDefault();
          saveButton.click();
          textarea.blur();
          setTimeout(() => {
            textarea.focus();
          }, 100);
        }
        break;

      case "Escape":
        if (awesompleteIsUnselected(textarea) && stopEditingButton.style.display === "block") {
          stopEditingButton.click();
        }
        break;

      default:
        break;
    }
  }, {
    passive: true
  });
  exportButton.onclick = (): void => {
    exportSavedSearches();
  };
  importButton.onclick = (): void => {
    importSavedSearches();
  };
  saveSearchResultsButton.onclick = (): void => {
    saveSearchResultsAsCustomSearch();
  };
  Events.favorites.savedSearchesToggled.on(toggleSavedSearchesVisibility);
  Events.favorites.searchResultsUpdated.on((searchResults: Favorite[]): void => {
    latestSearchResults = searchResults;
  });
}

function toggleSavedSearchesVisibility(value: boolean): void {
  insertStyleHTML(`
      #right-favorites-panel {
        display: ${value ? "block" : "none"};
      }
    `, "saved-searches-visibility");
  Preferences.savedSearchesVisible.set(value);
}

function saveSearch(newSavedSearch: string): void {
  if (newSavedSearch === "" || newSavedSearch === undefined) {
    return;
  }
  const newListItem = document.createElement("li");
  const savedSearchLabel = document.createElement("div");
  const editButton = document.createElement("div");
  const removeButton = document.createElement("div");
  const moveToTopButton = document.createElement("div");

  savedSearchLabel.innerText = newSavedSearch;
  editButton.innerHTML = ICONS.EDIT;
  removeButton.innerHTML = ICONS.DELETE;
  moveToTopButton.innerHTML = ICONS.UP_ARROW;
  editButton.title = "Edit";
  removeButton.title = "Delete";
  moveToTopButton.title = "Move to top";
  savedSearchLabel.className = "save-search-label";
  editButton.className = "edit-saved-search-button";
  removeButton.className = "remove-saved-search-button";
  moveToTopButton.className = "move-saved-search-to-top-button";
  newListItem.appendChild(removeButton);
  newListItem.appendChild(editButton);
  newListItem.appendChild(moveToTopButton);
  newListItem.appendChild(savedSearchLabel);
  savedSearchesList.insertBefore(newListItem, savedSearchesList.firstChild);
  savedSearchLabel.onclick = (): void => {
    navigator.clipboard.writeText(savedSearchLabel.innerText);
    Events.searchBox.appendSearchBox.emit(savedSearchLabel.innerText);
  };
  removeButton.onclick = (): void => {
    if (inEditMode()) {
      alert("Cancel current edit before removing another search");
      return;
    }

    if (confirm(`Remove saved search: ${savedSearchLabel.innerText} ?`)) {
      savedSearchesList.removeChild(newListItem);
      storeSavedSearches();
    }
  };
  editButton.onclick = (): void => {
    if (inEditMode()) {
      alert("Cancel current edit before editing another search");
    } else {
      editSavedSearches(savedSearchLabel);
    }
  };
  moveToTopButton.onclick = (): void => {
    if (inEditMode() || newListItem.parentElement === null) {
      alert("Cancel current edit before moving this search to the top");
      return;
    }
    newListItem.parentElement.insertAdjacentElement("afterbegin", newListItem);
    storeSavedSearches();
  };
  stopEditingButton.onclick = (): void => {
    stopEditingSavedSearches(newListItem);
  };
  textarea.value = "";
}

function editSavedSearches(savedSearchLabel: HTMLElement): void {
  textarea.value = savedSearchLabel.innerText;
  saveButton.textContent = "Save Changes";
  textarea.focus();
  exportButton.style.display = "none";
  importButton.style.display = "none";
  stopEditingButton.style.display = "";
  saveButton.onclick = (): void => {
    savedSearchLabel.innerText = textarea.value.trim();
    storeSavedSearches();
    stopEditingButton.click();
  };
}

function stopEditingSavedSearches(newListItem: HTMLElement): void {
  saveButton.textContent = "Save";
  saveButton.onclick = (): void => {
    saveSearch(textarea.value.trim());
    storeSavedSearches();
  };
  textarea.value = "";
  exportButton.style.display = "";
  importButton.style.display = "";
  stopEditingButton.style.display = "none";
  newListItem.style.border = "";
}

function storeSavedSearches(): void {
  localStorage.setItem("savedSearches", JSON.stringify(getSavedSearches()));
}

function loadSavedSearches(): void {
  const savedSearches = JSON.parse(localStorage.getItem("savedSearches") ?? "[]");
  const firstUse = Boolean(Preferences.savedSearchTutorialEnabled.value);

  Preferences.savedSearchTutorialEnabled.set(false);

  if (firstUse && savedSearches.length === 0) {
    createTutorialSearches();
    return;
  }

  for (let i = savedSearches.length - 1; i >= 0; i -= 1) {
    saveSearch(savedSearches[i]);
  }
}

function createTutorialSearches(): void {
  const searches: string[] = [];

  Events.favorites.startedFetchingFavorites.on(async(): Promise<void> => {
    await sleep(1000);
    const postIds = getAllThumbs().map(thumb => thumb.id);

    shuffleArray(postIds);

    const exampleSearch = `( EXAMPLE: ~ ${postIds.slice(0, 9).join(" ~ ")} ) ( male* ~ female* ~ 1boy ~ 1girls )`;

    searches.push(exampleSearch);

    for (let i = searches.length - 1; i >= 0; i -= 1) {
      saveSearch(searches[i]);
    }
    storeSavedSearches();
  }, {
    once: true
  });
}

function inEditMode(): boolean {
  return stopEditingButton.style.display !== "none";
}

function exportSavedSearches(): void {
  const savedSearchString = Array.from(document.getElementsByClassName("save-search-label")).map(search => (search as HTMLElement).innerText).join("\n");

  navigator.clipboard.writeText(savedSearchString);
  alert("Copied saved searches to clipboard");
}

function importSavedSearches(): void {
  const doesNotHaveSavedSearches = savedSearchesList.querySelectorAll("li").length === 0;

  if (doesNotHaveSavedSearches || confirm("Are you sure you want to import saved searches? This will overwrite current saved searches.")) {
    const savedSearches = textarea.value.split("\n");

    savedSearchesList.innerHTML = "";

    for (let i = savedSearches.length - 1; i >= 0; i -= 1) {
      saveSearch(savedSearches[i]);
    }
    storeSavedSearches();
  }
}

function saveSearchResultsAsCustomSearch(): void {
  const searchResultIds = latestSearchResults.map(favorite => favorite.id);

  if (searchResultIds.length === 0) {
    return;
  }

  if (searchResultIds.length > 300) {
    if (!confirm(`Are you sure you want to save ${searchResultIds.length} ids as one search?`)) {
      return;
    }
  }
  const customSearch = `( ${searchResultIds.join(" ~ ")} )`;

  saveSearch(customSearch);
  storeSavedSearches();
}
