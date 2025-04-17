class Aliases {
  /** @type {AliasMap} */
  static aliases = Aliases.load();

  /**
   * @param {String} tag
   * @returns {Set<String> | undefined}
   */
  static get(tag) {
    return Aliases.aliases[tag];
  }

  /**
   * @param {String} tag
   * @returns {Boolean}
   */
  static has(tag) {
    return Preferences.tagAliasing.value && Aliases.get(tag) !== undefined;
  }

  /**
   * @returns {AliasMap}
   */
  static load() {
    /** @type {Record<String, String[]>} */
    const aliasMap = JSON.parse(localStorage.getItem("aliasMap") || "{}");
    /** @type {AliasMap} */
    const result = {};

    for (const [tag, aliases] of Object.entries(aliasMap)) {
      result[tag] = new Set(aliases);
    }
    return result;
  }

}
