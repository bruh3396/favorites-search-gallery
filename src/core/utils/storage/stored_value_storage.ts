export interface StoredValueStorage {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
}
