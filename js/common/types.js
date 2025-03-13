class Types {
  /** @typedef {"row" | "square" | "grid" | "column"} FavoriteLayout */

  /** @typedef {0 | 1 | 2} FavoritesGalleryState */

  /** @typedef {"a" | "A" | "ArrowLeft"} BackwardNavigationKey */

  /** @typedef {"d" | "D" | "ArrowRight"} ForwardNavigationKey */

  /** @typedef {BackwardNavigationKey | ForwardNavigationKey} NavigationKey */

  /** @typedef {"Escape" | "Delete" | "Backspace"} ExitKey */

  /** @typedef {any} TypeableInput */

  /** @typedef {"jpg" | "png" | "jpeg" | "gif" | "mp4"} MediaExtension */

  /** @typedef {"default" | "id" | "score" | "width" | "height" | "creationTimestamp" | "lastChangedTimestamp" | "random"} MetadataMetric */

  /** @typedef {"id" | "score" | "width" | "height" } SearchableMetadataMetric */

  /** @typedef {":" | ":<" | ":>"} MetadataComparator */

  /** @typedef {{width: Number, height: Number, score: Number, rating: Number, create: Number, change: Number, deleted: Boolean}} FavoritesDatabaseMetadataRecord */

  /** @typedef {{id: String, tags: String, src: String, metadata: String}} FavoritesDatabaseRecord */

  static favoriteLayouts = new Set(["row", "square", "grid", "column"]);
  static forwardNavigationKeys = new Set(["d", "D", "ArrowRight"]);
  static backwardNavigationKeys = new Set(["a", "A", "ArrowLeft"]);
  static navigationKeys = SetUtils.union(Types.forwardNavigationKeys, Types.backwardNavigationKeys);
  static exitKeys = new Set(["Escape", "Delete", "Backspace"]);
  static typeableInputs = new Set(["color", "email", "number", "password", "search", "tel", "text", "url", "datetime"]);
  static mediaExtensions = new Set(["jpg", "png", "jpeg", "gif", "mp4"]);
  static metadataMetrics = new Set(["default", "id", "score", "width", "height", "creationTimestamp", "lastChangedTimestamp", "random"]);
  static searchableMetadataMetrics = new Set(["default", "id", "score", "width", "height", "creationTimestamp", "lastChangedTimestamp", "random"]);
  static metadataComparators = new Set([":", ":<", ":>"]);
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
}
