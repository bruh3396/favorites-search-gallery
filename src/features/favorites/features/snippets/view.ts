import * as SnippetComponents from "@/features/favorites/features/snippets/components";
import * as SnippetEditor from "@/features/favorites/features/snippets/editor";
import { Snippet, SnippetHandlers } from "@/features/favorites/features/snippets/types";
import { filterSnippets, sortByNewest } from "@/features/favorites/features/snippets/utils";
import { SnippetSelectors } from "@/features/favorites/features/snippets/selectors";
import { SnippetState } from "@/features/favorites/features/snippets/state";
import { WidgetSelectors } from "@/lib/ui/widgets/selectors";
import { createElement } from "@/utils/browser/factory";
import { searchField } from "@/lib/ui/widgets/search_field";

const list = createElement("div", { className: SnippetSelectors.list });
let handlers: SnippetHandlers;

export function setup(snippetHandlers: SnippetHandlers): void {
  handlers = snippetHandlers;
  SnippetEditor.setup(snippetHandlers);
}

export function mount(panel: HTMLElement): void {
  const filterField = searchField("Search Snippets", (value) => {
    SnippetState.filterText = value;
    handlers.onFiltered();
  });
  const filter = createElement("div", {
    className: `${SnippetSelectors.filter} ${WidgetSelectors.separatorBelow}`,
    children: [filterField]
  });

  panel.classList.add(SnippetSelectors.panel);
  panel.append(filter, list, SnippetEditor.build());
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
  return SnippetState.deleteTarget === snippet.name ? SnippetComponents.confirmRow(snippet, handlers) : SnippetComponents.row(snippet, handlers);
}

function visibleSnippets(): Snippet[] {
  return filterSnippets(sortByNewest(SnippetState.snippets), SnippetState.filterText);
}

function placeholderText(): string {
  return SnippetState.snippets.length === 0 ? "No snippets yet" : "No matching snippets";
}
