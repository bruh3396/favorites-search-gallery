class Types {
  /** @typedef {"row" | "square" | "grid" | "column"} FavoriteLayout */

  /** @typedef {0 | 1 | 2} FavoritesGalleryState */

  /** @typedef {"a" | "A" | "ArrowLeft"} BackwardNavigationKey */

  /** @typedef {"d" | "D" | "ArrowRight"} ForwardNavigationKey */

  /** @typedef {BackwardNavigationKey | ForwardNavigationKey} NavigationKey */

  /** @typedef {"Escape" | "Delete" | "Backspace"} ExitKey */

  /** @typedef {any} TypeableInput */

  /** @typedef {"jpg" | "png" | "jpeg" | "gif" | "mp4"} MediaExtension */

  /** @typedef {"gif" | "mp4"} AnimatedExtension */

  /** @typedef {{id: String, extension: MediaExtension}} MediaExtensionMapping */

  /** @typedef {"default" | "id" | "score" | "width" | "height" | "creationTimestamp" | "lastChangedTimestamp" | "random"} MetadataMetric */

  /** @typedef {"id" | "score" | "width" | "height" } SearchableMetadataMetric */

  /** @typedef {":" | ":<" | ":>"} MetadataComparator */

  /** @typedef {{width: Number, height: Number, score: Number, rating: Number, create: Number, change: Number, deleted: Boolean}} FavoritesDatabaseMetadataRecord */

  /** @typedef {{id: String, tags: String, src: String, metadata: String}} FavoritesDatabaseRecord */

  /** @typedef {{id: String, tags: String}} TagModificationDatabaseRecord */

  /** @typedef {{action: String}} WorkerMessage */

  /** @typedef {(UpscaleRequest | {requests: UpscaleRequest[]} | {width: Number, maxHeight: Number}) & WorkerMessage} UpscaleMessage */

  /** @typedef {Record<String, Set<String>>} AliasMap */

  /** @typedef {{min: Number, max: Number}}  NumberRange */

  /** @typedef {"general" | "artist" | "unknown" | "copyright" | "character" | "metadata"} TagCategory */

  /** @typedef {{id: String, category: TagCategory}} TagCategoryMapping */

  /** @typedef {0 | 1 | 2} PerformanceProfile  */

  /** @typedef {1 | 2 | 3 | 4 | 5 | 6 | 7} Rating  */

  /** @typedef {{input: HTMLInputElement, label: HTMLLabelElement}} RatingElement */

  /**
   * @template T
   *  @typedef {{
   *    id: String,
   *    parentId: String,
   *    position?: InsertPosition,
   *    textContent?: String,
   *    title?: String,
   *    action?: String,
   *    hotkey?: String,
   *    invokeActionOnCreation?: Boolean,
   *    savePreference?: Boolean,
   *    enabled?: Boolean,
   *    optionPairs?: Record<T & (String|Number), String>,
   *    min?: Number,
   *    max?: Number,
   *    step?: Number,
   *    pollingTime?: Number,
   *    preference?: Preference<T> | null,
   *    defaultValue?: T | null,
   *    eventEmitter?: EventEmitter<T> | null,
   *    useContainer?: Boolean,
   *  }} ElementTemplateParams<T>
   */
  static favoriteLayouts = new Set(["row", "square", "grid", "column"]);
  static forwardNavigationKeys = new Set(["d", "D", "ArrowRight"]);
  static backwardNavigationKeys = new Set(["a", "A", "ArrowLeft"]);
  static navigationKeys = Types.forwardNavigationKeys.union(Types.backwardNavigationKeys);
  static exitKeys = new Set(["Escape", "Delete", "Backspace"]);
  static typeableInputs = new Set(["color", "email", "number", "password", "search", "tel", "text", "url", "datetime"]);
  static mediaExtensions = new Set(["jpg", "png", "jpeg", "gif", "mp4"]);
  static animatedExtensions = new Set(["gif", "mp4"]);
  static metadataMetrics = new Set(["default", "id", "score", "width", "height", "creationTimestamp", "lastChangedTimestamp", "random"]);
  static searchableMetadataMetrics = new Set(["default", "id", "score", "width", "height", "creationTimestamp", "lastChangedTimestamp", "random"]);
  static metadataComparators = new Set([":", ":<", ":>"]);
  static tagCategories = new Set(["general", "artist", "unknown", "copyright", "character", "metadata"]);

  /**
   * @param {any} object
   * @returns {object is FavoriteLayout}
   */
  static isFavoritesLayout(object) {
    return Types.favoriteLayouts.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is ForwardNavigationKey}
   */
  static isForwardNavigationKey(object) {
    return Types.forwardNavigationKeys.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is BackwardNavigationKey}
   */
  static isBackwardNavigationKey(object) {
    return Types.backwardNavigationKeys.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is NavigationKey}
   */
  static isNavigationKey(object) {
    return Types.navigationKeys.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is ExitKey}
   */
  static isExitKey(object) {
    return Types.exitKeys.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is TypeableInput}
   */
  static isTypeableInput(object) {
    if (!(object instanceof HTMLElement)) {
      return false;
    }
    const tagName = object.tagName.toLowerCase();

    if (tagName === "textarea") {
      return true;
    }
    return tagName === "input" && Types.typeableInputs.has(object.getAttribute("type") || "");
  }

  /**
   * @param {any} object
   * @returns {object is MediaExtension}
   */
  static isMediaExtension(object) {
    return Types.mediaExtensions.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is MediaExtension}
   */
  static isAnimatedExtension(object) {
    return Types.animatedExtensions.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is MetadataMetric}
   */
  static isMetadataMetric(object) {
    return Types.metadataMetrics.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is SearchableMetadataMetric}
   */
  static isSearchableMetadataMetric(object) {
    return Types.searchableMetadataMetrics.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is MetadataComparator}
   */
  static isMetadataComparator(object) {
    return Types.metadataComparators.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is TagCategory}
   */
  static isTagCategory(object) {
    return this.tagCategories.has(object);
  }

  /**
   * @param {any} object
   * @returns {object is Rating}
   */
  static isRating(object) {
    return Number.isInteger(object) && object >= 1 && object <= 7;
  }
}
