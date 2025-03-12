/**
 * @template T
 */
class Preference {
  static mainKey = "preferences";

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
    const preferences = JSON.parse(localStorage.getItem(Preference.mainKey) || "{}");
    const storedValue = preferences[this.key];

    if (storedValue === null || storedValue === undefined) {
      return this.defaultValue;
    }
    return storedValue;
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
    const preferences = JSON.parse(localStorage.getItem(Preference.mainKey) || "{}");

    preferences[this.key] = value;
    localStorage.setItem(Preference.mainKey, JSON.stringify(preferences));
  }
}
