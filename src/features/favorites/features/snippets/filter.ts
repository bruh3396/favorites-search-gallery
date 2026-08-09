import { Snippet } from "@/features/favorites/features/snippets/types";

export function filter(snippets: Snippet[], query: string): Snippet[] {
  query = query.trim().toLowerCase();
  return query === "" ? snippets : snippets.filter(snippet => matches(snippet, query));
}

function matches(snippet: Snippet, query: string): boolean {
  return snippet.name.toLowerCase().includes(query) || snippet.query.toLowerCase().includes(query);
}
