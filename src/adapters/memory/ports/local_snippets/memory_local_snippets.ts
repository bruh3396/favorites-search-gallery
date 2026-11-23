import { LocalSnippets } from "@/core/boundary/ports/local_snippets/local_snippets";
import { Snippet } from "@/core/domain/snippet/snippet";

export class MemoryLocalSnippets implements LocalSnippets {
  private readonly snippets = new Map<string, Snippet>();

  public getAll(): Promise<readonly Readonly<Snippet>[]> {
    return Promise.resolve(Array.from(this.snippets.values(), snippet => ({ ...snippet })));
  }

  public set(snippet: Readonly<Snippet>): Promise<void> {
    this.snippets.set(snippet.name, { ...snippet });
    return Promise.resolve();
  }

  public rename(previousName: string, snippet: Readonly<Snippet>): Promise<void> {
    this.snippets.delete(previousName);
    return this.set(snippet);
  }

  public delete(name: string): Promise<void> {
    this.snippets.delete(name);
    return Promise.resolve();
  }

  public replaceAll(snippets: readonly Readonly<Snippet>[]): Promise<void> {
    this.snippets.clear();
    snippets.forEach(snippet => this.snippets.set(snippet.name, { ...snippet }));
    return Promise.resolve();
  }
}
