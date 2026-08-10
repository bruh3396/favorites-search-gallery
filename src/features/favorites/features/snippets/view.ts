import * as SnippetComponents from "@/features/favorites/features/snippets/components";
import * as SnippetEditor from "@/features/favorites/features/snippets/editor";
import { filterSnippets, sortByRecentlyUsed } from "@/features/favorites/features/snippets/utils";
import { Snippet } from "@/features/favorites/features/snippets/types";
import { SnippetHandlers } from "@/features/favorites/features/snippets/handlers";
import { SnippetSelectors } from "@/features/favorites/features/snippets/selectors";
import { SnippetState } from "@/features/favorites/features/snippets/state";
import { createElement } from "@/utils/dom/element_factory";
import { searchField } from "@/lib/ui/widgets/search_field";

const list = createElement("div", { className: SnippetSelectors.list });

export function mount(panel: HTMLElement): void {
  const filterField = searchField("Search Snippets", (value) => {
    SnippetState.filterText = value;
    SnippetHandlers.onFiltered();
  });

  panel.classList.add(SnippetSelectors.panel);
  panel.append(filterField, list, SnippetEditor.build());
  render();
}

export function render(): void {
  renderList();
  SnippetEditor.render();
}

function renderList(): void {
  const visible = visibleSnippets();

  list.replaceChildren(...visible.length === 0 ? [SnippetComponents.placeholder(placeholderText())] : visible.map(row));
}

function row(snippet: Snippet): HTMLElement {
  return SnippetState.deleteTarget === snippet.name ? SnippetComponents.confirmRow(snippet) : SnippetComponents.row(snippet);
}

function visibleSnippets(): Snippet[] {
  return filterSnippets(sortByRecentlyUsed(SnippetState.snippets), SnippetState.filterText);
}

function placeholderText(): string {
  return SnippetState.snippets.length === 0 ? "No snippets yet" : "No matching snippets";
}
