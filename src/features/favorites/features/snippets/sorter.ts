import { Snippet } from "@/features/favorites/features/snippets/types";

export function sortByRecentlyUsed(snippets: Snippet[]): Snippet[] {
  return snippets.slice().sort((a, b) => b.lastUsedAt - a.lastUsedAt || b.createdAt - a.createdAt);
}
