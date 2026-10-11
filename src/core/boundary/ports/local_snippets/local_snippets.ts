import { Snippet } from "@/core/domain/snippet/snippet";

export interface LocalSnippets {
  getAll: () => Promise<readonly Readonly<Snippet>[]>;
  setMany: (snippets: readonly Readonly<Snippet>[]) => Promise<void>;
  deleteMany: (names: readonly string[]) => Promise<void>;
  replaceAll: (snippets: readonly Readonly<Snippet>[]) => Promise<void>;
}
