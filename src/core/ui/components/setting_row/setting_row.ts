export const SettingRowClass = {
  root: "fsg-SettingRow",
  text: "fsg-SettingRow-text",
  label: "fsg-SettingRow-label",
  description: "fsg-SettingRow-description"
} as const;

export type SettingRowSize = "medium" | "small";

export interface SettingRowOptions {
  label: string;
  description?: string;
  control: HTMLElement;
  size?: SettingRowSize;
}

export interface SettingRow {
  readonly element: HTMLDivElement;
  setDescriptionVisible: (visible: boolean) => void;
}

// One setting: its label and caption beside one control (libadwaita ActionRow, Primer FormControl).
// The text names and describes the control by element reference, so no ids are needed.
export function createSettingRow(ownerDocument: Document, { label, description, control, size = "medium" }: SettingRowOptions): SettingRow {
  const element = ownerDocument.createElement("div");
  const text = ownerDocument.createElement("div");
  const labelElement = createText(ownerDocument, { className: SettingRowClass.label, content: label });
  const descriptionElement = createDescription(ownerDocument, description);

  element.className = SettingRowClass.root;
  element.dataset.size = size;
  text.className = SettingRowClass.text;
  text.append(labelElement);
  control.ariaLabelledByElements = [labelElement];

  if (descriptionElement !== undefined) {
    text.append(descriptionElement);
    control.ariaDescribedByElements = [descriptionElement];
  }
  element.append(text, control);
  return {
    element,
    setDescriptionVisible: (visible): void => {
      if (descriptionElement !== undefined) {
        descriptionElement.hidden = !visible;
      }
    }
  };
}

function createDescription(ownerDocument: Document, description: string | undefined): HTMLSpanElement | undefined {
  return description === undefined ? undefined : createText(ownerDocument, { className: SettingRowClass.description, content: description });
}

function createText(ownerDocument: Document, { className, content }: { className: string; content: string }): HTMLSpanElement {
  const span = ownerDocument.createElement("span");

  span.className = className;
  span.textContent = content;
  return span;
}
