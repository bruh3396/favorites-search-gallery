import { Snippet } from "@/core/domain/snippet/snippet";

export function createSnippet(partialSnippet: Partial<Snippet> = {}): Snippet {
  return {
    name: "fruits",
    query: "apple",
    lastUsedAt: 0,
    createdAt: 0,
    ...partialSnippet
  };
}
