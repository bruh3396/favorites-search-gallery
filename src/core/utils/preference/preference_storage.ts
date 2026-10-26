export interface PreferenceStorage {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
}
