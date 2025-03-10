/**
 * @template T
 */
class Preference {
  /**
   * @type {String}
   */
  key;

  /**
   * @type {T}
   */
  defaultValue;

  /**
   * @type {T}
   */
  get value() {
    const storedValue = localStorage.getItem(this.key);

    if (storedValue === null) {
      return this.defaultValue;
    }

    try {
      return JSON.parse(storedValue);
    } catch (e) {
      return this.defaultValue;
    }
  }

  /**
   * @param {String} key
   * @param {T} defaultValue
   */
  constructor(key, defaultValue) {
    this.key = key;
    this.defaultValue = defaultValue;
  }

  /**
   * @param {T} value
   */
  set(value) {
    localStorage.setItem(this.key, JSON.stringify(value));
  }
}
