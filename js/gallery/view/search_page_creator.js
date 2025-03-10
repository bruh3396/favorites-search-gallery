class SearchPageCreator {
  /**
   * @type {HTMLElement | null}
   */
  thumbContainer;

  constructor() {
    if (!Flags.onSearchPage) {
      return;
    }
    this.thumbContainer = this.getMainThumbnailContainer();
  }

  /**
   * @returns {HTMLElement | null}
   */
  getMainThumbnailContainer() {
    const thumb = document.querySelector(".thumb");

    if (thumb !== null) {
      return thumb.parentElement;
    }
    return document.querySelector(".image-list");
  }

  /**
   * @param {SearchPage} searchPage
   */
  createSearchPage(searchPage) {
    this.insertNewThumbs(searchPage);
    this.updatePaginator(searchPage);
    this.updateAddressBar(searchPage);
  }

  /**
   * @param {SearchPage} searchPage
   */
  insertNewThumbs(searchPage) {
    if (this.thumbContainer === null) {
      return;
    }
    this.thumbContainer.innerHTML = "";

    for (const thumb of searchPage.thumbs) {
      this.thumbContainer.appendChild(thumb);
    }
  }

  /**
   * @param {SearchPage} searchPage
   */
  updatePaginator(searchPage) {
    if (searchPage.paginator === null) {
      return;
    }
    const currentPaginator = document.getElementById("paginator");
    const placeToInsert = currentPaginator || this.thumbContainer;

    if (placeToInsert === null) {
      return;
    }
    placeToInsert.insertAdjacentElement("afterend", searchPage.paginator);

    if (currentPaginator !== null) {
      currentPaginator.remove();
    }
  }

  /**
   * @param {SearchPage} searchPage
   */
  updateAddressBar(searchPage) {
    const baseURL = location.origin + location.pathname;
    const searchFragment = `${location.search.replace(/&pid=\d+/g, "")}&pid=${searchPage.pageNumber * 42}`;

    window.history.replaceState(null, "", baseURL + searchFragment);
  }
}
