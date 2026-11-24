import { IconButton } from "@/core/ui/components/icon_button/icon_button";
import { ListRow } from "@/core/ui/components/list_row/list_row";
import { Snippet } from "@/core/domain/snippet/snippet";
import { h } from "@/core/ui/h/h";

export const SnippetRowClass = {
  root: "fsg-SnippetRow",
  name: "fsg-SnippetRow-name",
  edit: "fsg-SnippetRow-edit"
} as const;

export interface SnippetRowProps {
  snippet: Snippet;
  open: () => void;
  edit: () => void;
}

export function SnippetRow({ snippet, open, edit }: SnippetRowProps): HTMLElement {
  return (
    <ListRow className={SnippetRowClass.root}>
      <button className={SnippetRowClass.name} type="button" title={snippet.query} onClick={open}>
        {snippet.name}
      </button>
      <IconButton icon="pencil" label={`Edit ${snippet.name}`} className={SnippetRowClass.edit} onClick={edit} />
    </ListRow>
  );
}
