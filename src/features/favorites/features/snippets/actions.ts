import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/dom/element_factory";
import { icon } from "@/lib/ui/icon";
import { selectFile } from "@/utils/browser/upload";

export function exportButton(onExport: () => void): HTMLElement {
  const button = createElement("button", { children: [icon("upload")] });

  button.type = "button";
  addTooltip(button, "Export", "below");
  button.addEventListener("click", onExport);
  return button;
}

export function deleteAllButton(onDeleteAll: () => void): HTMLElement {
  const button = createElement("button", { children: [icon("reset")] });

  button.type = "button";
  addTooltip(button, "Delete all", "below");
  button.addEventListener("click", onDeleteAll);
  return button;
}

export function importButton(onImport: (contents: string) => void): HTMLElement {
  const button = createElement("button", { children: [icon("download")] });

  button.type = "button";
  addTooltip(button, "Import", "below");
  button.addEventListener("click", () => {
    selectFile("application/json,.json", onImport);
  });
  return button;
}
