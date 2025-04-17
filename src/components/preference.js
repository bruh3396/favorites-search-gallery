export default class Preference<T> {
  private static localStorageKey = "preferences";

  private readonly key: string;
  public readonly defaultValue: T;

  get value(): T {
    const preferences = JSON.parse(localStorage.getItem(Preference.localStorageKey) || "{}");
    const storedValue = preferences[this.key];

    if (storedValue === null || storedValue === undefined) {
      return this.defaultValue;
    }
    return storedValue;
  }

  constructor(key: string, defaultValue: T) {
    this.key = key;
    this.defaultValue = defaultValue;
  }

  public set(value: T): void {
    const preferences = JSON.parse(localStorage.getItem(Preference.localStorageKey) || "{}");

    preferences[this.key] = value;
    localStorage.setItem(Preference.localStorageKey, JSON.stringify(preferences));
  }
}
