import { IconName, icon } from "@/lib/ui/icon";
import { Snippet, SnippetAction, SnippetScene } from "@/features/favorites/features/snippets/types/types";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/element";
import { toggleDataset } from "@/utils/browser/dataset";

const SELECTORS = {
  row: "favorites-snippets-row",
  definition: "favorites-snippets-definition",
  name: "favorites-snippets-name",
  query: "favorites-snippets-query",
  actions: "favorites-snippets-actions",
  action: "favorites-snippets-action",
  confirmPrompt: "favorites-snippets-confirm-prompt",
  confirmButton: "favorites-snippets-confirm-button",
  empty: "favorites-snippets-empty"
} as const;

export function list(scene: SnippetScene): HTMLElement[] {
  return scene.rows.length === 0 ? [placeholder(scene.placeholder)] : scene.rows.map(snippet => (scene.deleteTarget === snippet.name ? confirmRow(snippet) : row(snippet)));
}

export function row(snippet: Snippet): HTMLElement {
  const element = named(snippet, [
    definition(snippet, snippet.query),
    actions([iconButton("moveToTop", "moveToTop"), iconButton("pencil", "edit"), iconButton("trash", "requestDelete", true)])
  ]);

  element.dataset.snippetAction = "use" satisfies SnippetAction;
  addTooltip(element, snippet.query);
  return element;
}

export function confirmRow(snippet: Snippet): HTMLElement {
  return named(snippet, [
    definition(snippet, "Delete this snippet?", SELECTORS.confirmPrompt),
    actions([textButton("Cancel", "cancelDelete", false), textButton("Delete", "delete", true)])
  ]);
}

export function placeholder(text: string): HTMLElement {
  return createElement("div", { className: SELECTORS.empty, textContent: text });
}

function named(snippet: Snippet, children: HTMLElement[]): HTMLElement {
  const element = createElement("div", { className: SELECTORS.row, children });

  element.dataset.snippetName = snippet.name;
  return element;
}

function definition(snippet: Snippet, subtitle: string, subtitleClass: string = ""): HTMLElement {
  return createElement("div", {
    className: SELECTORS.definition,
    children: [
      createElement("div", { className: SELECTORS.name, textContent: `/${snippet.name}` }),
      createElement("div", { className: `${SELECTORS.query} ${subtitleClass}`.trim(), textContent: subtitle })
    ]
  });
}

function actions(buttons: HTMLElement[]): HTMLElement {
  return createElement("div", { className: SELECTORS.actions, children: buttons });
}

function iconButton(iconName: IconName, action: SnippetAction, danger: boolean = false): HTMLElement {
  return button(createElement("button", { className: SELECTORS.action, children: [icon(iconName)] }), action, danger);
}

function textButton(label: string, action: SnippetAction, danger: boolean): HTMLElement {
  return button(createElement("button", { className: SELECTORS.confirmButton, textContent: label }), action, danger);
}

function button(element: HTMLButtonElement, action: SnippetAction, danger: boolean): HTMLElement {
  element.type = "button";
  element.dataset.snippetAction = action;
  toggleDataset(element, "danger", danger);
  return element;
}
