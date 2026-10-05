import * as SnippetActions from "@/features/favorites/features/snippets/control/actions";
import { SnippetAction, SnippetIntents } from "@/features/favorites/features/snippets/types/types";
import { SnippetShell } from "@/features/favorites/features/snippets/shell/shell";
import { attachAutocomplete } from "@/lib/ui/autocomplete/autocomplete";
import { searchField } from "@/lib/ui/widgets/search_field";
import { toLowerUnderscored } from "@/core/utils/string/string";

export class SnippetControl {
  public readonly actions: HTMLElement[];
  private readonly shell: SnippetShell;
  private readonly intents: SnippetIntents;
  private readonly dispatch: Record<SnippetAction, (name: string) => void>;

  constructor(shell: SnippetShell, intents: SnippetIntents) {
    this.shell = shell;
    this.intents = intents;
    this.dispatch = {
      use: (name): void => intents.use(name),
      moveToTop: (name): void => intents.moveToTop(name),
      edit: (name): void => intents.edit(name),
      requestDelete: (name): void => intents.requestDelete(name),
      cancelDelete: (): void => intents.cancelDelete(),
      delete: (name): void => intents.delete(name),
      save: (): void => intents.save(shell.nameField.value, shell.queryField.value),
      fillQueryFromResults: (): void => intents.fillQueryFromResults(),
      cancelEdit: (): void => {
        intents.cancelEdit();
      }
    };
    this.actions = [
      SnippetActions.importButton((contents): void => intents.importFromFile(contents)),
      SnippetActions.exportButton((): void => intents.exportToFile()),
      SnippetActions.deleteAllButton((): void => intents.deleteAll())
    ];
    shell.filter.append(searchField("Search Snippets", (text): void => intents.filter(text)));
    attachAutocomplete(shell.queryField);
    this.addListeners();
  }

  private addListeners(): void {
    this.shell.list.addEventListener("click", event => this.onClick(event));
    this.shell.editorActions.addEventListener("click", event => this.onClick(event));
    this.shell.nameField.addEventListener("input", () => this.onNameInput());
    this.shell.queryField.addEventListener("input", () => this.intents.clearFailure());
    this.shell.nameField.addEventListener("keydown", event => this.onKeyDown(event));
    this.shell.queryField.addEventListener("keydown", event => this.onKeyDown(event));
  }

  private onClick(event: MouseEvent): void {
    const target = (event.target as Element).closest<HTMLElement>("[data-snippet-action]");

    if (target === null) {
      return;
    }
    const name = target.closest<HTMLElement>("[data-snippet-name]")?.dataset.snippetName ?? "";

    this.dispatch[target.dataset.snippetAction as SnippetAction](name);
  }

  private onNameInput(): void {
    const normalized = toLowerUnderscored(this.shell.nameField.value);

    if (normalized !== this.shell.nameField.value) {
      this.shell.nameField.value = normalized;
    }
    this.intents.clearFailure();
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.intents.cancelEdit()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
