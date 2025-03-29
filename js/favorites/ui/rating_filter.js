class RatingFilter {
  /** @type {HTMLElement} */
  filterContainer;
  /** @type {RatingElement} */
  explicit;
  /** @type {RatingElement} */
  questionable;
  /** @type {RatingElement} */
  safe;

  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this.create(container);
  }

  /**
   * @param {HTMLElement} container
   */
  create(container) {
    this.createMainLabel(container);
    container.appendChild(document.createElement("br"));
    this.createFilter(container);
    this.changeRatingHTML(Preferences.allowedRatings.value);
    this.addEventListeners();
  }

  /**
   * @param {HTMLElement} container
   */
  createMainLabel(container) {
    const label = document.createElement("label");

    label.htmlFor = "allowed-ratings";
    label.textContent = "Rating";
    container.appendChild(label);
  }

  /**
   * @param {HTMLElement} container
   */
  createFilter(container) {
    this.createRatingFilterContainer(container);
  }

  /**
   * @param {HTMLElement} container
   */
  createRatingFilterContainer(container) {
    this.filterContainer = document.createElement("div");

    this.filterContainer.id = "allowed-ratings";
    this.filterContainer.className = "not-hightlightable";

    this.explicit = this.createSpecificRating("explicit");
    this.questionable = this.createSpecificRating("questionable");
    this.safe = this.createSpecificRating("safe");
    container.appendChild(this.filterContainer);
  }

  /**
   * @param {String} ratingName
   * @returns {RatingElement}
   */
  createSpecificRating(ratingName) {
    const input = document.createElement("input");
    const label = document.createElement("label");

    input.type = "checkbox";
    input.id = `${ratingName}-rating`;
    label.htmlFor = input.id;
    label.textContent = Utils.capitalize(ratingName);
    this.filterContainer.appendChild(input);
    this.filterContainer.appendChild(label);
    return {
      input,
      label
    };
  }

  addEventListeners() {
    this.filterContainer.onclick = (event) => {
      if (event.target === null || Utils.hasTagName(event.target, "label")) {
        return;
      }
      const rating = this.getCurrentRating();

      Events.favorites.allowedRatingsChanged.emit(rating);
      this.preventAllRatingsFromBeingUnchecked();
      Preferences.allowedRatings.set(rating);
    };
  }

  /**
   * @returns {Rating}
   */
  getCurrentRating() {
    const rating = (4 * Number(this.explicit.input.checked)) + (2 * Number(this.questionable.input.checked)) + Number(this.safe.input.checked);
    return Types.isRating(rating) ? rating : 7;
  }

  /**
   * @param {Rating} rating
   */
  changeRatingHTML(rating) {
    // eslint-disable-next-line no-bitwise
    this.explicit.input.checked = (rating & 4) === 4;
    // eslint-disable-next-line no-bitwise
    this.questionable.input.checked = (rating & 2) === 2;
    // eslint-disable-next-line no-bitwise
    this.safe.input.checked = (rating & 1) === 1;
    this.preventAllRatingsFromBeingUnchecked();
  }

  preventAllRatingsFromBeingUnchecked() {
    switch (this.getCurrentRating()) {
      case 4:
        this.explicit.label.style.pointerEvents = "none";
        break;

      case 2:
        this.questionable.label.style.pointerEvents = "none";
        break;

      case 1:
        this.safe.label.style.pointerEvents = "none";
        break;

      default:
        for (const element of [this.explicit, this.questionable, this.safe]) {
          element.label.removeAttribute("style");
        }
        break;
    }
  }
}
