class FavoriteFinder {
  /** @type {HTMLElement} */
  parent;
  /** @type {HTMLElement} */
  container;
  /** @type {HTMLButtonElement} */
  findButton;
  /** @type {HTMLButtonElement} */
  findInAllButton;
  /** @type {HTMLInputElement} */
  input;

  /**
   * @param {String} parentSelector
   */
  constructor(parentSelector) {
    const parent = document.querySelector(parentSelector);

    if (!(parent instanceof HTMLElement)) {
      return;
    }
    this.parent = parent;
    this.createElements();
    this.attachEvents();
    this.appendElements();
  }

  createElements() {
    this.container = document.createElement("span");
    this.container.id = "find-favorite";

    this.findButton = document.createElement("button");
    this.findButton.id = "find-favorite-button";
    this.findButton.title = "Find favorite favorite using its ID";
    this.findButton.textContent = "Find";

    this.findInAllButton = document.createElement("button");
    this.findInAllButton.id = "find-favorite-in-all-button";
    this.findInAllButton.title = "Find favorite favorite using its ID in all Favorites";
    this.findInAllButton.textContent = "Find in All";

    this.input = document.createElement("input");
    this.input.id = "find-favorite-input";
    this.input.type = "number";
    this.input.value = Preferences.favoriteFinder.value;
    this.input.placeholder = "ID";
  }

  find() {
    Events.favorites.findFavoriteStarted.emit(this.input.value);
  }

  findInAll() {
    Events.favorites.findFavoriteInAllStarted.emit(this.input.value);
  }

  /**
   * @param {String} value
   */
  setValue(value) {
    this.input.value = value;
    Preferences.favoriteFinder.set(this.input.value);
  }

  attachEvents() {
    const setValue = Utils.debounceAfterFirstCall((/** @type {String} */ value) => {
      this.setValue(value);
    }, 1000);

    this.findButton.onclick = this.find.bind(this);
    this.findInAllButton.onclick = this.findInAll.bind(this);
    this.input.onkeydown = (event) => {
      if (event.key === "Enter") {
        this.find();
      }
    };
    this.input.oninput = setValue;
    Events.caption.idClicked.on(setValue);
  }

  appendElements() {
    this.container.appendChild(this.findButton);
    this.container.appendChild(this.findInAllButton);
    this.container.appendChild(document.createElement("br"));
    this.container.appendChild(this.input);
    this.parent.appendChild(this.container);
  }
}
