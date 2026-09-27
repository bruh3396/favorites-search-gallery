import { SnippetAction } from "@/features/favorites/features/snippets/types/types";
import { WidgetSelectors } from "@/lib/ui/widgets/selectors";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/element";
import { separator } from "@/lib/ui/widgets/separator";

const SELECTORS = {
  filter: "favorites-snippets-filter",
  list: "favorites-snippets-list",
  rule: "favorites-snippets-rule",
  eyebrow: "favorites-snippets-eyebrow",
  editor: "favorites-snippets-editor",
  field: "favorites-snippets-field",
  queryField: "favorites-snippets-query-field",
  error: "favorites-snippets-error",
  editorActions: "favorites-snippets-editor-actions",
  button: "favorites-snippets-button",
  primaryButton: "favorites-snippets-primary-button",
  footer: "favorites-snippets-footer"
} as const;

export class SnippetShell {
  public readonly filter: HTMLElement;
  public readonly list: HTMLElement;
  public readonly eyebrow: HTMLElement;
  public readonly nameField: HTMLInputElement;
  public readonly queryField: HTMLTextAreaElement;
  public readonly errorMessage: HTMLElement;
  public readonly cancelButton: HTMLButtonElement;
  public readonly resultsButton: HTMLButtonElement;
  public readonly saveButton: HTMLButtonElement;
  public readonly editorActions: HTMLElement;
  public readonly footer: HTMLElement;

  constructor() {
    this.filter = createElement("div", { className: `${SELECTORS.filter} ${WidgetSelectors.separatorBelow}` });
    this.list = createElement("div", { className: SELECTORS.list });
    this.eyebrow = createElement("div", { className: SELECTORS.eyebrow });
    this.nameField = field(createElement("input", { className: `${WidgetSelectors.textField} ${SELECTORS.field}` }), "name");
    this.queryField = field(createElement("textarea", { className: `${WidgetSelectors.textField} ${SELECTORS.field} ${SELECTORS.queryField}` }), "query");
    this.errorMessage = createElement("div", { className: SELECTORS.error });
    this.cancelButton = button("Cancel", `${WidgetSelectors.actionButton} ${SELECTORS.button}`, "cancelEdit");
    this.resultsButton = button("Results", WidgetSelectors.actionButton, "fillQueryFromResults");
    this.saveButton = button("Save", `${WidgetSelectors.actionButton} ${SELECTORS.primaryButton}`, "save");
    this.editorActions = createElement("div", { className: SELECTORS.editorActions, children: [this.cancelButton, this.resultsButton, this.saveButton] });
    this.footer = createElement("div", {
      className: SELECTORS.footer,
      children: [
        separator(SELECTORS.rule),
        this.eyebrow,
        createElement("div", { className: SELECTORS.editor, children: [this.nameField, this.errorMessage, this.queryField, this.editorActions] })
      ]
    });
    this.nameField.type = "text";
    addTooltip(this.resultsButton, "Query from search results");
  }
}

function field<F extends HTMLInputElement | HTMLTextAreaElement>(element: F, placeholder: string): F {
  element.placeholder = placeholder;
  element.spellcheck = false;
  element.autocomplete = "off";
  return element;
}

function button(label: string, className: string, action: SnippetAction): HTMLButtonElement {
  const element = createElement("button", { className, textContent: label });

  element.type = "button";
  element.dataset.snippetAction = action;
  return element;
}
