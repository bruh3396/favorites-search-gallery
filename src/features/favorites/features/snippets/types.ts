export interface Snippet {
  name: string;
  query: string;
  lastUsedAt: number;
  createdAt: number;
}

export type SerializedSnippet = Omit<Snippet, "lastUsedAt" | "createdAt">;

export type SnippetFailure = "empty-name" | "empty-query" | "duplicate-name" | "not-found";

export type SnippetResult = { ok: true; snippet: Snippet } | { ok: false; reason: SnippetFailure };
