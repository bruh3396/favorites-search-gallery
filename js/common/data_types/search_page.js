class SearchPage {
  /** @type {DOMParser} */
  static parser = new DOMParser();

  /**
   * @param {HTMLElement[]} thumbs
   */
  static prepareThumbs(thumbs) {
    for (const thumb of thumbs) {
      SearchPage.prepareThumb(thumb);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  static prepareThumb(thumb) {
    Utils.prepareSearchPageThumb(thumb);
    SearchPage.findImageExtension(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
  static findImageExtension(thumb) {
    APIPost.fetchWithTimeout(thumb.id)
      .then((apiPost) => {
        Extensions.set(thumb.id, apiPost.extension);
        SearchPage.correctMediaTags(thumb, apiPost);
      })
      .catch((error) => {
        if (error instanceof PromiseTimeoutError) {
          return;
        }
        throw error;
      });
  }

  /**
   * @param {HTMLElement} thumb
   * @param {APIPost} apiPost
   */
  static correctMediaTags(thumb, apiPost) {
    if (!Flags.onSearchPage) {
      return;
    }
    const tagSet = Utils.convertToTagSet(apiPost.tags);
    const isVideo = apiPost.fileURL.endsWith("mp4");
    const isGif = apiPost.fileURL.endsWith("gif");
    const isImage = !isVideo && !isGif;
    const documentThumb = document.getElementById(thumb.id);

    if (isImage) {
      SearchPage.removeAnimatedTags(tagSet);
      SearchPage.removeAnimatedAttributes(thumb);
      SearchPage.removeAnimatedAttributes(documentThumb);
    } else if (isVideo) {
      tagSet.add("video");
    } else if (isGif) {
      tagSet.add("gif");
    }
    Utils.setThumbTagsOnSearchPage(thumb, Utils.convertToTagString(tagSet));
    Utils.setThumbTagsOnSearchPage(documentThumb, Utils.convertToTagString(tagSet));
  }

  /**
   * @param {Set<String>} tagSet
   */
  static removeAnimatedTags(tagSet) {
    tagSet.delete("animated");
    tagSet.delete("video");
    tagSet.delete("mp4");
    tagSet.delete("gif");
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  static removeAnimatedAttributes(thumb) {
    if (thumb === null) {
      return;
    }
    thumb.classList.remove("video");
    thumb.classList.remove("gif");

    const image = Utils.getImageFromThumb(thumb);

    if (image === null) {
      return;
    }
    image.classList.remove("video");
    image.classList.remove("gif");
  }

  /** @type {String} */
  html;
  /** @type {HTMLElement[]} */
  thumbs;
  /** @type {HTMLElement | null} */
  paginator;
  /** @type {Set<String>} */
  ids;
  /** @type {Number} */
  pageNumber;

  /** @type {Boolean} */
  get isEmpty() {
    return this.thumbs.length === 0;
  }

  /** @type {Boolean} */
  get isLastPage() {
    return this.thumbs.length < 42;
  }

  /** @type {Boolean} */
  get isFirstPage() {
    return this.pageNumber === 0;
  }

  /**
   * @param {Number} pageNumber
   * @param {String} html
   */
  constructor(pageNumber, html) {
    const dom = SearchPage.parser.parseFromString(html, "text/html");

    this.html = html;
    this.thumbs = Array.from(dom.querySelectorAll(".thumb"));
    this.pageNumber = pageNumber;
    this.paginator = dom.getElementById("paginator");
    this.ids = new Set(this.thumbs.map(thumb => thumb.id));
    SearchPage.prepareThumbs(this.thumbs);
  }
}
