import { SerializedSnippet, Snippet } from "@/features/favorites/features/snippets/types";
import { downloadBlob } from "@/utils/platform/browser";
import { isEmptyString } from "@/utils/pure/string";
import { isRecord } from "@/utils/pure/collection";

export function exportSnippets(snippets: Snippet[]): void {
  downloadBlob(new Blob([JSON.stringify(snippets.map(toExported), null, 2)], { type: "application/json" }), "snippets.json");
}

export function importSnippets(contents: string): SerializedSnippet[] {
  let parsed;

  try {
    parsed = JSON.parse(contents);
  } catch {
    parsed = null;
  }
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

function readString(value: unknown, key: string, fallback: string = ""): string {
  const field = isRecord(value) ? value[key] : undefined;
  return typeof field === "string" ? field : fallback;
}
