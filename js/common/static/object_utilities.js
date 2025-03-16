class SetUtils {
  /**
   * @template T
   * @param {Set<T>} a
   * @param {Set<T>} b
   * @returns {Set<T>}
   */
  static union(a, b) {
    const c = new Set(a);

    for (const v of b.values()) {
      c.add(v);
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

    for (const v of b.values()) {
      c.delete(v);
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

    for (const v of a.values()) {
      if (b.has(v)) {
        c.add(v);
      }
    }
    return c;
  }

  /**
   * @template T
   * @param {Set<T>} a
   * @param {Set<T>} b
   * @returns {Boolean}
   */
  static hasIntersection(a, b) {
    for (const v of a.values()) {
      if (b.has(v)) {
        return true;
      }
    }
    return false;
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
