import { Setting } from "@/lib/ui/settings/setting";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/element";
import { setDataset } from "@/utils/browser/dataset";

type RowConfig = Partial<Pick<Setting<unknown>, "label" | "tooltip" | "tooltipPosition" | "enabled">> & { options?: Map<unknown, string> };

export function controlRow(config: RowConfig, control: HTMLElement, tag: "div" | "label" = "div"): HTMLElement {
  control.classList.add(SettingsClass.control);
  const text = createElement("span", { className: SettingsClass.rowLabel, textContent: config.label ?? "" });
  const row = createElement(tag, { className: SettingsClass.row, children: [text, control] });

  if (config.enabled === false) {
    setDataset(row, "disabled");
  }
  addTooltip(row, config.tooltip ?? "", config.tooltipPosition ?? "above");
  setDataset(row, "keywords", keywordsOf(config));
  return row;
}

function keywordsOf(config: RowConfig): string {
  return [config.label ?? "", config.tooltip ?? "", ...(config.options?.values() ?? [])].join(" ").toLowerCase();
}
