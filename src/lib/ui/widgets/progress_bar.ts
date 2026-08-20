import { clamp } from "@/utils/pure/number";
import { createElement } from "@/utils/browser/element";
import { toggleDataset } from "@/utils/browser/dataset";

export interface ProgressBar {
  element: HTMLElement;
  setLabel: (text: string) => void;
  setProgress: (completed: number, total: number) => void;
  setVisible: (visible: boolean) => void;
}

export function buildProgressBar(id?: string): ProgressBar {
  const fill = createElement("div", { className: "progress-bar-fill" });
  const label = createElement("div", { className: "progress-bar-label" });
  const element = createElement("div", { id, className: "progress-bar", children: [fill, label] });
  return {
    element,
    setLabel: (text: string): void => {
      label.textContent = text;
    },
    setProgress: (completed: number, total: number): void => {
      const ratio = total <= 0 ? 0 : clamp(completed / total, 0, 1);

      fill.style.width = `${ratio * 100}%`;
    },
    setVisible: (visible: boolean): void => {
      toggleDataset(element, "visible", visible);
    }
  };
}
