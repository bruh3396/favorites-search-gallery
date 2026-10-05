import { Readable, effect } from "@/core/utils/reactive/signal";
import { ControlSize } from "@/core/ui/components/control";
import { doNothing } from "@/core/utils/function/function";

export const SettingRowClass = {
  root: "fsg-SettingRow",
  text: "fsg-SettingRow-text",
  label: "fsg-SettingRow-label",
  description: "fsg-SettingRow-description"
} as const;

export interface SettingRowOptions {
  label: string;
  description?: string;
  descriptionVisible?: Readable<boolean>;
  control: HTMLElement;
  size?: ControlSize;
}

export interface SettingRow {
  readonly element: HTMLDivElement;
  dispose: () => void;
}

// One setting: its label and caption beside one control (libadwaita ActionRow, Primer FormControl).
// The text names and describes the control by element reference, so no ids are needed.
export function createSettingRow(
  ownerDocument: Document,
  { label, description, descriptionVisible, control, size = "medium" }: SettingRowOptions
): SettingRow {
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
  return { element, dispose: bindDescriptionVisible(descriptionElement, descriptionVisible) };
}

function bindDescriptionVisible(descriptionElement: HTMLSpanElement | undefined, visible: Readable<boolean> | undefined): () => void {
  if (descriptionElement === undefined || visible === undefined) {
    return doNothing;
  }
  return effect(() => {
    descriptionElement.hidden = !visible.value;
  });
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
