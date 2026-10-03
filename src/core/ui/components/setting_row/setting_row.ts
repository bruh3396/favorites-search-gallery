export const SettingRowClass = {
  root: "fsg-SettingRow",
  text: "fsg-SettingRow-text",
  label: "fsg-SettingRow-label",
  description: "fsg-SettingRow-description"
} as const;

export interface SettingRowOptions {
  label: string;
  description?: string;
  control: HTMLElement;
}

export interface SettingRow {
  readonly element: HTMLDivElement;
}

// One setting: its label and caption beside one control (libadwaita ActionRow, Primer FormControl).
// The text names and describes the control by element reference, so no ids are needed.
export function createSettingRow(ownerDocument: Document, { label, description, control }: SettingRowOptions): SettingRow {
  const element = ownerDocument.createElement("div");
  const text = ownerDocument.createElement("div");
  const labelElement = createText(ownerDocument, { className: SettingRowClass.label, content: label });

  element.className = SettingRowClass.root;
  text.className = SettingRowClass.text;
  text.append(labelElement);
  control.ariaLabelledByElements = [labelElement];

  if (description !== undefined) {
    const descriptionElement = createText(ownerDocument, { className: SettingRowClass.description, content: description });

    text.append(descriptionElement);
    control.ariaDescribedByElements = [descriptionElement];
  }
  element.append(text, control);
  return { element };
}

function createText(ownerDocument: Document, { className, content }: { className: string; content: string }): HTMLSpanElement {
  const span = ownerDocument.createElement("span");

  span.className = className;
  span.textContent = content;
  return span;
}
