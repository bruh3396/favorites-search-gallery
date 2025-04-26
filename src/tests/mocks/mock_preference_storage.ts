import {PreferenceStorage} from "../../store/preferences/preference_storage";

export class MockPreferenceStorage implements PreferenceStorage {
  private readonly map = new Map<string, unknown>();

  public get(key: string): unknown {
    return this.map.get(key);
  }

  public set(key: string, value: unknown): void {
    this.map.set(key, value);
  }
}
