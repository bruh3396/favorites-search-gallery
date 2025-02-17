class CompactPost {
  /**
   * @type {Set.<String>}
   */
  static animatedTagsSet = new Set(["animated", "video", "gif", "animated_png"]);

  /**
   * @param {HTMLElement} post
   * @returns {String}
   */
  static getAnimatedTags(post) {
    const originalTagSet = Utils.convertToTagSet(post.getAttribute("tags").trim());
    return Utils.convertToTagString(Utils.intersection(originalTagSet, CompactPost.animatedTagsSet));
  }

  /**
   * @param {HTMLElement} post
   * @returns {Number}
   */
  static getPixelCount(post) {
    const width = parseInt(post.getAttribute("width")) || 0;
    const height = parseInt(post.getAttribute("height")) || 0;
    return width * height;
  }

  /**
   * @type {String}
   */
  id;
  /**
   * @type {String}
   */
  thumbURL;
  /**
   * @type {String}
   */
  extension;
  /**
   * @type {String}
   */
  tags;
  /**
   * @type {Number}
   */
  pixelCount;

  /**
   * @type {HTMLElement}
   */
  get htmlElement() {
    const thumb = document.createElement("span");
    const anchor = document.createElement("a");
    const image = document.createElement("img");

    thumb.appendChild(anchor);
    anchor.appendChild(image);

    thumb.id = this.id;
    thumb.className = "thumb";

    anchor.id = `p${this.id}`;
    anchor.href = Utils.getPostPageURL(this.id);

    image.src = this.thumbURL;
    image.setAttribute("tags", this.tags);
    return thumb;
  }

  /**
   * @param {HTMLElement} post
   */
  constructor(post) {
    this.id = post.getAttribute("id") || "NA";
    this.thumbURL = post.getAttribute("preview_url").replace("api-cdn.", "");
    this.extension = Utils.getExtensionFromImageURL(post.getAttribute("file_url"));
    this.tags = CompactPost.getAnimatedTags(post);
    this.pixelCount = CompactPost.getPixelCount(post);
    Utils.assignImageExtension(this.id, this.extension);
  }
}
