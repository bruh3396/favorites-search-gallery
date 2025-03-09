class SetUtils {
  /**
   * @template T
   * @param {Set<T>} a
   * @param {Set<T>} b
   * @returns {Set<T>}
   */
  static union(a, b) {
    const c = new Set(a);

    for (const element of b.values()) {
      c.add(element);
    }
    return c;
  }

  /**
   * @template T
   * @param {Set<T>} a
   * @param {Set<T>} b
   * @returns {Set<T>}
   */
  static difference(a, b) {
    const c = new Set(a);

    for (const element of b.values()) {
      c.delete(element);
    }
    return c;
  }

  /**
   * @template T
   * @param {Set<T>} a
   * @param {Set<T>} b
   * @returns {Set<T>}
   */
  static symmetricDifference(a, b) {
    return SetUtils.union(SetUtils.difference(a, b), SetUtils.difference(b, a));
  }

  /**
   * @template T
   * @param {Set<T>} a
   * @param {Set<T>} b
   * @returns {Set<T>}
   */
  static intersection(a, b) {
    const c = new Set();

    for (const element of a.values()) {
      if (b.has(element)) {
        c.add(element);
      }
    }
    return c;
  }

  /**
   * @template T
   * @param {Set<T>} a
   * @returns {Set<T>}
   */
  static sort(a) {
    return new Set(Array.from(a).sort());
  }
}
