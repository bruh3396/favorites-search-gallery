import { SerializedSnippet, Snippet, SnippetResult } from "@/features/favorites/features/snippets/types";
import { isEmptyString, removeExtraWhiteSpace } from "@/utils/pure/string";
import { Store } from "@/lib/storage/local_storage";
import { isRecord } from "@/utils/pure/collection";
import { normalizeName } from "@/features/favorites/features/snippets/utils";

const STORAGE_KEY = "searchSnippets";
const LEGACY_STORAGE_KEY = "savedSearches";
const GENERATED_NAME_PREFIX = "snippet_";

export class SnippetStore {
  private readonly storage: Store;
  private readonly snippets: Map<string, Snippet>;

  constructor(storage: Store) {
    this.storage = storage;
    this.snippets = this.load();
  }

  public get(name: string): Snippet | undefined {
    return this.snippets.get(name);
  }

  public getAll(): Snippet[] {
    return Array.from(this.snippets.values());
  }

  public add(name: string, query: string, lastUsedAt: number = 0, createdAt: number = Date.now()): SnippetResult {
    name = normalizeName(name);
    query = removeExtraWhiteSpace(query);

    if (isEmptyString(name)) {
      return { ok: false, reason: "empty-name" };
    }

    if (isEmptyString(query)) {
      return { ok: false, reason: "empty-query" };
    }

    if (this.snippets.has(name)) {
      return { ok: false, reason: "duplicate-name" };
    }
    const snippet: Snippet = { name, query, lastUsedAt, createdAt };

    this.snippets.set(name, snippet);
    this.save();
    return { ok: true, snippet };
  }

  public update(oldName: string, name: string, query: string): SnippetResult {
    const existing = this.snippets.get(oldName);

    if (existing === undefined) {
      return { ok: false, reason: "not-found" };
    }
    const newName = normalizeName(name);

    if (newName !== oldName && this.snippets.has(newName)) {
      return { ok: false, reason: "duplicate-name" };
    }
    this.snippets.delete(oldName);

    const result = this.add(name, query, existing.lastUsedAt, existing.createdAt);

    if (!result.ok) {
      this.snippets.set(oldName, existing);
    }
    return result;
  }

  public remove(name: string): void {
    this.snippets.delete(name);
    this.save();
  }

  public use(name: string): void {
    const snippet = this.snippets.get(name);

    if (snippet === undefined) {
      return;
    }
    this.snippets.set(name, { ...snippet, lastUsedAt: Date.now() });
    this.save();
  }

  public moveToTop(name: string): void {
    const snippet = this.snippets.get(name);

    if (snippet === undefined) {
      return;
    }
    this.snippets.set(name, { ...snippet, createdAt: Date.now() });
    this.save();
  }

  public replaceAll(entries: SerializedSnippet[]): number {
    const now = Date.now();

    this.snippets.clear();

    const stored = entries.filter((entry, index) => this.add(entry.name, entry.query, 0, now - index).ok).length;

    this.save();
    return stored;
  }

  private save(): void {
    this.storage.set(STORAGE_KEY, this.getAll());
  }

  private load(): Map<string, Snippet> {
    const stored = this.storage.get<unknown>(STORAGE_KEY);
    return stored === null ? this.migrate() : parseSnippets(stored);
  }

  private migrate(): Map<string, Snippet> {
    const legacy = this.storage.get<unknown>(LEGACY_STORAGE_KEY);
    const migrated = new Map<string, Snippet>();

    if (!Array.isArray(legacy)) {
      return migrated;
    }
    const now = Date.now();

    legacy
      .filter((entry): entry is string => typeof entry === "string" && !isEmptyString(entry))
      .forEach((query, index) => {
        const name = generateName(migrated);

        migrated.set(name, {
          name,
          query: removeExtraWhiteSpace(query),
          lastUsedAt: 0,
          createdAt: now - index
        });
      });

    if (migrated.size > 0) {
      this.storage.set(STORAGE_KEY, Array.from(migrated.values()));
    }
    return migrated;
  }
}

function generateName(taken: Map<string, Snippet>): string {
  let counter = 1;

  while (taken.has(`${GENERATED_NAME_PREFIX}${counter}`)) {
    counter += 1;
  }
  return `${GENERATED_NAME_PREFIX}${counter}`;
}

function parseSnippets(value: unknown): Map<string, Snippet> {
  const snippets = new Map<string, Snippet>();

  if (!Array.isArray(value)) {
    return snippets;
  }

  for (const entry of value.filter(isSnippet)) {
    if (!snippets.has(entry.name)) {
      snippets.set(entry.name, entry);
    }
  }
  return snippets;
}

function isSnippet(value: unknown): value is Snippet {
  return isRecord(value) &&
    typeof value.name === "string" &&
    !isEmptyString(value.name) &&
    typeof value.query === "string" &&
    !isEmptyString(value.query) &&
    typeof value.lastUsedAt === "number" &&
    typeof value.createdAt === "number";
}
