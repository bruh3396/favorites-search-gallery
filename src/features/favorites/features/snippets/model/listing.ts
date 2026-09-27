import { Snippet } from "@/features/favorites/features/snippets/types/types";

export function sortByNewest(snippets: Snippet[]): Snippet[] {
  return snippets.slice().sort((a, b) => b.createdAt - a.createdAt);
}

export function filterSnippets(snippets: Snippet[], text: string): Snippet[] {
  text = text.trim().toLowerCase().replace(/^\/+/u, "");
  return text === "" ? snippets : snippets.filter(snippet => matches(snippet, text));
}

export function emptyText(snippets: Snippet[]): string {
  return snippets.length === 0 ? "No snippets yet" : "No matching snippets";
}

function matches(snippet: Snippet, text: string): boolean {
  return snippet.name.toLowerCase().includes(text) || snippet.query.toLowerCase().includes(text);
}
