import { SerializedSnippet } from "@/features/favorites/features/snippets/types/types";
import { Snippet } from "@/core/domain/snippet/snippet";
import { isEmptyString } from "@/utils/pure/string";

export function serialize(snippets: Snippet[]): Blob {
  return new Blob([JSON.stringify(snippets.map(toExported), null, 2)], { type: "application/json" });
}

export function parse(contents: string): SerializedSnippet[] {
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
  const isRecord = typeof value === "object" && value !== null;
  const field = isRecord ? (value as Record<string, unknown>)[key] : undefined;
  return typeof field === "string" ? field : fallback;
}
