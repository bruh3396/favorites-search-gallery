import { SerializedSnippet, SnippetModelDependencies, SnippetResult } from "@/features/favorites/features/snippets/types/types";
import { isEmptyString, removeExtraWhitespace, toLowerUnderscored } from "@/core/utils/string/string";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { LocalSnippets } from "@/core/boundary/ports/local_snippets/local_snippets";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Snippet } from "@/core/domain/snippet/snippet";

const UNMOVED_STORAGE_KEY = "searchSnippets";

export class SnippetStore {
  private readonly localSnippets: LocalSnippets;
  private readonly localKeyedValues: LocalKeyedValues;
  private readonly scheduler: Scheduler;
  private readonly snippets: Map<string, Snippet>;

  constructor({ localSnippets, localKeyedValues, scheduler }: SnippetModelDependencies) {
    this.localSnippets = localSnippets;
    this.localKeyedValues = localKeyedValues;
    this.scheduler = scheduler;
    this.snippets = new Map();
  }

  public async load(): Promise<void> {
    const stored = await this.localSnippets.getAll();
    const loaded = stored.length > 0 ? stored : await this.moveOutOfLocalKeyedValues();

    for (const snippet of loaded) {
      if (!this.snippets.has(snippet.name)) {
        this.snippets.set(snippet.name, snippet);
      }
    }
  }

  public get(name: string): Snippet | undefined {
    return this.snippets.get(name);
  }

  public getAll(): Snippet[] {
    return [...this.snippets.values()];
  }

  public add(name: string, query: string): SnippetResult {
    const result = this.insert({ name, query, lastUsedAt: 0, createdAt: this.scheduler.now() });

    if (result.ok) {
      this.localSnippets.setMany([result.snippet]);
    }
    return result;
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

    const result = this.insert({ ...existing, name, query });

    if (!result.ok) {
      this.snippets.set(oldName, existing);
      return result;
    }
    this.localSnippets.setMany([result.snippet]);

    if (result.snippet.name !== oldName) {
      this.localSnippets.deleteMany([oldName]);
    }
    return result;
  }

  public remove(name: string): void {
    this.snippets.delete(name);
    this.localSnippets.deleteMany([name]);
  }

  public use(name: string): void {
    const snippet = this.snippets.get(name);

    if (snippet !== undefined) {
      this.replace({ ...snippet, lastUsedAt: this.scheduler.now() });
    }
  }

  public moveToTop(name: string): void {
    const snippet = this.snippets.get(name);

    if (snippet !== undefined) {
      this.replace({ ...snippet, createdAt: this.scheduler.now() });
    }
  }

  public replaceAll(entries: SerializedSnippet[]): number {
    const now = this.scheduler.now();

    this.snippets.clear();

    const stored = entries.filter((entry, index) => this.insert({ name: entry.name, query: entry.query, lastUsedAt: 0, createdAt: now - index }).ok).length;

    this.localSnippets.replaceAll(this.getAll());
    return stored;
  }

  private insert(candidate: Snippet): SnippetResult {
    const name = toLowerUnderscored(candidate.name);
    const query = removeExtraWhitespace(candidate.query);

    if (isEmptyString(name)) {
      return { ok: false, reason: "empty-name" };
    }

    if (isEmptyString(query)) {
      return { ok: false, reason: "empty-query" };
    }

    if (this.snippets.has(name)) {
      return { ok: false, reason: "duplicate-name" };
    }
    const snippet: Snippet = { ...candidate, name, query };

    this.snippets.set(name, snippet);
    return { ok: true, snippet };
  }

  private replace(snippet: Snippet): void {
    this.snippets.set(snippet.name, snippet);
    this.localSnippets.setMany([snippet]);
  }

  private async moveOutOfLocalKeyedValues(): Promise<Snippet[]> {
    const unmoved = this.localKeyedValues.get(UNMOVED_STORAGE_KEY);

    if (unmoved === undefined) {
      return [];
    }
    const snippets = [...parseSnippets(unmoved).values()];

    await this.localSnippets.setMany(snippets);
    this.localKeyedValues.remove(UNMOVED_STORAGE_KEY);
    return snippets;
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
