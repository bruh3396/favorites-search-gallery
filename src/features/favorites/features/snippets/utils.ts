import { Snippet, SnippetFailure } from "@/features/favorites/features/snippets/types";
import { removeExtraWhiteSpace } from "@/utils/string/format";

export function normalizeName(name: string): string {
  return removeExtraWhiteSpace(name).toLowerCase().replace(/\s/g, "_");
}

export function sortByRecentlyUsed(snippets: Snippet[]): Snippet[] {
  return snippets.slice().sort((a, b) => b.lastUsedAt - a.lastUsedAt || b.createdAt - a.createdAt);
}

export function filterSnippets(snippets: Snippet[], text: string): Snippet[] {
  text = text.trim().toLowerCase().replace(/^\/+/u, "");
  return text === "" ? snippets : snippets.filter(snippet => matches(snippet, text));
}

export function buildIdQuery(ids: string[]): string {
  return ids.length === 0 ? "" : `( ${ids.join(" ~ ")} )`;
}

export function failureText(reason: SnippetFailure, name: string): string {
  switch (reason) {
    case "empty-name":
      return "A snippet needs a name";

    case "empty-query":
      return "A snippet needs a query";

    case "duplicate-name":
      return `A snippet named /${name} already exists`;

    default:
      return "That snippet no longer exists";
  }
}

function matches(snippet: Snippet, text: string): boolean {
  // remove slash from left of text if someone types in tat prefix?? /portrait -> portrait? claude help here
  return snippet.name.toLowerCase().includes(text) || snippet.query.toLowerCase().includes(text);
}
