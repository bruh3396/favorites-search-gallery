class SearchPageCreator {
  /**
   * @type {HTMLElement | null}
   */
  imageContainer;

  constructor() {
    if (!Utils.onSearchPage()) {
      return;
    }
    this.imageContainer = this.getImageContainer();
  }

  /**
   * @returns {HTMLElement | null}
   */
  getImageContainer() {
    const thumb = document.querySelector(".thumb");

    if (thumb !== null) {
      return thumb.parentElement;
    }
    return document.querySelector(".image-list");
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  createSearchPage(thumbs) {
    if (this.imageContainer === null) {
      return;
    }
    this.imageContainer.innerHTML = "";

    for (const thumb of thumbs) {
      this.imageContainer.appendChild(thumb);
    }
  }
}
