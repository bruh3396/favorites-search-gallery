class PostPage {
  /** @type {DOMParser} */
  static parser = new DOMParser();
  /** @type {RegExp} */
  static statisticsRegex = /(\S+):\s+(\S+)/g;
  /** @type {RegExp} */
  static mainImageRegex = /^.*rule34.*\/images\/.*$/g;

  /**
   * @param {HTMLImageElement} image
   * @returns {Boolean}
   */
  static isMainImage(image) {
    return PostPage.mainImageRegex.test(image.src);
  }

  /**
   * @param {Document} dom
   * @returns {Record<String, String>}
   */
  static getStatistics(dom) {
    const stats = dom.querySelector("#stats");

    if (stats === null) {
      return {};
    }
    const textContent = Utils.removeExtraWhiteSpace(stats.textContent || "");
    const matches = Array.from(textContent.matchAll(PostPage.statisticsRegex));
    const entries = matches.map(match => [match[1].toLowerCase(), match[2]]);
    return Object.fromEntries(entries);
  }

  /**
   * @param {Document} dom
   * @returns {String}
   */
  static getFileURL(dom) {
    const image = dom.querySelector("#image");
    return image instanceof HTMLImageElement ? ImageUtils.cleanImageSource(image.src) : "";
  }

  /**
   * @param {Document} dom
   * @returns {String}
   */
  static getPostTags(dom) {
    return Utils.removeExtraWhiteSpace(Array.from(dom.querySelectorAll(".tag>a"))
      .filter(anchor => anchor instanceof HTMLAnchorElement && anchor.textContent !== "?")
      .map(anchor => (anchor.textContent || "").replaceAll(" ", "_"))
      .join(" ") || "");
  }

  /**
   * @param {Record<String, String>} statistics
   */
  static getRating(statistics) {
    if (statistics.rating === undefined || statistics.rating === "") {
      return "e";
    }
    return statistics.rating.charAt(0).toLowerCase();
  }

  /**
   * @param {Document} dom
   * @returns {Boolean}
   */
  static hasComments(dom) {
    return Array.from(dom.querySelectorAll("#comments>div")).length > 0;
  }

  /**
   * @param {String} id
   * @param {String} html
   * @returns {APIPost}
   */
  static convertPostPageToAPIPost(id, html) {
    const apiPost = new APIPost(id);
    const dom = PostPage.parser.parseFromString(html, "text/html");
    const statistics = PostPage.getStatistics(dom);
    const dimensions = Utils.getDimensions(statistics.size || "0x0");

    apiPost.height = dimensions.y;
    apiPost.score = parseInt(statistics.score) || 0;
    apiPost.fileURL = PostPage.getFileURL(dom);
    apiPost.rating = PostPage.getRating(statistics);
    apiPost.tags = PostPage.getPostTags(dom);
    apiPost.width = dimensions.x;
    apiPost.createdAt = statistics.posted || "0";
    apiPost.hasComments = PostPage.hasComments(dom);
    apiPost.extension = ImageUtils.getExtensionFromFileURL(apiPost.fileURL);
    apiPost.isEmpty = false;
    return apiPost;
  }

  /**
   * @param {String} id
   * @returns {Promise<String>}
   */
  static async fetch(id) {
    await FetchQueues.postPage.wait();
    const response = await fetch(Utils.getPostPageURL(id));
    return response.text();
  }

  /**
   * @param {String} id
   * @returns {Promise<APIPost>}
   */
  static async fetchAPIPost(id) {
    const html = await PostPage.fetch(id);
    return PostPage.convertPostPageToAPIPost(id, html);
  }
}
