import * as PreferenceStorage from "./preference_storage";

export class Preference<T> {
  public readonly defaultValue: T;
  private readonly key: string;

  constructor(key: string, defaultValue: T) {
    this.key = key;
    this.defaultValue = defaultValue;
  }

  public get value(): T {
    return PreferenceStorage.get(this.key) as T ?? this.defaultValue;
  }

  public set(value: T): void {
    PreferenceStorage.set(this.key, value);
  }
}
