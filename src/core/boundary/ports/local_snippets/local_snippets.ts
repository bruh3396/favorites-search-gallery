import { Snippet } from "@/core/domain/snippet/snippet";

export interface LocalSnippets {
  getAll: () => Promise<Snippet[]>;
  setMany: (snippets: Snippet[]) => Promise<void>;
  deleteMany: (names: string[]) => Promise<void>;
  replaceAll: (snippets: Snippet[]) => Promise<void>;
}
