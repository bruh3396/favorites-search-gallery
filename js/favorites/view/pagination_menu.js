class FavoritesPaginationMenu {
  /** @type {HTMLElement} */
  container;
  /** @type {HTMLLabelElement} */
  rangeIndicator;

  constructor() {
    this.container = this.createContainer();
    this.rangeIndicator = this.createRangeIndicator();
    this.insert();
    this.create(FavoritesPaginationParameters.emptyFavoritesPaginationParameters);
    this.toggle(!Preferences.infiniteScroll.value);
  }

  createRangeIndicator() {
    const rangeIndicator = document.createElement("label");
    const parent = document.getElementById("match-count-label");

    if (parent !== null) {
      parent.insertAdjacentElement("afterend", rangeIndicator);
    }
    rangeIndicator.id = "pagination-range-label";
    return rangeIndicator;
  }

  /**
   * @returns {HTMLSpanElement}
   */
  createContainer() {
    const menu = document.createElement("span");

    menu.id = "favorites-pagination-container";
    return menu;
  }

  insert() {
    const placeToInsertMenu = document.getElementById("favorites-pagination-placeholder");

    if (placeToInsertMenu !== null) {
      placeToInsertMenu.insertAdjacentElement("afterend", this.container);
      placeToInsertMenu.remove();
    }
  }

  /**
   * @param {FavoritesPaginationParameters} parameters
   */
  create(parameters) {
    this.container.innerHTML = "";
    this.updateRangeIndicator(parameters.startIndex, parameters.endIndex);
    this.createNumberTraversalButtons(parameters.currentPageNumber, parameters.finalPageNumber);
    this.createArrowTraversalButtons(parameters);
    this.createGotoSpecificPageInputs(parameters.finalPageNumber);
  }

  /**
   * @param {FavoritesPaginationParameters} parameters
   */
  update(parameters) {
    const nextPageButton = document.getElementById("next-page");
    const atMaxPageNumberButtons = document.getElementsByClassName("pagination-number").length >= Settings.maxPageNumberButtonCount &&
      nextPageButton !== null && nextPageButton instanceof HTMLButtonElement && !nextPageButton.disabled;

    if (atMaxPageNumberButtons) {
      return;
    }
    this.create(parameters);
  }

  /**
   * @param {Number} start
   * @param {Number} end
   */
  updateRangeIndicator(start, end) {
    if (end !== 0) {
      this.rangeIndicator.textContent = `${start + 1} - ${end}`;
    }
  }

  /**
   * @param {Number} currentPageNumber
   * @param {Number} finalPageNumber
   */
  createNumberTraversalButtons(currentPageNumber, finalPageNumber) {
    let numberOfButtonsCreated = 0;

    for (let i = currentPageNumber; i <= finalPageNumber && numberOfButtonsCreated < Settings.maxPageNumberButtonCount; i += 1) {
      numberOfButtonsCreated += 1;
      this.createNumberTraversalButton(currentPageNumber, i, "beforeend");
    }

    if (numberOfButtonsCreated >= Settings.maxPageNumberButtonCount) {
      return;
    }

    for (let j = currentPageNumber - 1; j >= 1 && numberOfButtonsCreated < Settings.maxPageNumberButtonCount; j -= 1) {
      numberOfButtonsCreated += 1;
      this.createNumberTraversalButton(currentPageNumber, j, "afterbegin");
    }
  }

  /**
   * @param {Number} currentPageNumber
   * @param {Number} pageNumber
   * @param {InsertPosition} position
   */
  createNumberTraversalButton(currentPageNumber, pageNumber, position) {
    const button = document.createElement("button");
    const selected = currentPageNumber === pageNumber;

    button.id = `favorites-page-${pageNumber}`;
    button.title = `Goto page ${pageNumber}`;
    button.className = "pagination-number";
    button.classList.toggle("selected", selected);
    button.dataset.action = "gotoPage";
    button.onclick = () => {
      button.dispatchEvent(new CustomEvent("controller", {
        detail: pageNumber,
        bubbles: true
      }));
    };
    this.container.insertAdjacentElement(position, button);
    button.textContent = String(pageNumber);
  }

  /**
   * @param {FavoritesPaginationParameters} parameters
   */
  createArrowTraversalButtons(parameters) {
    const previous = this.createArrowTraversalButton("previous", "<", "afterbegin");
    const first = this.createArrowTraversalButton("first", "<<", "afterbegin");
    const next = this.createArrowTraversalButton("next", ">", "beforeend");
    const final = this.createArrowTraversalButton("final", ">>", "beforeend");

    this.updateArrowTraversalButtonInteractability(previous, first, next, final, parameters.finalPageNumber);
  }

  /**
   * @param {String} name
   * @param {String} textContent
   * @param {InsertPosition} position
   * @returns {HTMLButtonElement}
   */
  createArrowTraversalButton(name, textContent, position) {
    const button = document.createElement("button");

    button.id = `${name}-page`;
    button.title = `Goto ${name} page`;
    button.textContent = textContent;
    button.dataset.action = "gotoRelativePage";
    button.onclick = () => {
      button.dispatchEvent(new CustomEvent("controller", {
        detail: name,
        bubbles: true
      }));
    };
    this.container.insertAdjacentElement(position, button);
    return button;
  }

  /**
   * @param {Number} finalPageNumber
   */
  createGotoSpecificPageInputs(finalPageNumber) {
    if (this.pageNumberTraversalButtonExists(1) && this.pageNumberTraversalButtonExists(finalPageNumber)) {
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
    this.container.appendChild(container);
  }

  /**
   * @param {Number} finalPageNumber
   * @returns {Boolean}
   */
  pageNumberTraversalButtonExists(finalPageNumber) {
    return document.getElementById(`favorites-page-${finalPageNumber}`) !== null;
  }

  /**
   * @param {HTMLButtonElement} previousPage
   * @param {HTMLButtonElement} firstPage
   * @param {HTMLButtonElement} nextPage
   * @param {HTMLButtonElement} finalPage
   * @param {Number} finalPageNumber
   */
  updateArrowTraversalButtonInteractability(previousPage, firstPage, nextPage, finalPage, finalPageNumber) {
    const firstNumberExists = this.pageNumberTraversalButtonExists(1);
    const lastNumberExists = this.pageNumberTraversalButtonExists(finalPageNumber);

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
   * @param {Boolean} value
   */
  toggle(value) {
    const html = `
      #favorites-pagination-container,
      #results-per-page-container,
      #find-favorite,
      #pagination-range-label
      {
        display: none !important;
      }
    `;

    Utils.insertStyleHTML(value ? "" : html, "pagination-menu-enable");
  }
}
