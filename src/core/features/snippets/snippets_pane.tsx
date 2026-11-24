import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { Scoped, captureScope, onCleanup } from "@/core/utils/reactive/scope";
import { containsEverySearchWord, splitSearchWords } from "@/core/utils/string/string_utilities";
import { EmptyState } from "@/core/ui/components/empty_state/empty_state";
import { SNIPPETS_TOOL } from "@/core/features/snippets/snippets_tool";
import { SearchField } from "@/core/ui/components/search_field/search_field";
import { Snippet } from "@/core/domain/snippet/snippet";
import { SnippetForm } from "@/core/features/snippets/snippet_form";
import { SnippetRow } from "@/core/features/snippets/snippet_row";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { h } from "@/core/ui/h/h";

export const SnippetsPaneClass = {
  body: "fsg-SnippetsPane-body",
  list: "fsg-SnippetsPane-list"
} as const;

export interface SnippetsPaneProps {
  snippets: Readable<readonly Snippet[]>;
  isNameTaken: (name: string, previousName?: string) => boolean;
  save: (draftSnippet: Pick<Snippet, "name" | "query">, previousName?: string) => void;
  remove: (name: string) => void;
  open: (snippet: Snippet) => void;
}

export function SnippetsPane({ snippets, isNameTaken, save, remove, open }: SnippetsPaneProps): HTMLElement {
  const searchText = new Signal("");
  const searchWords = computed(() => splitSearchWords(searchText.value));
  const isSearching = computed(() => searchWords.value.length > 0);
  const editedSnippetName = new Signal<string | null>(null);
  const isCreatingSnippet = new Signal(false);
  const isSnippetMatched = (snippet: Snippet): boolean => containsEverySearchWord(snippet.name, searchWords.value);
  const closeForm = (): void => {
    editedSnippetName.value = null;
    isCreatingSnippet.value = false;
  };
  const renderSnippet = (snippet: Snippet, currentEditedSnippetName: string | null): HTMLElement => {
    if (snippet.name === currentEditedSnippetName) {
      return (
        <SnippetForm
          snippet={snippet}
          isNameTaken={name => isNameTaken(name, snippet.name)}
          save={draftSnippet => {
            closeForm();
            save(draftSnippet, snippet.name);
          }}
          cancel={closeForm}
          remove={name => {
            closeForm();
            remove(name);
          }}
        />
      );
    }
    return (
      <div hidden={computed(() => !isSnippetMatched(snippet))}>
        <SnippetRow
          snippet={snippet}
          open={() => open(snippet)}
          edit={() => {
            isCreatingSnippet.value = false;
            editedSnippetName.value = snippet.name;
          }}
        />
      </div>
    );
  };
  const renderNewSnippetForm = (): HTMLElement => (
    <SnippetForm
      isNameTaken={name => isNameTaken(name)}
      save={draftSnippet => {
        closeForm();
        save(draftSnippet);
      }}
      cancel={closeForm}
    />
  );
  const newSnippetSlot = <div /> as HTMLElement;
  const list = <div className={SnippetsPaneClass.list} /> as HTMLElement;
  const createChildScope = captureScope();
  let shownNewSnippetForm: Scoped<HTMLElement[]> | undefined;
  let shownSnippets: Scoped<HTMLElement[]> | undefined;

  effect(() => {
    const isCreating = isCreatingSnippet.value;

    shownNewSnippetForm?.dispose();
    shownNewSnippetForm = createChildScope(() => (isCreating ? [renderNewSnippetForm()] : []));
    newSnippetSlot.replaceChildren(...shownNewSnippetForm.result);
  });
  effect(() => {
    const currentSnippets = snippets.value;
    const currentEditedSnippetName = editedSnippetName.value;

    shownSnippets?.dispose();
    shownSnippets = createChildScope(() => currentSnippets.map(snippet => renderSnippet(snippet, currentEditedSnippetName)));
    list.replaceChildren(...shownSnippets.result);
  });
  onCleanup(() => {
    shownNewSnippetForm?.dispose();
    shownSnippets?.dispose();
  });
  return (
    <ViewPane
      title={SNIPPETS_TOOL.label}
      actions={[
        {
          label: "New Snippet",
          icon: "add",
          onClick: (): void => {
            editedSnippetName.value = null;
            isCreatingSnippet.value = true;
          }
        }
      ]}
      searchChild={
        <SearchField
          label="Search Snippets"
          value={searchText}
          onValueChange={value => {
            searchText.value = value;
          }}
        />
      }
    >
      <div className={SnippetsPaneClass.body}>
        {newSnippetSlot}
        <div hidden={computed(() => snippets.value.length === 0)}>
          {list}
        </div>
        <div hidden={computed(() => snippets.value.length > 0 || isCreatingSnippet.value)}>
          <EmptyState message={new Signal("No snippets yet")} />
        </div>
        <div hidden={computed(() => !isSearching.value || snippets.value.length === 0 || snippets.value.some(isSnippetMatched))}>
          <EmptyState message={computed(() => `No snippets match "${searchText.value.trim()}"`)} />
        </div>
      </div>
    </ViewPane>
  );
}
