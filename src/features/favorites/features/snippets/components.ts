import { IconName, icon } from "@/lib/ui/icon";
import { Snippet, SnippetHandlers } from "@/features/favorites/features/snippets/types";
import { removeDataset, setDataset, toggleDataset } from "@/utils/dom/dataset";
import { SnippetSelectors } from "@/features/favorites/features/snippets/selectors";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/dom/element_factory";
import { separator } from "@/lib/ui/widgets/separator";

export function row(snippet: Snippet, handlers: SnippetHandlers): HTMLElement {
  const element = createElement("div", {
    className: SnippetSelectors.row,
    children: [definition(snippet, snippet.query), actions(snippet, handlers)]
  });

  addTooltip(element, snippet.query);
  element.addEventListener("click", () => handlers.onUse(snippet.name));
  return element;
}

export function confirmRow(snippet: Snippet, handlers: SnippetHandlers): HTMLElement {
  return createElement("div", {
    className: SnippetSelectors.row,
    children: [
      definition(snippet, "Delete this snippet?", SnippetSelectors.confirmPrompt),
      confirmActions(snippet, handlers)
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

function actions(snippet: Snippet, handlers: SnippetHandlers): HTMLElement {
  return createElement("div", {
    className: SnippetSelectors.actions,
    children: [
      // copyButton(snippet, handlers),
      iconButton("moveToTop", () => handlers.onMoveToTop(snippet.name)),
      iconButton("pencil", () => handlers.onEdit(snippet.name)),
      iconButton("trash", () => handlers.onDeleteRequested(snippet.name), true)
    ]
  });
}

function confirmActions(snippet: Snippet, handlers: SnippetHandlers): HTMLElement {
  return createElement("div", {
    className: SnippetSelectors.actions,
    children: [
      textButton("Cancel", () => handlers.onDeleteCancelled(), false),
      textButton("Delete", () => handlers.onDelete(snippet.name), true)
    ]
  });
}

function copyButton(snippet: Snippet, handlers: SnippetHandlers): HTMLElement {
  const element = createElement("button", { className: SnippetSelectors.action, children: [icon("clipboard")] });
  let restore: number | undefined;
  return button(element, () => {
    handlers.onCopy(snippet.name);
    element.replaceChildren(icon("check"));
    setDataset(element, "copied");
    clearTimeout(restore);
    restore = window.setTimeout(() => {
      element.replaceChildren(icon("clipboard"));
      removeDataset(element, "copied");
    }, 1200);
  }, false);
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
