import { SerializedSnippet, Snippet } from "@/features/favorites/features/snippets/types";
import { downloadBlob } from "@/utils/browser/download";
import { isEmptyString } from "@/utils/string/query";
import { parseJson } from "@/utils/string/parse";
import { readString } from "@/utils/object";

export function exportSnippets(snippets: Snippet[]): void {
  downloadBlob(new Blob([JSON.stringify(snippets.map(toExported), null, 2)], { type: "application/json" }), "snippets.json");
}

export function importSnippets(contents: string): SerializedSnippet[] {
  const parsed = parseJson(contents);
  return Array.isArray(parsed) ? parsed.map(toImported).filter(snippet => snippet !== null) : [];
}

function toExported(snippet: Snippet): SerializedSnippet {
  return { name: snippet.name, query: snippet.query };
}

function toImported(value: unknown): SerializedSnippet | null {
  const name = readString(value, "name");
  const query = readString(value, "query");
  return isEmptyString(name) || isEmptyString(query) ? null : { name, query };
}
