import { Favorite } from "@/types/favorite";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { LocalSnippets } from "@/core/boundary/ports/local_snippets/local_snippets";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Snippet } from "@/core/domain/snippet/snippet";

export interface SnippetModelDependencies {
  localSnippets: LocalSnippets;
  localKeyedValues: LocalKeyedValues;
  scheduler: Scheduler;
}

export interface SnippetsDependencies extends SnippetModelDependencies {
  appendToSearch: (text: string) => void;
  getSearchResults: () => Favorite[];
}

export interface SnippetContext extends Omit<SnippetsDependencies, keyof SnippetModelDependencies> {
  alert: (message: string) => void;
  confirm: (message: string) => boolean;
  saveBlob: (blob: Blob, filename: string) => void;
}

export type SnippetAction = "use" | "moveToTop" | "edit" | "requestDelete" | "cancelDelete" | "delete" | "save" | "fillQueryFromResults" | "cancelEdit";

export interface SnippetIntents {
  use: (name: string) => void;
  moveToTop: (name: string) => void;
  edit: (name: string) => void;
  requestDelete: (name: string) => void;
  cancelDelete: () => void;
  delete: (name: string) => void;
  save: (name: string, query: string) => void;
  fillQueryFromResults: () => void;
  cancelEdit: () => boolean;
  clearFailure: () => void;
  filter: (text: string) => void;
  importFromFile: (contents: string) => void;
  exportToFile: () => void;
  deleteAll: () => void;
}

export type SerializedSnippet = Omit<Snippet, "lastUsedAt" | "createdAt">;

export type SnippetFailureReason = "empty-name" | "empty-query" | "duplicate-name" | "not-found";

export type SnippetResult = { ok: true; snippet: Snippet } | { ok: false; reason: SnippetFailureReason };

export interface SnippetSaveFailure {
  reason: SnippetFailureReason;
  message: string;
}

export interface SnippetScene {
  rows: Snippet[];
  placeholder: string;
  editTarget: string | null;
  deleteTarget: string | null;
  failure: SnippetSaveFailure | null;
}
