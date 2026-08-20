import { SelectSetting, Setting } from "@/lib/ui/settings/setting";
import { SettingsClass } from "@/lib/ui/settings/classes";
import { addTooltip } from "@/lib/ui/tooltip/tooltip";
import { createElement } from "@/utils/browser/element";
import { setDataset } from "@/utils/browser/dataset";

export function controlRow<T>(config: Partial<Setting<T>>, control: HTMLElement): HTMLElement {
  control.classList.add(SettingsClass.control);
  const text = createElement("span", { className: SettingsClass.rowLabel, textContent: config.label ?? "" });
  const row = createElement("div", { className: SettingsClass.row, children: [text, control] });

  if (config.enabled === false) {
    setDataset(row, "disabled");
  }
  addTooltip(row, config.tooltip ?? "", config.tooltipPosition ?? "above");
  setDataset(row, "keywords", keywordsOf(config));
  return row;
}

function keywordsOf<T>(config: Partial<Setting<T>>): string {
  const { options } = config as Partial<SelectSetting<string>>;
  return [config.label ?? "", config.tooltip ?? "", ...(options?.values() ?? [])].join(" ").toLowerCase();
}
