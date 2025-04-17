class Extensions {
  static {
    Utils.addStaticInitializer(Extensions.convertFromLocalStorageToIndexedDB);
    Utils.addStaticInitializer(Extensions.load);
    Utils.addStaticInitializer(Extensions.addEventListeners);
  }

  /** @type {String} */
  static databaseName = "ImageExtensions";
  /** @type {String} */
  static objectStoreName = "extensionMappings";
  /** @type {Map<String, MediaExtension>} */
  static map = new Map();
  /** @type {Database<MediaExtensionMapping>} */
  static database = new Database(Extensions.databaseName);
  /** @type {BatchExecutor<MediaExtensionMapping>} */
  static scheduler = new BatchExecutor(100, 2000, Extensions.store);

  /**
   * @param {String} id
   * @returns {Boolean}
   */
  static has(id) {
    return Extensions.map.has(id);
  }

  /**
   * @param {String} id
   * @param {MediaExtension} extension
   */
  static set(id, extension) {
    if (Extensions.has(id) || Types.isAnimatedExtension(extension)) {
      return;
    }
    Extensions.map.set(id, extension);

    if (Flags.onFavoritesPage) {
      Extensions.scheduler.add({
        id,
        extension
      });
    }
  }

  /**
   * @param {APIPost} apiPost
   */
  static setFromAPIPost(apiPost) {
    if (!apiPost.isEmpty) {
      Extensions.set(apiPost.id, apiPost.extension);
    }
  }

  /**
   * @param {String} id
   * @returns {MediaExtension | undefined}
   */
  static get(id) {
    return Extensions.map.get(id);
  }

  /**
   * @param {MediaExtensionMapping[]} mappings
   */
  static store(mappings) {
    Extensions.database.update(mappings, Extensions.objectStoreName);
  }

  static async load() {
    const mappings = await Extensions.database.load(Extensions.objectStoreName);

    for (const mapping of mappings) {
      Extensions.map.set(mapping.id, mapping.extension);
    }
  }

  static convertFromLocalStorageToIndexedDB() {
    const extensionMappingsString = localStorage.getItem("imageExtensions");

    if (extensionMappingsString === null) {
      return;
    }
    /** @type {Record<String, 0 | 1 | 2 | 3 | 4>} */
    const extensionMappings = JSON.parse(extensionMappingsString);
    const extensionDecodings = {
      0: "jpg",
      1: "png",
      2: "jpeg",
      3: "gif",
      4: "mp4"
    };

    for (const [id, extensionEncoding] of Object.entries(extensionMappings)) {
      const extension = extensionDecodings[extensionEncoding];

      if (Types.isMediaExtension(extension)) {
        Extensions.set(id, extension);
      }
    }
    localStorage.removeItem("imageExtensions");
  }

  static addEventListeners() {
    Events.favorites.reset.on(() => {
      Extensions.database.delete();
    });
  }
}
