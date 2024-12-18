class FavoritesPaginator {
  /**
   * @type {HTMLDivElement}
   */
  content;
  /**
   * @type {HTMLElement}
   */
  paginationMenu;
  /**
   * @type {HTMLLabelElement}
   */
  paginationLabel;
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

  constructor() {
    this.content = this.createContentContainer();
    this.paginationMenu = this.createPaginationMenuContainer();
    this.currentPageNumber = 1;
    this.favoritesPerPage = Utils.getPreference("resultsPerPage", Utils.defaults.resultsPerPage);
    this.maxPageNumberButtons = Utils.onMobileDevice() ? 3 : 5;
  }

  /**
   * @returns {HTMLDivElement}
   */
  createContentContainer() {
    const content = document.createElement("div");

    content.id = "favorites-search-gallery-content";
    Utils.favoritesSearchGalleryContainer.appendChild(content);
    return content;
  }

  /**
   * @returns {HTMLDivElement}
   */
  createPaginationMenuContainer() {
    const container = document.createElement("span");

    container.id = "favorites-pagination-container";
    return container;
  }

  insertPaginationMenuContainer() {
    if (document.getElementById(this.paginationMenu.id) === null) {

      if (Utils.onMobileDevice()) {
        document.getElementById("favorites-search-gallery-menu").insertAdjacentElement("afterbegin", this.paginationMenu);
      } else {
        const placeToInsertPagination = document.getElementById("favorites-pagination-placeholder");

        placeToInsertPagination.insertAdjacentElement("afterend", this.paginationMenu);
        placeToInsertPagination.remove();
      }
    }
  }

  /**
   * @param {Post[]} favorites
   */
  paginate(favorites) {
    this.insertPaginationMenuContainer();
    this.changePage(1, favorites);
  }

  /**
   * @param {Post[]} favorites
   */
  paginateWhileFetching(favorites) {
    const pageNumberButtons = document.getElementsByClassName("pagination-number");
    const lastPageButtonNumber = pageNumberButtons.length > 0 ? parseInt(pageNumberButtons[pageNumberButtons.length - 1].textContent) : 1;
    const pageCount = this.getPageCount(favorites.length);
    const needsToCreateNewPage = pageCount > lastPageButtonNumber;
    const nextPageButton = document.getElementById("next-page");
    const alreadyAtMaxPageNumberButtons = document.getElementsByClassName("pagination-number").length >= this.maxPageNumberButtons &&
      nextPageButton !== null && nextPageButton.style.display !== "none" &&
      nextPageButton.style.visibility !== "hidden";

    if (needsToCreateNewPage && !alreadyAtMaxPageNumberButtons) {
      this.createPaginationMenu(this.currentPageNumber, favorites);
    } else {
      this.updateTraversalButtonEventListeners(favorites);
      this.updatePageNumberButtonEventListeners(favorites);
    }
    const onLastPage = (pageCount === this.currentPageNumber);

    if (!onLastPage) {
      return;
    }
    const range = this.getPaginationRange(this.currentPageNumber);
    const favoritesToAdd = favorites.slice(range.start, range.end)
      .filter(favorite => document.getElementById(favorite.id) === null);

    for (const favorite of favoritesToAdd) {
      favorite.insertAtEndOfContent(this.content);
    }
    this.setPaginationLabel(this.currentPageNumber, favorites.length);
  }

  /**
   * @param {Number} pageNumber
   * @param {Post[]} favorites
   */
  changePage(pageNumber, favorites) {
    this.currentPageNumber = pageNumber;
    this.createPaginationMenu(pageNumber, favorites);
    this.showFavorites(pageNumber, favorites);

    if (FavoritesLoader.currentState !== FavoritesLoader.states.loadingFavoritesFromDatabase) {
      dispatchEvent(new Event("changedPage"));
    }
  }

  /**
   * @param {Number} pageNumber
   * @param {Post[]} favorites
   */
  createPaginationMenu(pageNumber, favorites) {
    this.paginationMenu.innerHTML = "";
    this.setPaginationLabel(pageNumber, favorites.length);
    this.createPageNumberButtons(pageNumber, favorites);
    this.createPageTraversalButtons(favorites);
    this.createGotoSpecificPageInputs(favorites);
  }

  /**
   * @param {Number} pageNumber
   * @param {Number} favoriteCount
   */
  setPaginationLabel(pageNumber, favoriteCount) {
    const range = this.getPaginationRange(pageNumber);
    const start = range.start;
    const end = Math.min(range.end, favoriteCount);

    if (this.paginationLabel === undefined) {
      this.paginationLabel = document.getElementById("pagination-label");
    }

    if (favoriteCount <= this.maxFavoritesPerPage || isNaN(start) || isNaN(end)) {
      this.paginationLabel.textContent = "";
      return;
    }
    this.paginationLabel.textContent = `${start + 1} - ${end}`;
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
  createPageNumberButtons(pageNumber, favorites) {
    const pageCount = this.getPageCount(favorites.length);
    let numberOfButtonsCreated = 0;

    for (let i = pageNumber; i <= pageCount && numberOfButtonsCreated < this.maxPageNumberButtons; i += 1) {
      numberOfButtonsCreated += 1;
      this.createPageNumberButton(pageNumber, i, favorites);
    }

    if (numberOfButtonsCreated >= this.maxPageNumberButtons) {
      return;
    }

    for (let j = pageNumber - 1; j >= 1 && numberOfButtonsCreated < this.maxPageNumberButtons; j -= 1) {
      numberOfButtonsCreated += 1;
      this.createPageNumberButton(pageNumber, j, favorites, "afterbegin");
    }
  }

  /**
   * @param {Number} currentPageNumber
   * @param {Number} pageNumber
   * @param {Post[]} favorites
   * @param {InsertPosition} position
   */
  createPageNumberButton(currentPageNumber, pageNumber, favorites, position = "beforeend") {
    const pageNumberButton = document.createElement("button");
    const selected = currentPageNumber === pageNumber;

    pageNumberButton.id = `favorites-page-${pageNumber}`;
    pageNumberButton.title = `Goto page ${pageNumber}`;
    pageNumberButton.className = "pagination-number";
    pageNumberButton.classList.toggle("selected", selected);
    pageNumberButton.onclick = () => {
      this.changePage(pageNumber, favorites);
    };
    this.paginationMenu.insertAdjacentElement(position, pageNumberButton);
    pageNumberButton.textContent = pageNumber;
  }

  /**
   * @param {Post[]} favorites
   */
  updatePageNumberButtonEventListeners(favorites) {
    const pageNumberButtons = document.getElementsByClassName("pagination-number");

    for (const pageNumberButton of pageNumberButtons) {
      const pageNumber = parseInt(Utils.removeNonNumericCharacters(pageNumberButton.id));

      pageNumberButton.onclick = () => {
        this.changePage(pageNumber, favorites);
      };
    }
  }

  /**
   * @param {Post[]} favorites
   */
  createPageTraversalButtons(favorites) {
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
    this.paginationMenu.insertAdjacentElement("afterbegin", previousPage);
    this.paginationMenu.insertAdjacentElement("afterbegin", firstPage);
    this.paginationMenu.appendChild(nextPage);
    this.paginationMenu.appendChild(finalPage);

    this.updateVisibilityOfPageTraversalButtons(previousPage, firstPage, nextPage, finalPage, this.getPageCount(favorites.length));
  }

  /**
   * @param {Post[]} favorites
   */
  createGotoSpecificPageInputs(favorites) {
    if (this.firstPageNumberButtonExists() && this.lastPageNumberButtonExists(this.getPageCount(favorites.length))) {
      return;
    }
    const html = `
      <input type="number" placeholder="page" style="width: 4em;" id="goto-page-input">
      <button id="goto-page-button">Go</button>
    `;
    const container = document.createElement("span");

    container.title = "Goto specific page";
    container.innerHTML = html;
    const input = container.children[0];
    const button = container.children[1];

    input.onkeydown = (event) => {
      if (event.key === "Enter") {
        button.click();
      }
    };
    this.paginationMenu.appendChild(container);
    this.updateTraversalButtonEventListeners(favorites);
  }

  /**
   * @param {Post[]} favorites
   */
  updateTraversalButtonEventListeners(favorites) {
    const gotoPageButton = document.getElementById("goto-page-button");
    const finalPageButton = document.getElementById("final-page");
    const input = document.getElementById("goto-page-input");
    const pageCount = this.getPageCount(favorites.length);

    if (gotoPageButton === null || finalPageButton === null || input === null) {
      return;
    }

    gotoPageButton.onclick = () => {
      let pageNumber = parseInt(input.value);

      if (!Utils.isNumber(pageNumber)) {
        return;
      }
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
    window.scrollTo(0, 0);
  }

  /**
   * @returns {Boolean}
   */
  firstPageNumberButtonExists() {
    return document.getElementById("favorites-page-1") !== null;
  }

  /**
   * @param {Number} pageCount
   * @returns {Boolean}
   */
  lastPageNumberButtonExists(pageCount) {
    return document.getElementById(`favorites-page-${pageCount}`) !== null;
  }

  /**
   * @param {HTMLButtonElement} previousPage
   * @param {HTMLButtonElement} firstPage
   * @param {HTMLButtonElement} nextPage
   * @param {HTMLButtonElement} finalPage
   * @param {Number} pageCount
   */
  updateVisibilityOfPageTraversalButtons(previousPage, firstPage, nextPage, finalPage, pageCount) {
    const firstNumberExists = this.firstPageNumberButtonExists();
    const lastNumberExists = this.lastPageNumberButtonExists(pageCount);

    if (firstNumberExists && lastNumberExists) {
      previousPage.style.visibility = "hidden";
      firstPage.style.visibility = "hidden";
      nextPage.style.visibility = "hidden";
      finalPage.style.visibility = "hidden";
    } else {
      if (firstNumberExists) {
        previousPage.style.visibility = "hidden";
        firstPage.style.visibility = "hidden";
      }

      if (lastNumberExists) {
        nextPage.style.visibility = "hidden";
        finalPage.style.visibility = "hidden";
      }
    }
  }

  /**
   * @param {String} direction
   * @param {Post[]} favorites
   */
  changePageWhileInGallery(direction, favorites) {
    const pageCount = this.getPageCount(favorites.length);
    const onLastPage = this.currentPageNumber === pageCount;
    const onFirstPage = this.currentPageNumber === 1;
    const onlyOnePage = onFirstPage && onLastPage;

    if (onlyOnePage) {
      dispatchEvent(new CustomEvent("didNotChangePageInGallery", {
        detail: direction
      }));
      return;
    }

    if (onLastPage && direction === "ArrowRight") {
      this.changePage(1, favorites);
      return;
    }

    if (onFirstPage && direction === "ArrowLeft") {
      this.changePage(pageCount, favorites);
      return;
    }
    const newPageNumber = direction === "ArrowRight" ? this.currentPageNumber + 1 : this.currentPageNumber - 1;

    this.changePage(newPageNumber, favorites);
  }

  /**
   * @param {Boolean} value
   */
  toggleContentVisibility(value) {
    this.content.style.display = value ? "" : "none";
  }

  /**
   * @param {Post} favorite
   */
  insertNewFavorite(favorite) {
    favorite.insertAtBeginningOfContent(this.content);
  }

  /**
   * @param {Number} id
   */
  findFavorite(id) {
    // const favorites = this.latestSearchResults;
    // const favoriteIds = favorites.map(favorite => favorite.id);
    // const index = favoriteIds.indexOf(id);

    // if (index === -1) {
    //   return;
    // }
    // const pageNumber = Math.floor(index / this.favoritesPerPage) + 1;

    // dispatchEvent(new CustomEvent("foundFavorite", {
    //   detail: id
    // }));
    // this.changePage(pageNumber, favorites);
    // setTimeout(() => {
    //   scrollToThumb(id, true, false);
    // }, 600);
  }
}
