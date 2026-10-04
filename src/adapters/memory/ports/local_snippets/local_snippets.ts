import { LocalSnippets } from "@/core/boundary/ports/local_snippets/local_snippets";
import { Snippet } from "@/core/domain/snippet/snippet";

export class MemoryLocalSnippets implements LocalSnippets {
  private readonly snippets = new Map<string, Snippet>();

  public getAll(): Promise<Snippet[]> {
    return Promise.resolve(Array.from(this.snippets.values(), snippet => ({ ...snippet })));
  }

  public setMany(snippets: Snippet[]): Promise<void> {
    snippets.forEach(snippet => this.snippets.set(snippet.name, { ...snippet }));
    return Promise.resolve();
  }

  public deleteMany(names: string[]): Promise<void> {
    names.forEach(name => this.snippets.delete(name));
    return Promise.resolve();
  }

  public replaceAll(snippets: Snippet[]): Promise<void> {
    this.snippets.clear();
    return this.setMany(snippets);
  }
}
