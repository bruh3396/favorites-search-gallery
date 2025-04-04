class APIPost {
  /** @type {DOMParser} */
  static parser = new DOMParser();

  /**
   * @param {String} attribute
   * @param {Element} post
   * @returns {Number}
   */
  static getNumber(attribute, post) {
    return Number(post.getAttribute(attribute) || 0);
  }

  /**
   * @param {String} attribute
   * @param {Element} post
   * @returns {String}
   */
  static getString(attribute, post) {
    return String(post.getAttribute(attribute) || "");
  }

  /**
   * @param {String} attribute
   * @param {Element} post
   * @returns {Boolean}
   */
  static getBoolean(attribute, post) {
    const value = post.getAttribute(attribute);

    if (value === null) {
      return false;
    }
    return value !== "false";
  }

  /**
   * @param {String} id
   * @param {AbortController | undefined} abortController
   * @returns {Promise<APIPost>}
   */
  static async fetch(id, abortController = undefined) {
    const apiPost = new APIPost(id);
    const response = await fetch(apiPost.url, {
      signal: abortController === undefined ? null : abortController.signal
    });
    const html = await response.text();
    const dom = APIPost.parser.parseFromString(html, "text/html");

    apiPost.populate(dom.querySelector("post"));
    return apiPost;
  }

  /**
   * @param {String} id
   * @returns {Promise<APIPost>}
   */
  static fetchWithTimeout(id) {
    const abortController = new AbortController();
    const apiPromise = APIPost.fetch(id, abortController);
    return Utils.withTimeout(apiPromise, Settings.apiTimeout)
      .catch(() => {
        abortController.abort();
        return PostPage.fetchAPIPost(id);
      });
  }

  /** @type {String} */
  id;
  /** @type {Boolean} */
  isEmpty;

  height = 0;
  score = 0;
  fileURL = "";
  parentId = "";
  sampleURL = "";
  sampleWidth = 0;
  sampleHeight = 0;
  previewURL = "";
  rating = "e";
  tags = "";
  width = 0;
  change = 0;
  md5 = "";
  creatorId = "";
  hasChildren = "";
  createdAt = "";
  status = "";
  source = "";
  hasNotes = false;
  hasComments = false;
  previewWidth = 0;
  previewHeight = 0;

  /** @type {MediaExtension} */
  extension = "jpg";

  /** @type {String} */
  get url() {
    return `https://api.rule34.xxx//index.php?page=dapi&s=post&q=index&id=${this.id}`;
  }

  /**
   * @param {String} id
   * @param {HTMLElement | null} post
   */
  constructor(id, post = null) {
    this.id = id;
    this.isEmpty = true;
    this.populate(post);
  }

  /**
   * @param {HTMLElement | null} post
   */
  populate(post) {
    if (post === null) {
      return;
    }

    this.height = APIPost.getNumber("height", post);
    this.score = APIPost.getNumber("score", post);
    this.fileURL = APIPost.getString("file_url", post);
    this.parentId = APIPost.getString("parent_id", post);
    this.sampleURL = APIPost.getString("sample_url", post);
    this.sampleWidth = APIPost.getNumber("sample_width", post);
    this.sampleHeight = APIPost.getNumber("sample_height", post);
    this.previewURL = APIPost.getString("preview_url", post);
    this.rating = APIPost.getString("rating", post);
    this.tags = APIPost.getString("tags", post);
    this.width = APIPost.getNumber("width", post);
    this.change = APIPost.getNumber("change", post);
    this.md5 = APIPost.getString("md5", post);
    this.creatorId = APIPost.getString("creator_id", post);
    this.hasChildren = APIPost.getString("has_children", post);
    this.createdAt = APIPost.getString("created_at", post);
    this.status = APIPost.getString("status", post);
    this.source = APIPost.getString("source", post);
    this.hasNotes = APIPost.getBoolean("has_notes", post);
    this.hasComments = APIPost.getBoolean("has_comments", post);
    this.previewWidth = APIPost.getNumber("preview_width", post);
    this.previewHeight = APIPost.getNumber("preview_height", post);
    this.extension = ImageUtils.getExtensionFromFileURL(this.fileURL);
    this.isEmpty = false;
  }
}
