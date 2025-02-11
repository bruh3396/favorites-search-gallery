class FavoritesPaginator {
  /**
   * @type {HTMLDivElement}
   */
  content;
  /**
   * @type {HTMLElement}
   */
  pageSelectionMenu;
  /**
   * @type {HTMLLabelElement}
   */
  // @ts-ignore
  rangeIndicator;
  /**
   * @type {Number}
   */
  currentPageNumber;
  /**
   * @type {Number}
   */
  maxFavoritesPerPage;
  /**
   * @type {Number}
   */
  maxPageNumberButtons;
  /**
   * @type {Masonry}
   */
  masonry;
  /**
   * @type {Function}
   */
  onPageChange;

  /**
   * @type {Boolean}
   */
  get usingMasonry() {
    return this.content.classList.contains("masonry");
  }

  /**
   * @type {Boolean}
   */
  get usingHorizontalLayout() {
    return this.content.classList.contains("row");
  }

  /**
   * @param {Function} onPageChange
   */
  constructor(onPageChange) {
    this.content = this.createContentContainer();
    this.pageSelectionMenu = this.createPageSelectionMenuContainer();
    this.currentPageNumber = 1;
    this.maxFavoritesPerPage = Number(Utils.getPreference("resultsPerPage", 150));
    this.maxPageNumberButtons = Utils.onMobileDevice() ? 4 : 5;
    this.masonry = null;
    this.onPageChange = onPageChange;
    this.setupPageSelectionMenu();
    this.updateMasonryOnWindowResize();
  }

  /**
   * @returns {HTMLDivElement}
   */
  createContentContainer() {
    const content = document.createElement("div");

    content.id = "favorites-search-gallery-content";
    content.className = String(Utils.getPreference("layoutSelect", "masonry"));
    Utils.favoritesSearchGalleryContainer.appendChild(content);
    return content;
  }

  /**
   * @returns {HTMLSpanElement}
   */
  createPageSelectionMenuContainer() {
    const menu = document.createElement("span");

    menu.id = "favorites-pagination-container";
    return menu;
  }

  insertPageSelectionMenu() {
    const placeToInsertMenu = document.getElementById("favorites-pagination-placeholder");

    if (placeToInsertMenu !== null) {
      placeToInsertMenu.insertAdjacentElement("afterend", this.pageSelectionMenu);
      placeToInsertMenu.remove();
    }
  }

  setupPageSelectionMenu() {
    this.insertPageSelectionMenu();
    this.updatePageSelectionMenu(1, []);
  }

  updateMasonryOnWindowResize() {
    window.addEventListener("resize", () => {
      const columnInput = document.getElementById("column-count");

      if (columnInput !== null && (columnInput instanceof HTMLInputElement)) {
        this.updateColumnCount(columnInput);
      }
        this.updateMasonry();
    });
  }

  /**
   * @param {Post[]} favorites
   */
  paginate(favorites) {
    this.changePage(1, favorites);
  }

  /**
   * @param {Post[]} favorites
   */
  paginateWhileFetching(favorites) {
    const pageNumberButtons = document.getElementsByClassName("pagination-number");
    // @ts-ignore
    const lastPageButtonNumber = pageNumberButtons.length > 0 ? parseInt(pageNumberButtons[pageNumberButtons.length - 1].textContent) : 1;
    const pageCount = this.getPageCount(favorites.length);
    const needsToCreateNewPage = pageCount > lastPageButtonNumber;
    const nextPageButton = document.getElementById("next-page");
    const alreadyAtMaxPageNumberButtons = document.getElementsByClassName("pagination-number").length >= this.maxPageNumberButtons &&
      nextPageButton !== null && nextPageButton.style.display !== "none" &&
      // @ts-ignore
      nextPageButton.style.visibility !== "hidden" && !nextPageButton.disabled;
    const onLastPage = (pageCount === this.currentPageNumber);

    if (needsToCreateNewPage && !alreadyAtMaxPageNumberButtons) {
      this.updatePageSelectionMenu(this.currentPageNumber, favorites);
    } else {
      this.updateArrowButtonEventListeners(favorites);
      this.updateNumberTraversalButtonEventListeners(favorites);
    }

    if (!onLastPage) {
      return;
    }
    const range = this.getPaginationRange(this.currentPageNumber);
    const favoritesToAdd = favorites.slice(range.start, range.end)
      .filter(favorite => document.getElementById(favorite.id) === null);

    for (const favorite of favoritesToAdd) {
      // @ts-ignore
      favorite.insertAtEndOfContent(this.content);
    }

    this.removeSpacers();
    this.forceActivateMasonry();
    this.updateRangeIndicator(this.currentPageNumber, favorites.length);
  }

  /**
   * @param {Number} pageNumber
   * @param {Post[]} favorites
   */
  changePage(pageNumber, favorites) {
    this.currentPageNumber = pageNumber;
    this.updatePageSelectionMenu(pageNumber, favorites);
    this.showFavorites(pageNumber, favorites);
    this.onPageChange();
  }

  /**
   * @param {Number} pageNumber
   * @param {Post[]} favorites
   */
  updatePageSelectionMenu(pageNumber, favorites) {
    this.pageSelectionMenu.innerHTML = "";
    this.updateRangeIndicator(pageNumber, favorites.length);
    this.createNumberTraversalButtons(pageNumber, favorites);
    this.createArrowTraversalButtons(favorites);
    this.createGotoSpecificPageInputs(favorites);
  }

  /**
   * @param {Number} pageNumber
   * @param {Number} favoriteCount
   */
  updateRangeIndicator(pageNumber, favoriteCount) {
    const range = this.getPaginationRange(pageNumber);
    const start = range.start;
    const end = Math.min(range.end, favoriteCount);

    if (this.rangeIndicator === undefined) {
      // @ts-ignore
      this.rangeIndicator = document.getElementById("pagination-range-label");
    }

    if (favoriteCount <= this.maxFavoritesPerPage || isNaN(start) || isNaN(end)) {
      this.rangeIndicator.textContent = "";
      return;
    }
    this.rangeIndicator.textContent = `${start + 1} - ${end}`;
  }

  /**
   * @param {Number} pageNumber
   * @returns {{start: Number, end: Number}}
   */
  getPaginationRange(pageNumber) {
    return {
      start: this.maxFavoritesPerPage * (pageNumber - 1),
      end: this.maxFavoritesPerPage * pageNumber
    };
  }

  /**
   * @param {Number} favoriteCount
   * @returns {Number}
   */
  getPageCount(favoriteCount) {
    if (favoriteCount === 0) {
      return 1;
    }
    const pageCount = favoriteCount / this.maxFavoritesPerPage;

    if (favoriteCount % this.maxFavoritesPerPage === 0) {
      return pageCount;
    }
    return Math.floor(pageCount) + 1;
  }

  /**
   * @param {Number} pageNumber
   * @param {Post[]} favorites
   */
  createNumberTraversalButtons(pageNumber, favorites) {
    const pageCount = this.getPageCount(favorites.length);
    let numberOfButtonsCreated = 0;

    for (let i = pageNumber; i <= pageCount && numberOfButtonsCreated < this.maxPageNumberButtons; i += 1) {
      numberOfButtonsCreated += 1;
      this.createNumberTraversalButton(pageNumber, i, favorites);
    }

    if (numberOfButtonsCreated >= this.maxPageNumberButtons) {
      return;
    }

    for (let j = pageNumber - 1; j >= 1 && numberOfButtonsCreated < this.maxPageNumberButtons; j -= 1) {
      numberOfButtonsCreated += 1;
      this.createNumberTraversalButton(pageNumber, j, favorites, "afterbegin");
    }
  }

  /**
   * @param {Number} currentPageNumber
   * @param {Number} pageNumber
   * @param {Post[]} favorites
   * @param {InsertPosition} position
   */
  createNumberTraversalButton(currentPageNumber, pageNumber, favorites, position = "beforeend") {
    const pageNumberButton = document.createElement("button");
    const selected = currentPageNumber === pageNumber;

    pageNumberButton.id = `favorites-page-${pageNumber}`;
    pageNumberButton.title = `Goto page ${pageNumber}`;
    pageNumberButton.className = "pagination-number";
    pageNumberButton.classList.toggle("selected", selected);
    pageNumberButton.onclick = () => {
      this.changePage(pageNumber, favorites);
    };
    this.pageSelectionMenu.insertAdjacentElement(position, pageNumberButton);
    pageNumberButton.textContent = String(pageNumber);
  }

  /**
   * @param {Post[]} favorites
   */
  updateNumberTraversalButtonEventListeners(favorites) {
    const pageNumberButtons = Array.from(document.getElementsByClassName("pagination-number"));

    for (const pageNumberButton of pageNumberButtons) {
      const pageNumber = parseInt(Utils.removeNonNumericCharacters(pageNumberButton.id));

      if (pageNumberButton instanceof HTMLElement) {
        pageNumberButton.onclick = () => {
          this.changePage(pageNumber, favorites);
        };
      }
    }
  }

  /**
   * @param {Post[]} favorites
   */
  createArrowTraversalButtons(favorites) {
    const pageCount = this.getPageCount(favorites.length);
    const previousPage = document.createElement("button");
    const firstPage = document.createElement("button");
    const nextPage = document.createElement("button");
    const finalPage = document.createElement("button");

    previousPage.textContent = "<";
    firstPage.textContent = "<<";
    nextPage.textContent = ">";
    finalPage.textContent = ">>";

    previousPage.id = "previous-page";
    firstPage.id = "first-page";
    nextPage.id = "next-page";
    finalPage.id = "final-page";

    previousPage.title = "Goto previous page";
    firstPage.title = "Goto first page";
    nextPage.title = "Goto next page";
    finalPage.title = "Goto last page";

    previousPage.onclick = () => {
      if (this.currentPageNumber - 1 >= 1) {
        this.changePage(this.currentPageNumber - 1, favorites);
      }
    };
    firstPage.onclick = () => {
      this.changePage(1, favorites);
    };
    nextPage.onclick = () => {
      if (this.currentPageNumber + 1 <= pageCount) {
        this.changePage(this.currentPageNumber + 1, favorites);
      }
    };
    finalPage.onclick = () => {
      this.changePage(pageCount, favorites);
    };
    this.pageSelectionMenu.insertAdjacentElement("afterbegin", previousPage);
    this.pageSelectionMenu.insertAdjacentElement("afterbegin", firstPage);
    this.pageSelectionMenu.appendChild(nextPage);
    this.pageSelectionMenu.appendChild(finalPage);

    this.updateArrowTraversalButtonInteractability(previousPage, firstPage, nextPage, finalPage, this.getPageCount(favorites.length));
  }

  /**
   * @param {Post[]} favorites
   */
  createGotoSpecificPageInputs(favorites) {
    if (this.firstNumberTraversalButtonExists() && this.lastNumberTraversalButtonExists(this.getPageCount(favorites.length))) {
      return;
    }
    const container = document.createElement("span");
    const input = document.createElement("input");
    const button = document.createElement("button");

    container.title = "Goto specific page";
    input.type = "number";
    input.placeholder = "#";
    input.id = "goto-page-input";
    button.textContent = "Go";
    button.id = "goto-page-button";
    input.onkeydown = (event) => {
      if (event.key === "Enter") {
        button.click();
      }
    };
    container.appendChild(input);
    container.appendChild(button);
    this.pageSelectionMenu.appendChild(container);
    this.updateArrowButtonEventListeners(favorites);
  }

  /**
   * @param {Post[]} favorites
   */
  updateArrowButtonEventListeners(favorites) {
    const gotoPageButton = document.getElementById("goto-page-button");
    const finalPageButton = document.getElementById("final-page");
    const input = document.getElementById("goto-page-input");
    const pageCount = this.getPageCount(favorites.length);

    if (gotoPageButton === null || finalPageButton === null || input === null) {
      return;
    }

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    gotoPageButton.onclick = () => {
      if (!Utils.isOnlyDigits(input.value)) {
        return;
      }
      let pageNumber = parseInt(input.value);

      pageNumber = Utils.clamp(pageNumber, 1, pageCount);
      this.changePage(pageNumber, favorites);

    };
    finalPageButton.onclick = () => {
      this.changePage(pageCount, favorites);
    };
  }

  /**
   * @param {Number} pageNumber
   * @param {Post[]} favorites
   */
  showFavorites(pageNumber, favorites) {
    const {start, end} = this.getPaginationRange(pageNumber);
    const newContent = document.createDocumentFragment();

    for (const favorite of favorites.slice(start, end)) {
      favorite.insertAtEndOfContent(newContent);
    }
    this.content.innerHTML = "";
    this.content.appendChild(newContent);
    this.forceActivateMasonry();
    this.addSpacers();

    Utils.scrollToTop();
  }

  forceActivateMasonry() {
    if (this.usingMasonry) {
      this.deactivateMasonry();
      this.activateMasonry();
      // @ts-ignore
      imagesLoaded(this.content).on("always", () => {
        this.updateMasonry();
      });
    }
  }

  /**
   * @returns {Boolean}
   */
  firstNumberTraversalButtonExists() {
    return document.getElementById("favorites-page-1") !== null;
  }

  /**
   * @param {Number} pageCount
   * @returns {Boolean}
   */
  lastNumberTraversalButtonExists(pageCount) {
    return document.getElementById(`favorites-page-${pageCount}`) !== null;
  }

  /**
   * @param {HTMLButtonElement} previousPage
   * @param {HTMLButtonElement} firstPage
   * @param {HTMLButtonElement} nextPage
   * @param {HTMLButtonElement} finalPage
   * @param {Number} pageCount
   */
  updateArrowTraversalButtonInteractability(previousPage, firstPage, nextPage, finalPage, pageCount) {
    const firstNumberExists = this.firstNumberTraversalButtonExists();
    const lastNumberExists = this.lastNumberTraversalButtonExists(pageCount);

    if (firstNumberExists && lastNumberExists) {
      previousPage.disabled = true;
      firstPage.disabled = true;
      nextPage.disabled = true;
      finalPage.disabled = true;
    } else {
      if (firstNumberExists) {
        previousPage.disabled = true;
        firstPage.disabled = true;
      }

      if (lastNumberExists) {
        nextPage.disabled = true;
        finalPage.disabled = true;
      }
    }
  }

  /**
   * @param {String} direction
   * @param {Post[]} favorites
   * @returns {Boolean}
   */
  changePageWhileInGallery(direction, favorites) {
    const pageCount = this.getPageCount(favorites.length);
    const onLastPage = this.currentPageNumber === pageCount;
    const onFirstPage = this.currentPageNumber === 1;
    const onlyOnePage = onFirstPage && onLastPage;

    if (onlyOnePage) {
      return false;
    }

    if (onLastPage && direction === "ArrowRight") {
      this.changePage(1, favorites);
      return true;
    }

    if (onFirstPage && direction === "ArrowLeft") {
      this.changePage(pageCount, favorites);
      return true;
    }
    const newPageNumber = direction === "ArrowRight" ? this.currentPageNumber + 1 : this.currentPageNumber - 1;

    this.changePage(newPageNumber, favorites);
    return true;
  }

  /**
   * @param {Post[]} searchResults
   */
  insertNewSearchResults(searchResults) {
    for (const searchResult of searchResults) {
      searchResult.insertAtBeginningOfContent(this.content);
    }

    if (this.usingMasonry) {
      this.forceActivateMasonry();
    }
  }

  /**
   * @param {String} id
   * @param {Post[]} favorites
   */
  async findFavorite(id, favorites) {
    const favoriteIds = favorites.map(favorite => favorite.id);
    const index = favoriteIds.indexOf(id);
    const favoriteNotFound = index === -1;

    if (favoriteNotFound) {
      return;
    }
    const pageNumber = Math.floor(index / this.maxFavoritesPerPage) + 1;

    dispatchEvent(new CustomEvent("foundFavorite", {
      detail: id
    }));

    if (this.currentPageNumber !== pageNumber) {
      this.changePage(pageNumber, favorites);
    }
    const thumb = document.getElementById(id);

    if (thumb === null || thumb.classList.contains("blink")) {
      return;
    }
    Utils.smoothScrollToElement(thumb, 300);
    thumb.classList.add("blink");
    await Utils.sleep(1500);
    thumb.classList.remove("blink");
  }

  /**
   * @param {"grid" | "row" | "masonry"} layout
   */
  changeLayout(layout) {
    this.content.className = layout;

    if (layout === "row") {
      this.addSpacers();
    } else {
      this.removeSpacers();
    }

    if (layout === "masonry") {
      this.activateMasonry();
    } else {
      this.deactivateMasonry();
    }
  }

  activateMasonry() {
    this.masonry = new Masonry(this.content, {
      itemSelector: ".favorite",
      columnWidth: ".favorite",
      gutter: 10,
      horizontalOrder: true,
      isFitWidth: true,
      resize: false
    });
  }

  deactivateMasonry() {
    if (this.masonry !== null) {
      this.masonry.destroy();
      this.masonry = null;
    }
  }

  updateMasonry() {
    if (this.masonry !== null) {
      this.masonry.layout();
    }
  }

  addSpacers() {
    if (!this.usingHorizontalLayout) {
      return;
    }
    this.removeSpacers();

    for (let i = 0; i < 8; i += 1) {
      this.content.appendChild(this.createSpacer());
    }
  }

  removeSpacers() {
    for (const spacer of Array.from(document.getElementsByClassName("spacer"))) {
      spacer.remove();
    }
  }

  createSpacer() {
    const spacer = document.createElement("div");

    spacer.className = "spacer";
    return spacer;
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateColumnCount(input) {
    const columnCount = parseFloat(input.value);
    const width = Math.floor(window.innerWidth / columnCount) - 15;

    Utils.insertStyleHTML(`
      #favorites-search-gallery-content {
        &.grid {
          grid-template-columns: repeat(${columnCount}, 1fr) !important;
        }

        &.masonry {
          margin: 0 auto !important;

          >.favorite {
            width: ${width}px;
          }
        }
      }
      `, "column-count");
    this.updateMasonry();
  }

  /**
   * @param {HTMLInputElement} input
   */
  updateRowSize(input) {
    const rowSize = parseFloat(input.value);
    const min = parseInt(input.getAttribute("min") || "1");
    const max = parseInt(input.getAttribute("max") || "5");
    const pixelSize = Math.round(Utils.mapRange(rowSize, min, max, 100, 400));

    Utils.insertStyleHTML(`
      #favorites-search-gallery-content {
        &.row  {
          >.favorite,>.spacer {
            height: ${pixelSize}px;
          }
          >.spacer {
            height: ${pixelSize}px;
            width: ${pixelSize}px;
          }
        }
      }
      `, "row-size");
  }

  /**
   * @param {Number} resultsPerPage
   */
  updateResultsPerPage(resultsPerPage) {
    this.maxFavoritesPerPage = resultsPerPage;
  }
}
