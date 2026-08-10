import { Snippet, SnippetFailure } from "@/features/favorites/features/snippets/types";

export const SnippetState: {
  snippets: Snippet[];
  editTarget: string | null;
  deleteTarget: string | null;
  saveFailure: SnippetFailure | null;
  filterText: string;
} = {
  snippets: [],
  editTarget: null,
  deleteTarget: null,
  saveFailure: null,
  filterText: ""
};
