import { IconName, icon } from "@/lib/ui/icon";
import { Snippet } from "@/features/favorites/features/snippets/types";
import { SnippetHandlers } from "@/features/favorites/features/snippets/handlers";
import { SnippetSelectors } from "@/features/favorites/features/snippets/selectors";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/dom/element_factory";
import { separator } from "@/lib/ui/widgets/separator";
import { toggleDataset } from "@/utils/dom/dataset";

export function row(snippet: Snippet): HTMLElement {
  const element = createElement("div", {
    className: SnippetSelectors.row,
    children: [definition(snippet, snippet.query), actions(snippet)]
  });

  addTooltip(element, snippet.query);
  element.addEventListener("click", () => SnippetHandlers.onUse(snippet.name));
  return element;
}

export function confirmRow(snippet: Snippet): HTMLElement {
  return createElement("div", {
    className: SnippetSelectors.row,
    children: [
      definition(snippet, "Delete this snippet?", SnippetSelectors.confirmPrompt),
      confirmActions(snippet)
    ]
  });
}

export function placeholder(text: string): HTMLElement {
  return createElement("div", { className: SnippetSelectors.empty, textContent: text });
}

export function rule(): HTMLElement {
  return separator(SnippetSelectors.rule);
}

function definition(snippet: Snippet, subtitle: string, subtitleClass: string = ""): HTMLElement {
  return createElement("div", {
    className: SnippetSelectors.definition,
    children: [
      createElement("div", { className: SnippetSelectors.name, textContent: `/${snippet.name}` }),
      createElement("div", { className: `${SnippetSelectors.query} ${subtitleClass}`.trim(), textContent: subtitle })
    ]
  });
}

function actions(snippet: Snippet): HTMLElement {
  return createElement("div", {
    className: SnippetSelectors.actions,
    children: [
      iconButton("pencil", () => SnippetHandlers.onEdit(snippet.name)),
      iconButton("trash", () => SnippetHandlers.onDeleteRequested(snippet.name), true)
    ]
  });
}

function confirmActions(snippet: Snippet): HTMLElement {
  return createElement("div", {
    className: SnippetSelectors.actions,
    children: [
      textButton("Cancel", () => SnippetHandlers.onDeleteCancelled(), false),
      textButton("Delete", () => SnippetHandlers.onDelete(snippet.name), true)
    ]
  });
}

function iconButton(iconName: IconName, onClick: () => void, danger: boolean = false): HTMLElement {
  return button(createElement("button", { className: SnippetSelectors.action, children: [icon(iconName)] }), onClick, danger);
}

function textButton(label: string, onClick: () => void, danger: boolean): HTMLElement {
  return button(createElement("button", { className: SnippetSelectors.confirmButton, textContent: label }), onClick, danger);
}

function button(element: HTMLButtonElement, onClick: () => void, danger: boolean): HTMLElement {
  element.type = "button";
  toggleDataset(element, "danger", danger);
  element.addEventListener("click", event => {
    event.stopPropagation();
    onClick();
  });
  return element;
}
