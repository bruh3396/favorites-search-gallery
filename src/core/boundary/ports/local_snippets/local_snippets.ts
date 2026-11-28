import { Snippet } from "@/core/domain/snippet/snippet";

export interface LocalSnippets {
  getAll: () => Promise<readonly Readonly<Snippet>[]>;
  set: (snippet: Readonly<Snippet>) => Promise<void>;
  rename: (previousName: string, snippet: Readonly<Snippet>) => Promise<void>;
  delete: (name: string) => Promise<void>;
}
