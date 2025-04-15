/**
 * @template T
 */
class Preference {
  static localStorageKey = "preferences";

  /** @type {String} */
  key;

  /** @type {T} */
  defaultValue;

  /** @type {T} */
  get value() {
    const preferences = JSON.parse(localStorage.getItem(Preference.localStorageKey) || "{}");
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
    const preferences = JSON.parse(localStorage.getItem(Preference.localStorageKey) || "{}");

    preferences[this.key] = value;
    localStorage.setItem(Preference.localStorageKey, JSON.stringify(preferences));
  }
}
