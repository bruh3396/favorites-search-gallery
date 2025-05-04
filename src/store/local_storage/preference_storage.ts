const STORAGE_KEY = "preferences";

function readAll(): Record<string, unknown> {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

export function get(key: string): unknown {
  return readAll()[key];
}

export function set(key: string, value: unknown): void {
  const preferences = readAll();

  preferences[key] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
