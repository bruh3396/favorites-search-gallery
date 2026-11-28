import { Readable, Signal } from "@/core/utils/reactive/signal";
import { LocalSnippets } from "@/core/boundary/ports/local_snippets/local_snippets";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Snippet } from "@/core/domain/snippet/snippet";

export interface SnippetLibraryDependencies {
  localSnippets: LocalSnippets;
  scheduler: Pick<Scheduler, "now">;
}

export class SnippetLibrary {
  readonly #snippets = new Signal<readonly Snippet[]>([]);

  constructor(private readonly dependencies: SnippetLibraryDependencies) { }

  public get snippets(): Readable<readonly Snippet[]> {
    return this.#snippets;
  }

  public async load(): Promise<void> {
    this.#snippets.value = sortSnippets(await this.dependencies.localSnippets.getAll());
  }

  public isNameTaken(name: string, previousName?: string): boolean {
    const normalizedName = normalizeSnippetName(name);
    return this.#snippets.value.some(snippet => snippet.name !== previousName && normalizeSnippetName(snippet.name) === normalizedName);
  }

  public async save(draftSnippet: Pick<Snippet, "name" | "query">, previousName?: string): Promise<void> {
    const { localSnippets, scheduler } = this.dependencies;
    const name = draftSnippet.name.trim();

    if (name === "" || this.isNameTaken(name, previousName)) {
      return;
    }
    const previousSnippet = this.find(previousName);
    const now = scheduler.now();
    const savedSnippet: Snippet = { lastUsedAt: now, createdAt: now, ...previousSnippet, name, query: draftSnippet.query };

    this.#snippets.value = sortSnippets([...this.#snippets.value.filter(snippet => snippet.name !== previousName), savedSnippet]);

    if (previousSnippet !== undefined && previousSnippet.name !== name) {
      await localSnippets.rename(previousSnippet.name, savedSnippet);
      return;
    }
    await localSnippets.set(savedSnippet);
  }

  public async remove(name: string): Promise<void> {
    this.#snippets.value = this.#snippets.value.filter(snippet => snippet.name !== name);
    await this.dependencies.localSnippets.delete(name);
  }

  public async recordUse(name: string): Promise<void> {
    const { localSnippets, scheduler } = this.dependencies;
    const foundSnippet = this.find(name);

    if (foundSnippet === undefined) {
      return;
    }
    const usedSnippet = { ...foundSnippet, lastUsedAt: scheduler.now() };

    this.#snippets.value = this.#snippets.value.map(snippet => (snippet.name === name ? usedSnippet : snippet));
    await localSnippets.set(usedSnippet);
  }

  private find(name: string | undefined): Snippet | undefined {
    return name === undefined ? undefined : this.#snippets.value.find(snippet => snippet.name === name);
  }
}

function normalizeSnippetName(name: string): string {
  return name.trim().toLowerCase();
}

function sortSnippets(snippets: readonly Snippet[]): readonly Snippet[] {
  return [...snippets].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
