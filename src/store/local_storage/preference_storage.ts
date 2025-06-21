const STORAGE_KEY = "preferences";

function readAll<V>(): Record<string, V> {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

export function get<V>(key: string): V {
  return readAll<V>()[key];
}

export function set<V>(key: string, value: V): void {
  const preferences = readAll<V>();

  preferences[key] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
