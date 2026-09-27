import { SnippetFlow, SnippetFlowDependencies } from "@/features/favorites/features/snippets/flows/flow";
import { SnippetIntents, SnippetSaveFailure } from "@/features/favorites/features/snippets/types/types";
import { AwesompleteSuggestion } from "awesomplete";

const SNIPPET_TRIGGER = "/";
const EXPORT_FILENAME = "snippets.json";

interface LibraryState {
  editTarget: string | null;
  deleteTarget: string | null;
  failure: SnippetSaveFailure | null;
  filterText: string;
}

export class SnippetLibraryFlow extends SnippetFlow implements SnippetIntents {
  private readonly state: LibraryState;

  constructor(dependencies: SnippetFlowDependencies) {
    super(dependencies);
    this.state = { editTarget: null, deleteTarget: null, failure: null, filterText: "" };
  }

  public mount(container: HTMLElement): void {
    this.view.mount(container);
    this.render();
  }

  public suggestions(prefix: string): AwesompleteSuggestion[] {
    if (!prefix.startsWith(SNIPPET_TRIGGER)) {
      return [];
    }
    return this.model.getAllSnippets().map(snippet => ({
      label: `${SNIPPET_TRIGGER}${snippet.name} (snippet)`,
      value: `${SNIPPET_TRIGGER}${snippet.name}`,
      insert: snippet.query,
      type: "snippet"
    }));
  }

  public use(name: string): void {
    const snippet = this.model.getSnippet(name);

    if (snippet === undefined) {
      return;
    }
    this.context.appendToSearch(snippet.query);
    this.model.useSnippet(name);
    this.render();
  }

  public moveToTop(name: string): void {
    this.model.moveSnippetToTop(name);
    this.render();
  }

  public edit(name: string): void {
    const snippet = this.model.getSnippet(name);

    if (snippet === undefined) {
      return;
    }
    this.state.editTarget = name;
    this.state.deleteTarget = null;
    this.state.failure = null;
    this.view.fill(snippet);
    this.render();
  }

  public save(name: string, query: string): void {
    const target = this.state.editTarget;
    const result = target === null ? this.model.addSnippet(name, query) : this.model.updateSnippet(target, name, query);

    if (!result.ok) {
      this.state.failure = { reason: result.reason, message: this.model.describeFailure(result.reason, name) };
      this.render();
      return;
    }
    this.clearEditor();
    this.render();
  }

  public fillQueryFromResults(): void {
    const results = this.context.getSearchResults();

    if (results.length === 0) {
      this.context.alert("No search results to build a query from");
      return;
    }
    this.view.setQuery(this.model.buildIdQuery(results.map(favorite => favorite.id)));
    this.clearFailure();
  }

  public cancelEdit(): boolean {
    if (this.state.editTarget === null) {
      return false;
    }
    this.clearEditor();
    this.render();
    return true;
  }

  public requestDelete(name: string): void {
    this.state.deleteTarget = name;
    this.render();
  }

  public cancelDelete(): void {
    this.state.deleteTarget = null;
    this.render();
  }

  public delete(name: string): void {
    this.model.removeSnippet(name);
    this.state.deleteTarget = null;

    if (this.state.editTarget === name) {
      this.clearEditor();
    }
    this.render();
  }

  public deleteAll(): void {
    const count = this.model.countSnippets();

    if (count === 0) {
      this.context.alert("No snippets to delete");
      return;
    }

    if (!this.context.confirm(`Delete all ${count} snippets?`)) {
      return;
    }
    this.model.replaceAllSnippets([]);
    this.state.deleteTarget = null;
    this.clearEditor();
    this.render();
  }

  public clearFailure(): void {
    if (this.state.failure !== null) {
      this.state.failure = null;
      this.render();
    }
  }

  public filter(text: string): void {
    this.state.filterText = text;
    this.render();
  }

  public exportToFile(): void {
    this.context.saveBlob(this.model.serializeSnippets(), EXPORT_FILENAME);
  }

  public importFromFile(contents: string): void {
    const imported = this.model.parseSnippets(contents);

    if (imported.length === 0) {
      this.context.alert("No snippets found in that file");
      return;
    }

    if (this.model.countSnippets() > 0 && !this.context.confirm(`Replace all snippets with ${imported.length} from this file?`)) {
      return;
    }
    this.model.replaceAllSnippets(imported);
    this.clearEditor();
    this.render();
  }

  private clearEditor(): void {
    this.state.editTarget = null;
    this.state.failure = null;
    this.view.clear();
  }

  private render(): void {
    this.view.render({
      rows: this.model.listSnippets(this.state.filterText),
      placeholder: this.model.emptyText(),
      editTarget: this.state.editTarget,
      deleteTarget: this.state.deleteTarget,
      failure: this.state.failure
    });
  }
}
