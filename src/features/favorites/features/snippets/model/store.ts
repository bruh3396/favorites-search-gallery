import { SerializedSnippet, Snippet, SnippetResult } from "@/features/favorites/features/snippets/types/types";
import { isEmptyString, removeExtraWhitespace, toLowerUnderscored } from "@/utils/pure/string";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";

const STORAGE_KEY = "searchSnippets";

export class SnippetStore {
  private readonly storage: LocalKeyedValues;
  private readonly snippets: Map<string, Snippet>;

  constructor(storage: LocalKeyedValues) {
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
    name = toLowerUnderscored(name);
    query = removeExtraWhitespace(query);

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
    const newName = toLowerUnderscored(name);

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
    return parseSnippets(this.storage.get(STORAGE_KEY));
  }
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
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.name === "string" &&
    !isEmptyString(record.name) &&
    typeof record.query === "string" &&
    !isEmptyString(record.query) &&
    typeof record.lastUsedAt === "number" &&
    typeof record.createdAt === "number";
}
