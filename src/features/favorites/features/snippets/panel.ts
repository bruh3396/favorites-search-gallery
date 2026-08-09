import { Snippet } from "@/features/favorites/features/snippets/types";
import { SnippetsClass } from "@/features/favorites/features/snippets/scaffold";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/dom/element_factory";

const list = createElement("div", { className: SnippetsClass.list });

let useSnippet: (name: string) => void = () => { };

export function setup(onUse: (name: string) => void): void {
  useSnippet = onUse;
}

export function mount(panel: HTMLElement): void {
  panel.classList.add(SnippetsClass.panel);
  panel.appendChild(list);
}

export function render(snippets: Snippet[]): void {
  list.replaceChildren(...snippets.length === 0 ? [placeholder()] : snippets.map(row));
}

function row(snippet: Snippet): HTMLElement {
  const rowElement = createElement("div", {
    className: SnippetsClass.row,
    children: [definition(snippet)]
  });

  addTooltip(rowElement, snippet.query);
  rowElement.addEventListener("click", () => useSnippet(snippet.name));
  return rowElement;
}

function definition(snippet: Snippet): HTMLElement {
  return createElement("div", {
    className: SnippetsClass.definition,
    children: [
      createElement("div", { className: SnippetsClass.name, textContent: `/${snippet.name}` }),
      createElement("div", { className: SnippetsClass.query, textContent: snippet.query })
    ]
  });
}

function placeholder(): HTMLElement {
  return createElement("div", { className: SnippetsClass.empty, textContent: "No snippets yet" });
}
