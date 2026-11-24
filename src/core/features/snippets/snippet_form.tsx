import { Signal, computed } from "@/core/utils/reactive/signal";
import { Chip } from "@/core/ui/components/chip/chip";
import { Snippet } from "@/core/domain/snippet/snippet";
import { TextField } from "@/core/ui/components/text_field/text_field";
import { h } from "@/core/ui/h/h";

export const SnippetFormClass = {
  root: "fsg-SnippetForm",
  actions: "fsg-SnippetForm-actions",
  confirmActions: "fsg-SnippetForm-confirmActions"
} as const;

export interface SnippetFormProps {
  snippet?: Snippet;
  isNameTaken: (name: string) => boolean;
  save: (draftSnippet: Pick<Snippet, "name" | "query">) => void;
  cancel: () => void;
  remove?: (name: string) => void;
}

export function SnippetForm({ snippet, isNameTaken, save, cancel, remove }: SnippetFormProps): HTMLElement {
  const draftName = new Signal(snippet?.name ?? "");
  const draftQuery = new Signal(snippet?.query ?? "");
  const nameTaken = computed(() => isNameTaken(draftName.value));
  const saveDisabled = computed(() => draftName.value.trim() === "" || nameTaken.value);
  const submit = (): void => {
    if (!saveDisabled.peek()) {
      save({ name: draftName.peek(), query: draftQuery.peek() });
    }
  };
  return (
    <div
      className={SnippetFormClass.root}
      onKeydown={event => {
        if (event.key === "Enter") {
          event.preventDefault();
          submit();
        } else if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
      }}
    >
      <TextField
        label="Name"
        value={draftName}
        supportingText={computed(() => (nameTaken.value ? "A snippet with this name already exists" : ""))}
        onValueChange={value => {
          draftName.value = value;
        }}
      />
      <TextField
        label="Query"
        value={draftQuery}
        onValueChange={value => {
          draftQuery.value = value;
        }}
      />
      <div className={SnippetFormClass.actions}>
        {remove && snippet && <Chip label="Delete" onClick={() => remove(snippet.name)} />}
        <div className={SnippetFormClass.confirmActions}>
          <Chip label="Cancel" onClick={cancel} />
          <Chip label="Save" highlighted={new Signal(true)} disabled={saveDisabled} onClick={submit} />
        </div>
      </div>
    </div>
  );
}
