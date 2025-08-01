import { FAVORITES_CONTENT_CONTAINER } from "../structure/favorites_content_container";
import { ON_DESKTOP_DEVICE } from "../../../../lib/global/flags/intrinsic_flags";
import { Preferences } from "../../../../lib/global/preferences/preferences";
import { insertStyleHTML } from "../../../../utils/dom/style";
import { sleep } from "../../../../utils/misc/async";
import { toggleFavoritesOptions } from "../favorites_menu_event_handlers";
import { tryResetting } from "../../../../lib/flows/reset";

export function createMobileSearchBar(id: string, parentId: string, onClick: () => void): HTMLInputElement {
  insertMobileSearchBar(id, parentId);
  const searchButton = document.getElementById("search-button");
  const searchBar = document.getElementById(id);
  const clearButton = document.querySelector(".search-clear-container");
  const resetButton = document.getElementById("reset-button");

  if (!(searchBar instanceof HTMLInputElement) || searchButton === null || !(clearButton instanceof HTMLElement) || !(resetButton instanceof HTMLElement)) {
    return document.createElement("input");
  }
  searchButton.onclick = onClick;
  searchBar.addEventListener("input", () => {
    const clearButtonContainer = document.querySelector(".search-clear-container");

    if (clearButtonContainer === null) {
      return;
    }
    const clearButtonIsHidden = getComputedStyle(clearButtonContainer).visibility === "hidden";
    const searchBarIsEmpty = searchBar.value === "";
    const styleId = "search-clear-button-visibility";

    if (searchBarIsEmpty && !clearButtonIsHidden) {
      insertStyleHTML(".search-clear-container {visibility: hidden}", styleId);
    } else if (!searchBarIsEmpty && clearButtonIsHidden) {
      insertStyleHTML(".search-clear-container {visibility: visible}", styleId);
    }
  });

  clearButton.onclick = (): void => {
    searchBar.value = "";
    searchBar.dispatchEvent(new Event("input"));
  };
  resetButton.onclick = tryResetting;

  const options = document.getElementById("options-checkbox");

  if (!(options instanceof HTMLInputElement)) {
    return searchBar;
  }
  let headerIsVisible = true;

  toggleFavoritesOptions(Preferences.optionsVisible.value);
  options.checked = Preferences.optionsVisible.value;

  options.addEventListener("change", () => {
    Preferences.optionsVisible.set(options.checked);
    toggleFavoritesOptions(options.checked);

    if (!headerIsVisible) {
      FAVORITES_CONTENT_CONTAINER.classList.toggle("sticky-menu", options.checked);
    }
  });
  const stickyMenuHTML = `
     #favorites-search-gallery-content {
        margin-top: 65px;
        margin-bottom: 65px;
      }
      #favorites-search-gallery-menu {
          position: fixed;
          margin-top: 0;
      }`;
  const header = document.getElementById("header");
  const onHeaderVisibilityChange = async(headerVisible: boolean): Promise<void> => {
    headerIsVisible = headerVisible;
    insertStyleHTML(headerVisible ? "" : stickyMenuHTML, "sticky-menu");
    const optionsMenu = document.getElementById("left-favorites-panel-bottom-row");

    FAVORITES_CONTENT_CONTAINER.classList.remove("sticky-menu");
    FAVORITES_CONTENT_CONTAINER.classList.remove("sticky-menu-shadow");

    if (optionsMenu === null) {
      return;
    }
    const menuIsOpen = !optionsMenu.classList.contains("hidden");

    if (!headerVisible) {
      if (menuIsOpen) {
        FAVORITES_CONTENT_CONTAINER.classList.add("sticky-menu");
      }
      await sleep(30);
      FAVORITES_CONTENT_CONTAINER.classList.add("sticky-menu-shadow");
    }
  };

  if (header !== null) {
    const observer = new IntersectionObserver((entries) => {
      onHeaderVisibilityChange(entries[0].isIntersecting);
    }, { threshold: 0 });

    observer.observe(header);
  }
  createMobileSymbolRow(searchBar);
  return searchBar;
}

