class Extensions {
  static {
    Utils.addStaticInitializer(Extensions.load);
  }

  /** @type {String} */
  static databaseName = "Extensions";
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
}
