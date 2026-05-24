const ids: Set<string> = new Set();

export function populate(loaded: string[]): void {
  loaded.forEach(id => ids.add(String(id)));
}

export const has = (id: string): boolean => ids.has(id);
export const add = (id: string): Set<string> => ids.add(id);
export const remove = (id: string): boolean => ids.delete(id);