function insertMobileSearchBar(id: string, parentId: string): void {
  const html = `
      <div id="mobile-toolbar-row" class="light-green-gradient">
          <div class="search-bar-container light-green-gradient">
              <div class="search-bar-items">
                  <div>
                      <div class="circle-icon-container">
                          <svg class="search-icon" id="search-button" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
                          </svg>
                      </div>
                  </div>
                  <div class="search-bar-input-container">
                      <input type="text" id="${id}" class="search-bar-input" needs-autocomplete placeholder="Search Favorites">
                  </div>
                  <div class="toolbar-button search-clear-container">
                      <div class="circle-icon-container">
                          <svg id="clear-button" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
                          </svg>
                      </div>
                  </div>
                  <div>
                      <input type="checkbox" id="options-checkbox" data-action="toggleOptions">
                      <label for="options-checkbox" class="mobile-toolbar-checkbox-label">
                        <svg id="options-menu-icon" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#5f6368">
                          <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
                        </svg>
                      </label>
                  </div>
                  <div>
                        <div id="reset-button">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                            <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-84 31.5-156.5T197-763l56 56q-44 44-68.5 102T160-480q0 134 93 227t227 93q134 0 227-93t93-227q0-67-24.5-125T707-707l56-56q54 54 85.5 126.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-360v-440h80v440h-80Z"/>
                          </svg>
                        </div>
                  </div>
                  <div style="display: none;">
                        <div id="">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                            <path d="M424-320q0-81 14.5-116.5T500-514q41-36 62.5-62.5T584-637q0-41-27.5-68T480-732q-51 0-77.5 31T365-638l-103-44q21-64 77-111t141-47q105 0 161.5 58.5T698-641q0 50-21.5 85.5T609-475q-49 47-59.5 71.5T539-320H424Zm56 240q-33 0-56.5-23.5T400-160q0-33 23.5-56.5T480-240q33 0 56.5 23.5T560-160q0 33-23.5 56.5T480-80Z"/>
                          </svg>
                        </div>
                  </div>
              </div>
          </div>
      </div>
        `;

  const parent = document.getElementById(parentId);

  if (parent !== null) {
    parent.insertAdjacentHTML("afterend", html);
  }
}

function createMobileSymbolRow(searchBox: HTMLInputElement): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  const placeToInsert = document.getElementById("left-favorites-panel");

  if (placeToInsert === null) {
    return;
  }
  const symbolContainer = document.createElement("div");

  symbolContainer.id = "mobile-symbol-container";
  symbolContainer.innerHTML = `
            <button>-</button>
          <button>*</button>
          <button>_</button>
          <button>(</button>
          <button>)</button>
          <button>~</button>
  `;
  placeToInsert.insertAdjacentElement("afterbegin", symbolContainer);

  for (const button of Array.from(symbolContainer.querySelectorAll("button"))) {
    button.addEventListener("blur", async() => {
      await sleep(0);

      if ((document.activeElement === null) || (document.activeElement.id !== "favorites-search-box" && !symbolContainer.contains(document.activeElement))) {
        symbolContainer.classList.toggle("active", false);
      }
    });

    button.addEventListener("click", (): void => {
      const value = searchBox.value;
      const selectionStart = searchBox.selectionStart ?? 0;

      searchBox.value = value.slice(0, selectionStart) + button.textContent + value.slice(selectionStart);
      // this.updateVisibilityOfSearchClearButton();
      searchBox.selectionStart = selectionStart + 1;
      searchBox.selectionEnd = selectionStart + 1;
      searchBox.focus();
    }, {
      passive: true
    });
  }
  searchBox.addEventListener("focus", () => {
    symbolContainer.classList.toggle("active", true);
  }, {
    passive: true
  });

  searchBox.addEventListener("blur", async() => {
    await sleep(10);

    if (document.activeElement === null || (document.activeElement.id !== "favorites-search-box" && !symbolContainer.contains(document.activeElement))) {
      symbolContainer.classList.toggle("active", false);
    }
  });

}
