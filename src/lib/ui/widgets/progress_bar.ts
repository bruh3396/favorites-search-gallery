import { ProgressBar } from "@/types/element";
import { clamp } from "@/utils/number";
import { createElement } from "@/utils/dom/element_factory";
import { toggleDataset } from "@/utils/dom/dataset";

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
