import { Snippet, SnippetIntents, SnippetScene } from "@/features/favorites/features/snippets/types/types";

export interface RecordedIntents {
  intents: SnippetIntents;
  calls: string[];
}

export function createSnippet(name: string, query: string, lastUsedAt: number = 0, createdAt: number = 0): Snippet {
  return { name, query, lastUsedAt, createdAt };
}

export function createScene(overrides: Partial<SnippetScene> = {}): SnippetScene {
  return { rows: [], placeholder: "No snippets yet", editTarget: null, deleteTarget: null, failure: null, ...overrides };
}

export function createIntents(editing: boolean = false): RecordedIntents {
  const calls: string[] = [];
  const record = (name: string): ((...args: string[]) => void) => (...args: string[]): void => {
    calls.push([name, ...args].join(":"));
  };
  const intents: SnippetIntents = {
    use: record("use"),
    moveToTop: record("moveToTop"),
    edit: record("edit"),
    requestDelete: record("requestDelete"),
    cancelDelete: record("cancelDelete"),
    delete: record("delete"),
    save: record("save"),
    fillQueryFromResults: record("fillQueryFromResults"),
    cancelEdit: (): boolean => {
      calls.push("cancelEdit");
      return editing;
    },
    clearFailure: record("clearFailure"),
    filter: record("filter"),
    importFromFile: record("importFromFile"),
    exportToFile: record("exportToFile"),
    deleteAll: record("deleteAll")
  };
  return { intents, calls };
}
